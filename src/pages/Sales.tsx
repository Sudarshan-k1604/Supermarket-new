import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Plus, ShoppingCart, Download, Check, Loader2, Minus, User, QrCode, CreditCard, Store, Sparkles,
    CheckCircle, Search, History, ServerOff, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveSaleOffline, getOfflineSales, deleteSyncedSale, BillData as OfflineBillData } from '@/utils/offlineUtils';

// --- Type Definitions ---
interface InventoryItem { id: string; item_name: string; category: string; quantity: number; unit_price: number; is_available: boolean; }
interface CartItem extends InventoryItem { cart_quantity: number; }
interface Customer { name: string; phone: string; email: string; address: string; }
interface CompanyInfo { name: string; address: string; phone: string; email: string; upi_id?: string; }
interface Sale { id: string; created_at: string; customer_name: string; customer_phone: string; total_amount: number; items: any; bill_data: any; profiles?: { email: string } | null; }
interface BillItem { id: string; item_name: string; cart_quantity: number; unit_price: number; total_price: number; }
// Ensure our BillData type is compatible with the offline utility's type
interface BillData extends OfflineBillData {}

// --- Default Company Information ---
const defaultCompanyInfo: CompanyInfo = {
    name: 'Sri Lakshmi Supermarket',
    address: '#45, Main Road, V.V. Nagar, Mandya, Karnataka - 571401',
    phone: '+91 98765 43210',
    email: 'contact@srilakshmisupermarket.com',
    upi_id: 'srilakshmi-supermarket@okaxis',
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

// --- Main Sales Component ---
const Sales = () => {
    const { toast } = useToast();
    const { user, isAdmin } = useAuth();
    const queryClient = useQueryClient();

    // --- State Management ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', address: '' });
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('cart');
    const [dialogs, setDialogs] = useState({ payment: false, success: false, history: false });
    const [completedBill, setCompletedBill] = useState<BillData | null>(null);
    const [selectedHistorySale, setSelectedHistorySale] = useState<Sale | null>(null);
    const [paymentBillId, setPaymentBillId] = useState('');
    
    // --- Offline State ---
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingSaleCount, setPendingSaleCount] = useState(0);

    // --- Data Fetching & Mutations ---
    const { data: inventoryItems = [], isLoading: isInventoryLoading } = useQuery({
        queryKey: ['adminInventory'],
        queryFn: async () => {
            const { data: adminProfile, error: adminError } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
            if (adminError || !adminProfile) { throw new Error('Could not find an admin user to load inventory from.'); }

            const { data, error } = await supabase.from('inventory').select('*').order('item_name');
            if (error) throw new Error(error.message);
            return data || [];
        },
    });

    const { data: salesHistory = [] } = useQuery({
        queryKey: ['sales-history', user?.id, isAdmin],
        queryFn: async () => {
            if (!user) return [];
            const selectStatement = isAdmin ? '*, profiles(email)' : '*';
            let query = supabase.from('sales').select(selectStatement).order('created_at', { ascending: false });
            if (!isAdmin) query = query.eq('user_id', user.id);
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data as Sale[] || [];
        },
        enabled: !!user?.id,
    });

    const processSaleMutation = useMutation({
        mutationFn: async (billData: BillData) => {
            // This function is now used for both direct online sales and syncing offline sales.
            const { error: saleError } = await supabase.from('sales').insert([{
                user_id: billData.userId,
                customer_name: billData.customer.name,
                customer_phone: billData.customer.phone,
                total_amount: billData.finalAmount,
                items: billData.items,
                bill_data: billData,
            }]);
            if (saleError) throw new Error(`Transaction failed: ${saleError.message}`);

            for (const item of billData.items) {
                const { error: stockError } = await supabase.rpc('decrement_stock', {
                    item_id: item.id,
                    decrement_quantity: item.cart_quantity,
                });
                if (stockError) console.warn(`Could not decrement stock for ${item.item_name}: ${stockError.message}`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
            queryClient.invalidateQueries({ queryKey: ['sales-history', user?.id, isAdmin] });
        },
    });

    // --- Offline Sync Logic ---
    const syncOfflineSales = useCallback(async () => {
        if (isSyncing || !user) return;
        setIsSyncing(true);
        const pendingSales = await getOfflineSales();
        setPendingSaleCount(pendingSales.length);
        
        if (pendingSales.length === 0) {
            setIsSyncing(false);
            return;
        }
        
        toast({ title: 'Syncing...', description: `Uploading ${pendingSales.length} offline sale(s).` });
        let successCount = 0;
        for (const billData of pendingSales) {
            try {
                await processSaleMutation.mutateAsync(billData);
                await deleteSyncedSale(billData.billId);
                successCount++;
            } catch (error) {
                console.error(`Failed to sync sale ${billData.billId}:`, error);
            }
        }
        
        if (successCount > 0) {
            toast({ title: 'Sync Complete', description: `${successCount} sale(s) successfully synced.`, className: "bg-green-100 border-green-400" });
        }
        
        const remaining = await getOfflineSales();
        setPendingSaleCount(remaining.length);
        setIsSyncing(false);
    }, [isSyncing, user, processSaleMutation, toast]);

    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOffline(!navigator.onLine);
            if (navigator.onLine) {
                toast({ title: "You are back online!", description: "Checking for pending sales..." });
                syncOfflineSales();
            } else {
                toast({ title: "You are offline", description: "Sales will be saved locally.", variant: "destructive" });
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Initial check
        getOfflineSales().then(sales => setPendingSaleCount(sales.length));
        if (navigator.onLine) syncOfflineSales();
        
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, [syncOfflineSales, toast]);


    // --- Memoized Calculations ---
    const filteredInventoryItems = useMemo(() => {
        if (!searchTerm) return inventoryItems;
        return inventoryItems.filter(item => item.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, inventoryItems]);

    const cartTotals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.cart_quantity * item.unit_price), 0);
        return { subtotal, finalAmount: subtotal };
    }, [cart]);

    // --- Core Handlers ---
    const addToCart = (itemId: string) => {
        const itemToAdd = inventoryItems.find(i => i.id === itemId);
        if (!itemToAdd) return;

        if (!itemToAdd.is_available) {
            toast({ title: "Item Unavailable", description: `${itemToAdd.item_name} is currently not available for sale.`, variant: "destructive" });
            return;
        }

        const existingItem = cart.find(i => i.id === itemId);
        const availableStock = itemToAdd.quantity - (existingItem?.cart_quantity || 0);

        if (availableStock <= 0) {
            toast({ title: "Out of Stock", description: `No more units of ${itemToAdd.item_name} available.`, variant: "destructive" });
            return;
        }

        if (existingItem) {
            setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: i.cart_quantity + 1 } : i));
        } else {
            setCart([...cart, { ...itemToAdd, cart_quantity: 1 }]);
        }
    };

    const updateCartQuantity = (itemId: string, newQuantity: number) => {
        const inventoryItem = inventoryItems.find(i => i.id === itemId);
        if (newQuantity <= 0) {
            setCart(cart.filter(i => i.id !== itemId));
        } else if (inventoryItem && newQuantity > inventoryItem.quantity) {
            toast({ title: "Stock Limit Reached", description: `Only ${inventoryItem.quantity} units available.`, variant: "destructive" });
        } else {
            setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: newQuantity } : i));
        }
    };

    const proceedToPayment = () => {
        if (cart.length === 0) {
            toast({ title: "Empty Cart", description: "Please add items first.", variant: "destructive" });
            return;
        }
        if (!customer.phone) {
            toast({ title: "Customer Info Missing", description: "Please enter customer phone number.", variant: "destructive" });
            setActiveTab('customer');
            return;
        }
        setPaymentBillId(`INV-${Date.now()}`);
        setDialogs({ ...dialogs, payment: true });
    };

    const completeSale = async (paymentMethod: 'cash' | 'online') => {
        const billData: BillData = {
            billId: paymentBillId,
            items: cart.map(item => ({ id: item.id, item_name: item.item_name, cart_quantity: item.cart_quantity, unit_price: item.unit_price, total_price: item.cart_quantity * item.unit_price })),
            customer: { ...customer, name: customer.name || 'Walk-in Customer' },
            subtotal: cartTotals.subtotal,
            finalAmount: cartTotals.finalAmount,
            notes,
            timestamp: new Date(),
            companyInfo: defaultCompanyInfo,
            paymentMethod,
            userId: user!.id,
        };

        setCompletedBill(billData);
        setDialogs({ payment: false, success: true, history: false });

        if (isOffline) {
            await saveSaleOffline(billData);
            setPendingSaleCount(prev => prev + 1);
            toast({ title: "Sale Saved Offline", description: "This sale will be synced when you're back online." });
        } else {
            try {
                await processSaleMutation.mutateAsync(billData);
            } catch (error: any) {
                toast({ title: "Transaction Failed", description: error.message, variant: "destructive" });
                setDialogs({ ...dialogs, success: false }); // Don't show success if it failed
            }
        }
    };

    const resetSale = () => {
        setCart([]);
        setCustomer({ name: '', phone: '', email: '', address: '' });
        setNotes('');
        setSearchTerm('');
        setCompletedBill(null);
        setActiveTab('cart');
    };

    const viewSaleDetails = (sale: Sale) => {
        const billData = typeof sale.bill_data === 'string' ? JSON.parse(sale.bill_data) : sale.bill_data;
        setSelectedHistorySale({ ...sale, bill_data: billData });
        setDialogs({ ...dialogs, history: true });
    };

    const generatePdfInvoice = (bill: BillData) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;

        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text(bill.companyInfo.name, margin, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(bill.companyInfo.address, margin, 28);
        doc.text(`Phone: ${bill.companyInfo.phone}`, margin, 34);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', pageWidth - margin, 20, { align: 'right' });
        doc.setLineWidth(0.5);
        doc.line(margin, 42, pageWidth - margin, 42);
        doc.setFontSize(10);
        doc.text('Bill To:', margin, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(bill.customer.name, margin, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(bill.customer.phone, margin, 62);
        doc.setFont('helvetica', 'bold');
        doc.text('Invoice ID:', pageWidth - 55, 50);
        doc.text('Date:', pageWidth - 55, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(bill.billId, pageWidth - margin, 50, { align: 'right' });
        doc.text(format(new Date(bill.timestamp), 'dd MMM, yyyy'), pageWidth - margin, 56, { align: 'right' });

        autoTable(doc, {
            startY: 75,
            head: [['#', 'Item', 'Qty', 'Rate', 'Total']],
            body: bill.items.map((item, i) => [i + 1, item.item_name, item.cart_quantity, formatCurrency(item.unit_price), formatCurrency(item.total_price)]),
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Amount:', pageWidth - 55, finalY);
        doc.text(formatCurrency(bill.finalAmount), pageWidth - margin, finalY, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('Thank you for your business!', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
        doc.save(`Invoice-${bill.billId}.pdf`);
    };

    if (isInventoryLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <Store className="h-8 w-8 text-primary"/> Point of Sale
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{defaultCompanyInfo.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {pendingSaleCount > 0 && !isSyncing && <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2 border-amber-400 text-amber-600"><History className="h-4 w-4"/>{pendingSaleCount} pending</Badge>}
                        {isOffline && <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2 animate-pulse"><ServerOff className="h-4 w-4"/>Offline Mode</Badge>}
                        {isAdmin && <Badge variant="default" className="flex items-center gap-1.5 py-1 px-2 bg-indigo-600 hover:bg-indigo-700"><ShieldCheck className="h-4 w-4"/>Admin View</Badge>}
                    </div>
                </header>
                
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
                            </CardHeader>
                            <CardContent className="max-h-[70vh] overflow-y-auto p-4">
                                {filteredInventoryItems.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {filteredInventoryItems.map(item => {
                                            const isUnavailable = !item.is_available || item.quantity <= 0;
                                            return (
                                                <Card key={item.id} className={`relative overflow-hidden transition-all group ${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-primary'}`} onClick={() => !isUnavailable && addToCart(item.id)}>
                                                    {isUnavailable && (<div className="absolute inset-0 bg-slate-500/40 flex items-center justify-center z-10"><Badge variant="destructive" className="text-sm">{item.quantity <= 0 ? 'Out of Stock' : 'Unavailable'}</Badge></div>)}
                                                    <CardContent className="p-3 flex flex-col justify-between h-full">
                                                        <div>
                                                            <h3 className={`font-semibold text-sm truncate ${!isUnavailable ? 'group-hover:text-primary' : ''}`}>{item.item_name}</h3>
                                                            <p className="font-bold text-base my-1">{formatCurrency(item.unit_price)}</p>
                                                        </div>
                                                        <Badge variant={item.quantity > 10 ? 'outline' : 'destructive'} className="text-xs w-fit">{item.quantity} in stock</Badge>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                ) : <div className="text-center py-16 text-muted-foreground"><Search className="h-12 w-12 mx-auto text-slate-300"/><p className="mt-4">No products found.</p></div>}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 shadow-sm">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800">
                                    <TabsTrigger value="cart"><ShoppingCart className="h-4 w-4 mr-1"/>Cart ({cart.length})</TabsTrigger>
                                    <TabsTrigger value="customer"><User className="h-4 w-4 mr-1"/>Customer</TabsTrigger>
                                    <TabsTrigger value="history"><History className="h-4 w-4 mr-1"/>History</TabsTrigger>
                                </TabsList>
                                <TabsContent value="cart" className="p-4">
                                    <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                                        {cart.length === 0 ? <div className="text-center py-10"><ShoppingCart className="h-12 w-12 mx-auto text-gray-300"/><p className="mt-2 text-sm text-gray-500">Your cart is empty</p></div> : cart.map(item => (
                                            <div key={item.id} className="flex items-center gap-4">
                                                <div className="flex-1"><p className="font-semibold text-sm">{item.item_name}</p><p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)}</p></div>
                                                <div className="flex items-center gap-1 border rounded-md"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.cart_quantity - 1)}><Minus className="h-3 w-3"/></Button><span className="w-6 text-center text-sm font-medium">{item.cart_quantity}</span><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQuantity(item.id, item.cart_quantity + 1)}><Plus className="h-3 w-3"/></Button></div>
                                                <p className="w-20 text-right font-medium">{formatCurrency(item.cart_quantity * item.unit_price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {cart.length > 0 && <div className="mt-4 border-t pt-4 space-y-2"><div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(cartTotals.finalAmount)}</span></div><Button onClick={proceedToPayment} className="w-full mt-4"><CreditCard className="h-4 w-4 mr-2"/> Proceed to Checkout</Button></div>}
                                </TabsContent>
                                <TabsContent value="customer" className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                    <div><Label htmlFor="c-phone">Phone *</Label><Input id="c-phone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} /></div>
                                    <div><Label htmlFor="c-name">Name (Optional)</Label><Input id="c-name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} /></div>
                                    <div><Label htmlFor="c-email">Email (Optional)</Label><Input id="c-email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} /></div>
                                    <div><Label htmlFor="notes">Notes for Invoice</Label><Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
                                </TabsContent>
                                <TabsContent value="history" className="p-0"><CustomerHistoryPanel salesHistory={salesHistory} onSaleSelect={viewSaleDetails} isAdmin={isAdmin} /></TabsContent>
                            </Tabs>
                        </Card>
                    </div>
                </main>
                
                <Dialog open={dialogs.payment} onOpenChange={(isOpen) => setDialogs({...dialogs, payment: isOpen})}>
                    <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Complete Payment</DialogTitle><DialogDescription>Choose a payment method to finalize the sale.</DialogDescription></DialogHeader>
                    <Tabs defaultValue="upi" className="w-full">
                        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="upi"><QrCode className="h-4 w-4 mr-2"/>UPI / QR</TabsTrigger><TabsTrigger value="cash"><CreditCard className="h-4 w-4 mr-2"/>Cash</TabsTrigger></TabsList>
                        <TabsContent value="upi" className="text-center p-4 space-y-4">
                            <p>Scan QR to pay <strong>{formatCurrency(cartTotals.finalAmount)}</strong>.</p>
                            <div className="p-4 bg-white inline-block rounded-lg border"><QRCodeSVG value={`upi://pay?pa=${defaultCompanyInfo.upi_id}&pn=${encodeURIComponent(defaultCompanyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&tn=${paymentBillId}`} size={180} /></div>
                            <Button className="w-full" onClick={() => completeSale('online')} disabled={processSaleMutation.isPending && !isOffline}>{(processSaleMutation.isPending && !isOffline) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />}{isOffline ? 'Save Offline' : 'Confirm Payment'}</Button>
                        </TabsContent>
                        <TabsContent value="cash" className="p-4 space-y-4">
                            <div className="text-center p-6 border rounded-lg bg-slate-50"><p className="text-muted-foreground">Total Amount Due</p><p className="text-4xl font-bold text-primary">{formatCurrency(cartTotals.finalAmount)}</p></div>
                            <Button className="w-full" onClick={() => completeSale('cash')} disabled={processSaleMutation.isPending && !isOffline}>{(processSaleMutation.isPending && !isOffline) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-2"/>}{isOffline ? 'Save Offline' : 'Confirm Cash Payment'}</Button>
                        </TabsContent>
                    </Tabs>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogs.success} onOpenChange={(isOpen) => setDialogs({...dialogs, success: isOpen})}>
                    <DialogContent className="max-w-md"><DialogHeader className="text-center"><Sparkles className="h-16 w-16 mx-auto text-green-500 bg-green-100 p-3 rounded-full"/><DialogTitle className="text-2xl mt-4">Transaction Successful!</DialogTitle></DialogHeader>
                    <div className="py-6 space-y-3"><Button className="w-full" variant="outline" onClick={() => completedBill && generatePdfInvoice(completedBill)}><Download className="h-4 w-4 mr-2"/>Download PDF Invoice</Button></div>
                    <DialogFooter><Button className="w-full" onClick={() => { setDialogs({...dialogs, success: false}); resetSale(); }}><Plus className="h-4 w-4 mr-2"/>Start New Sale</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={dialogs.history} onOpenChange={(isOpen) => setDialogs({...dialogs, history: isOpen})}>
                    <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Sale Details</DialogTitle><DialogDescription>Invoice ID: {selectedHistorySale?.bill_data?.billId}</DialogDescription></DialogHeader>
                    {selectedHistorySale?.bill_data && <div className="py-4 max-h-[70vh] overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{selectedHistorySale.bill_data.items.map((item: BillItem, index: number) => (<TableRow key={index}><TableCell>{item.item_name}</TableCell><TableCell>{item.cart_quantity}</TableCell><TableCell>{formatCurrency(item.unit_price)}</TableCell><TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell></TableRow>))}</TableBody></Table><div className="flex justify-end mt-4 pt-4 border-t"><div className="w-64"><div className="flex justify-between font-bold text-base"><span>Grand Total:</span><span>{formatCurrency(selectedHistorySale.total_amount)}</span></div></div></div></div>}
                    <DialogFooter><Button variant="outline" onClick={() => selectedHistorySale?.bill_data && generatePdfInvoice(selectedHistorySale.bill_data)}>Download Again</Button><Button onClick={() => setDialogs({...dialogs, history: false})}>Close</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

// --- Smart History Panel Component with Search ---
const CustomerHistoryPanel = ({ salesHistory, onSaleSelect, isAdmin }: { salesHistory: Sale[], onSaleSelect: (sale: Sale) => void, isAdmin: boolean }) => {
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [historySearch, setHistorySearch] = useState('');

    const customerGroups = useMemo(() => {
        const groups = new Map<string, { name: string; sales: Sale[] }>();
        salesHistory.forEach(sale => {
            if (!sale.customer_phone) return;
            if (!groups.has(sale.customer_phone)) {
                groups.set(sale.customer_phone, { name: sale.customer_name, sales: [] });
            }
            groups.get(sale.customer_phone)!.sales.push(sale);
        });
        const sortedGroups = Array.from(groups.values()).sort((a, b) => new Date(b.sales[0].created_at).getTime() - new Date(a.sales[0].created_at).getTime());
        if (!historySearch) return sortedGroups;
        return sortedGroups.filter(group => group.name.toLowerCase().includes(historySearch.toLowerCase()) || group.sales[0].customer_phone.includes(historySearch));
    }, [salesHistory, historySearch]);

    if (selectedPhone) {
        const customerData = customerGroups.find(g => g.sales[0].customer_phone === selectedPhone);
        return (
            <div className="p-4">
                <Button variant="ghost" onClick={() => setSelectedPhone(null)} className="mb-4 -ml-4"><ChevronLeft className="h-4 w-4 mr-2"/> Back to Customers</Button>
                <h3 className="font-semibold text-lg">{customerData?.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{selectedPhone}</p>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                    {customerData?.sales.map(sale => (
                        <div key={sale.id} className="text-sm p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => onSaleSelect(sale)}>
                            <div className="flex justify-between font-semibold"><span>{sale.bill_data?.billId || 'INV-LEGACY'}</span><span>{formatCurrency(sale.total_amount)}</span></div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1 space-x-2">
                                <span>{(sale.items as any[]).length} items</span>
                                {isAdmin && <span className="truncate" title={sale.profiles?.email || 'Unknown'}>By: {sale.profiles?.email?.split('@')[0] || 'N/A'}</span>}
                                <span className="flex-shrink-0">{format(new Date(sale.created_at), 'dd MMM, hh:mm a')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by name or phone..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="pl-9" /></div>
            <div className="max-h-[52vh] overflow-y-auto space-y-3">
                {customerGroups.length === 0 ? <p className="text-center text-sm text-muted-foreground py-10">No customer history found.</p> : customerGroups.map(group => (
                    <div key={group.sales[0].customer_phone} className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setSelectedPhone(group.sales[0].customer_phone)}>
                        <div className="flex justify-between font-semibold"><span>{group.name || 'Walk-in'}</span><Badge variant="secondary">{group.sales.length} orders</Badge></div>
                        <p className="text-sm text-muted-foreground">{group.sales[0].customer_phone}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sales;