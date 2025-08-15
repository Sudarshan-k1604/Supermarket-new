import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus, ShoppingCart, Download, Mail, Check, Loader2, Minus, User, QrCode, CreditCard, Store, Sparkles,
    CheckCircle, Search, Archive, AlertTriangle, ListRestart, X, History, ShoppingBag
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { format, formatDistanceToNow } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ADMIN_USER_ID } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Type Definitions ---
interface InventoryItem { id: string; item_name: string; category: string; quantity: number; unit_price: number; barcode?: string | null; image_url?: string | null; }
interface CartItem extends InventoryItem { cart_quantity: number; }
interface UserProfile { id: string; name?: string; phone?: string; email?: string; address?: string; }
interface Customer { name: string; phone: string; email: string; address: string; }
interface CompanyInfo { name: string; address: string; phone: string; email: string; upi_id?: string; }
interface BillItem { id: string; item_name: string; cart_quantity: number; unit_price: number; total_price: number; final_amount: number; }
interface BillData { billId: string; items: BillItem[]; customer: Customer; subtotal: number; finalAmount: number; notes: string; timestamp: Date; companyInfo: CompanyInfo; paymentMethod: 'cash' | 'online'; }
// NEW: Type for past orders fetched from the sales table
interface PastOrder { id: string; created_at: string; total_amount: number; items: Json; }

const CustomerPOSPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- State Management ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', address: '' });
    const [notes, setNotes] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [companyInfo] = useState<CompanyInfo>(() => { const saved = localStorage.getItem('companyInfo'); return saved ? JSON.parse(saved) : { name: 'Your Company', address: '123 Business St', phone: '9876543210', email: 'contact@company.com', upi_id: 'your-upi-id@okhdfcbank' }; });
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showSaleSuccessDialog, setShowSaleSuccessDialog] = useState(false);
    const [completedBill, setCompletedBill] = useState<BillData | null>(null);

    // --- Persistent Cart with localStorage ---
    useEffect(() => { const savedCart = localStorage.getItem('customerCart'); if (savedCart) { setCart(JSON.parse(savedCart)); } }, []);
    useEffect(() => { localStorage.setItem('customerCart', JSON.stringify(cart)); }, [cart]);

    // --- Data Fetching & Mutations with Tanstack Query ---
    const { data: userProfile, isLoading: isProfileLoading } = useQuery({ queryKey: ['userProfile', user?.id], queryFn: async (): Promise<UserProfile | null> => { if (!user) return null; const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single(); if (error && error.code !== 'PGRST116') throw new Error(error.message); return data ? { ...data, email: user.email } : null; }, enabled: !!user });
    useEffect(() => { if (userProfile) { setCustomer({ name: userProfile.name || '', phone: userProfile.phone || '', email: userProfile.email || '', address: userProfile.address || '' }); } }, [userProfile]);

    const { data: inventoryItems = [], isLoading: isInventoryLoading } = useQuery({ queryKey: ['inventory', ADMIN_USER_ID], queryFn: async () => { const { data, error } = await supabase.from('inventory').select('*').eq('user_id', ADMIN_USER_ID).order('item_name'); if (error) throw new Error(error.message); return data || []; }, enabled: !!ADMIN_USER_ID });

    // NEW: Fetch past orders for the logged-in customer
    const { data: pastOrders = [] } = useQuery({ queryKey: ['pastOrders', user?.id], queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('sales').select('id, created_at, total_amount, items').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10); if (error) throw new Error('Could not fetch past orders: ' + error.message); return data as PastOrder[]; }, enabled: !!user });

    const processSaleMutation = useMutation({ mutationFn: async (payload: { cartItems: any[]; customer: any; billData: any; }) => { const { data, error } = await supabase.functions.invoke('process-sale', { body: payload }); if (error) throw new Error(`Transaction failed: ${error.message}`); return data; }, onSuccess: (data, variables) => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); queryClient.invalidateQueries({ queryKey: ['pastOrders', user?.id] }); toast({ title: "Order Placed!", description: "Your payment was successful.", className: "bg-green-100 border-green-400" }); setCompletedBill(variables.billData); setShowPaymentDialog(false); setShowSaleSuccessDialog(true); resetSale(); }, onError: (error: any) => { toast({ title: "Payment Failed", description: error.message, variant: "destructive" }); } });
    const sendEmailMutation = useMutation({ mutationFn: async (vars: { to: string; subject: string; html: string; pdfBase64: string; pdfName: string }) => { const { error } = await supabase.functions.invoke('send-email', { body: vars }); if (error) throw new Error(`Failed to send email: ${error.message}`); }, onSuccess: () => { toast({ title: 'Email Sent!', description: 'The invoice has been sent.' }); }, onError: (error: Error) => { toast({ title: 'Email Failed', description: error.message, variant: 'destructive' }); } });

    // --- Memoized Calculations & Filtering ---
    const cartTotals = useMemo(() => { const subtotal = cart.reduce((acc, item) => acc + (item.cart_quantity * item.unit_price), 0); const billItems: BillItem[] = cart.map(item => ({ id: item.id, item_name: item.item_name, cart_quantity: item.cart_quantity, unit_price: item.unit_price, total_price: item.cart_quantity * item.unit_price, final_amount: item.cart_quantity * item.unit_price, })); return { items: billItems, subtotal, finalAmount: subtotal }; }, [cart]);
    const categories = useMemo(() => ['All', ...Array.from(new Set(inventoryItems.map(item => item.category)))], [inventoryItems]);
    const filteredInventoryItems = useMemo(() => { return inventoryItems.filter(item => { const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory; const matchesSearch = searchTerm ? item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) : true; return matchesCategory && matchesSearch; }); }, [searchTerm, selectedCategory, inventoryItems]);

    // --- Handlers ---
    const proceedToPayment = () => { if (cart.length === 0) { toast({ title: "Your cart is empty", description: "Please add items to your cart before proceeding.", variant: "destructive" }); return; } if (!customer.name || !customer.phone) { toast({ title: "Your details are missing", description: "Please ensure your name and phone are set in your profile.", variant: "destructive" }); return; } setShowPaymentDialog(true); };
    const completeSale = async (paymentMethod: 'cash' | 'online') => { const billData: BillData = { billId: `INV-${Date.now()}`, items: cartTotals.items, customer, subtotal: cartTotals.subtotal, finalAmount: cartTotals.finalAmount, notes, timestamp: new Date(), companyInfo, paymentMethod }; processSaleMutation.mutate({ cartItems: cart.map(item => ({ id: item.id, cart_quantity: item.cart_quantity })), customer: { name: customer.name, phone: customer.phone, email: customer.email }, billData }); };
    const resetSale = () => { setCart([]); setNotes(''); setSearchTerm(''); };
    const addToCart = (item: InventoryItem) => { const existing = cart.find(i => i.id === item.id); if (existing) { updateCartQuantity(item.id, existing.cart_quantity + 1); } else { if (item.quantity > 0) { setCart([...cart, { ...item, cart_quantity: 1 }]); } else { toast({ title: "Out of Stock", variant: "destructive" }); } } };
    const updateCartQuantity = (itemId: string, newQuantity: number) => { const itemInStock = inventoryItems.find(i => i.id === itemId); if (!itemInStock) return; if (newQuantity <= 0) { setCart(cart.filter(i => i.id !== itemId)); } else if (newQuantity > itemInStock.quantity) { toast({ title: "Stock limit reached", description: `Only ${itemInStock.quantity} available.`, variant: "destructive" }); } else { setCart(cart.map(i => i.id === itemId ? { ...i, cart_quantity: newQuantity } : i)); } };
    const generatePdfInvoice = (bill: BillData | null, outputType: 'save' | 'base64' = 'save') => { if (!bill) return null; const doc = new jsPDF(); const tableData = bill.items.map((item, i) => [i + 1, item.item_name, item.cart_quantity, `₹${item.unit_price.toFixed(2)}`, `₹${item.final_amount.toFixed(2)}`,]); doc.setFontSize(20); doc.text(bill.companyInfo.name, 14, 22); doc.setFontSize(10); doc.text(bill.companyInfo.address, 14, 30); doc.text(`Phone: ${bill.companyInfo.phone}`, 14, 36); autoTable(doc, { startY: 50, head: [['#', 'Description', 'Qty', 'Rate', 'Total']], body: tableData, theme: 'striped', headStyles: { fillColor: [38, 38, 38] } }); const finalY = (doc as any).lastAutoTable.finalY; doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`Grand Total: ₹${bill.finalAmount.toFixed(2)}`, 196, finalY + 15, { align: 'right' }); if (outputType === 'save') { doc.save(`invoice-${bill.billId}.pdf`); return null; } return doc.output('datauristring').split(',')[1]; };
    const handleSendEmail = () => { if (!completedBill || !completedBill.customer.email) { toast({ title: "Customer email not found.", variant: "destructive" }); return; } const pdfBase64 = generatePdfInvoice(completedBill, 'base64'); if (pdfBase64) { sendEmailMutation.mutate({ to: completedBill.customer.email, subject: `Invoice from ${completedBill.companyInfo.name}`, html: `<p>Hi ${completedBill.customer.name},</p><p>Thank you for your purchase! Your invoice is attached.</p>`, pdfBase64: pdfBase64, pdfName: `invoice-${completedBill.billId}.pdf` }); } };

    if (isInventoryLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    const CartContent = () => (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <ShoppingBag className="h-16 w-16 mx-auto text-gray-300" />
                        <p className="mt-4 font-medium">Your cart is empty</p>
                        <p className="text-sm">Add items from the menu to get started.</p>
                    </div>
                ) : cart.map(item => (
                    <motion.div layout key={item.id} className="flex items-center gap-4">
                        <img src={item.image_url || 'https://placehold.co/100'} alt={item.item_name} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.item_name}</p>
                            <p className="text-xs text-gray-500">₹{item.unit_price.toFixed(2)}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => updateCartQuantity(item.id, item.cart_quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                <span className="w-6 text-center text-sm font-medium">{item.cart_quantity}</span>
                                <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => updateCartQuantity(item.id, item.cart_quantity + 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                        </div>
                        <p className="font-semibold">₹{(item.cart_quantity * item.unit_price).toFixed(2)}</p>
                    </motion.div>
                ))}
            </div>
            {cart.length > 0 && (
                <div className="p-4 border-t bg-white dark:bg-gray-950">
                    <div className="flex justify-between items-center font-bold text-lg mb-4">
                        <span>Total</span>
                        <span>₹{cartTotals.finalAmount.toFixed(2)}</span>
                    </div>
                    <Button onClick={proceedToPayment} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white"><CreditCard className="h-5 w-5 mr-2" /> Proceed to Payment</Button>
                </div>
            )}
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />
            <div className="container mx-auto p-4">
                <Tabs defaultValue="menu" className="w-full">
                    <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3"><Store className="h-8 w-8 text-primary" /> Place Your Order</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Browse our menu and pay online.</p>
                        </div>
                        <TabsList>
                            <TabsTrigger value="menu">Menu</TabsTrigger>
                            <TabsTrigger value="history">My Past Orders</TabsTrigger>
                        </TabsList>
                    </header>

                    <TabsContent value="menu">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Product Catalog */}
                            <div className="lg:col-span-2">
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input placeholder="Search for food or drinks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                                    </div>
                                    <div className="flex-shrink-0">
                                        {/* Mobile Category Select - Hidden on larger screens */}
                                        <select onChange={(e) => setSelectedCategory(e.target.value)} className="sm:hidden w-full p-2 border rounded-md">
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="hidden sm:flex flex-wrap gap-2 mb-6">
                                    {categories.map(cat => (
                                        <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} onClick={() => setSelectedCategory(cat)}>{cat}</Button>
                                    ))}
                                </div>
                                <AnimatePresence>
                                    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredInventoryItems.map(item => (
                                            <motion.div layout key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <Card className="overflow-hidden group">
                                                    <CardContent className="p-0">
                                                        <img src={item.image_url || 'https://placehold.co/400x300'} alt={item.item_name} className="w-full h-40 object-cover" />
                                                        <div className="p-4">
                                                            <h3 className="font-semibold leading-tight">{item.item_name}</h3>
                                                            <div className="flex justify-between items-center mt-3">
                                                                <p className="font-bold text-lg text-primary">₹{item.unit_price.toFixed(2)}</p>
                                                                <Button size="sm" onClick={() => addToCart(item)} disabled={item.quantity === 0}>
                                                                    {item.quantity === 0 ? 'Out of Stock' : <><Plus className="h-4 w-4 mr-1" /> Add</>}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                                {filteredInventoryItems.length === 0 && <p className="text-center py-10 text-gray-500">No products match your search.</p>}
                            </div>

                            {/* Desktop Cart Sidebar */}
                            <div className="hidden lg:block lg:col-span-1">
                                <Card className="sticky top-20 shadow-lg h-[calc(100vh-120px)]">
                                    <CardHeader><CardTitle>My Order</CardTitle></CardHeader>
                                    <CartContent />
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader><CardTitle>Order History</CardTitle><CardDescription>Here are your recent completed orders.</CardDescription></CardHeader>
                            <CardContent className="space-y-4">
                                {pastOrders.length === 0 ? (
                                    <p className="text-center py-10 text-gray-500">You have no past orders.</p>
                                ) : (
                                    pastOrders.map(order => (
                                        <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                                            <div>
                                                <p className="font-semibold">Order #{order.id.slice(-6)}</p>
                                                <p className="text-sm text-gray-500">{format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">₹{order.total_amount.toFixed(2)}</p>
                                                <Badge variant="secondary">Completed</Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Mobile Cart Drawer */}
            <div className="lg:hidden">
                <Drawer>
                    <DrawerTrigger asChild>
                        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-4 left-4 right-4 z-50">
                            <Button size="lg" className="w-full shadow-2xl justify-between h-16 text-lg">
                                <span><ShoppingCart className="inline-block h-5 w-5 mr-2" /> View Cart ({cart.length})</span>
                                <span>₹{cartTotals.finalAmount.toFixed(2)}</span>
                            </Button>
                        </motion.div>
                    </DrawerTrigger>
                    <DrawerContent className="h-[85vh]">
                        <DrawerHeader>
                            <DrawerTitle>My Order</DrawerTitle>
                        </DrawerHeader>
                        <CartContent />
                    </DrawerContent>
                </Drawer>
            </div>
            
            {/* Payment & Success Dialogs */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Complete Payment</DialogTitle><DialogDescription>Choose a payment method for ₹{cartTotals.finalAmount.toFixed(2)}</DialogDescription></DialogHeader><Tabs defaultValue="online" className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="online">UPI / QR</TabsTrigger><TabsTrigger value="cash">Cash</TabsTrigger></TabsList><TabsContent value="online" className="text-center p-4 space-y-4"><p>Scan the QR code to pay using any UPI app.</p><div className="p-4 bg-white inline-block rounded-lg border-2 border-dashed"><QRCodeSVG value={`upi://pay?pa=${companyInfo.upi_id}&pn=${encodeURIComponent(companyInfo.name)}&am=${cartTotals.finalAmount.toFixed(2)}&tn=INV${Date.now()}`} size={180} /></div><p className="text-xs text-gray-500">UPI ID: {companyInfo.upi_id}</p><Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => completeSale('online')} disabled={processSaleMutation.isPending}>{processSaleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />} Confirm Payment</Button></TabsContent><TabsContent value="cash" className="p-4 space-y-4"><div className="text-center p-6 border rounded-lg bg-gray-50 dark:bg-gray-800/50"><p className="text-gray-600 dark:text-gray-400">Please pay at the counter.</p><p className="text-4xl font-bold text-primary">₹{cartTotals.finalAmount.toFixed(2)}</p></div><Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => completeSale('cash')} disabled={processSaleMutation.isPending}>{processSaleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-2" />} Confirm Cash Payment</Button></TabsContent></Tabs></DialogContent></Dialog>
            <Dialog open={showSaleSuccessDialog} onOpenChange={setShowSaleSuccessDialog}><DialogContent className="max-w-lg"><DialogHeader className="text-center"><Sparkles className="h-16 w-16 mx-auto text-green-500 bg-green-100 p-3 rounded-full"/><DialogTitle className="text-2xl mt-4">Thank You For Your Order!</DialogTitle><DialogDescription>Your payment was successful and your order has been recorded.</DialogDescription></DialogHeader><div className="py-6 space-y-3"><Button className="w-full" variant="outline" onClick={() => generatePdfInvoice(completedBill, 'save')}><Download className="h-4 w-4 mr-2"/>Download PDF Invoice</Button>{completedBill?.customer.email && (<Button className="w-full" variant="outline" onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>{sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Mail className="h-4 w-4 mr-2"/>} Send Invoice via Email</Button>)}</div><DialogFooter><Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowSaleSuccessDialog(false)}><Plus className="h-4 w-4 mr-2"/>Start New Order</Button></DialogFooter></DialogContent></Dialog>
        </div>
    );
};

export default CustomerPOSPage;