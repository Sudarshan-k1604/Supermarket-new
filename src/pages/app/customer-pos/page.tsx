import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, Minus, X, Check, CreditCard, QrCode, User, History, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Type Definitions
interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  reserved_quantity: number;
  unit_price: number;
  image_url?: string;
}

interface CartItem extends InventoryItem {
  cart_quantity: number;
  reservation_id?: string;
}

interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const CustomerPOS = () => {
  const { toast } = useToast();
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: user?.email || '',
    address: profile?.address || ''
  });
  
  // Timer for reservation release
  useEffect(() => {
    const releaseTimers: NodeJS.Timeout[] = [];
    
    cart.forEach(item => {
      if (item.reservation_id) {
        const timer = setTimeout(() => {
          releaseReservation(item.id, item.reservation_id!);
        }, 10 * 60 * 1000); // 10 minutes
        
        releaseTimers.push(timer);
      }
    });
    
    return () => releaseTimers.forEach(timer => clearTimeout(timer));
  }, [cart]);

  // Fetch inventory with real-time availability
  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['customer-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .gt('quantity', 0)
        .order('item_name');
      
      if (error) throw new Error(error.message);
      return data as InventoryItem[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate available quantity considering reservations
  const getAvailableQuantity = (item: InventoryItem) => {
    return item.quantity - item.reserved_quantity;
  };

  // Reserve items in inventory
  const reserveItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { data, error } = await supabase.rpc('reserve_inventory', {
        item_id: itemId,
        quantity,
        user_id: user!.id
      });
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-inventory'] });
      
      setCart(prevCart => prevCart.map(item => 
        item.id === variables.itemId 
          ? { ...item, reservation_id: data.reservation_id } 
          : item
      ));
    }
  });

  // Release reservation
  const releaseReservation = async (itemId: string, reservationId: string) => {
    try {
      await supabase.rpc('release_reservation', {
        item_id: itemId,
        reservation_id: reservationId
      });
      
      queryClient.invalidateQueries({ queryKey: ['customer-inventory'] });
      
      setCart(prevCart => 
        prevCart.filter(item => item.id !== itemId || item.reservation_id !== reservationId)
      );
    } catch (error) {
      console.error('Failed to release reservation:', error);
    }
  };

  // Add to cart with reservation
  const addToCart = async (item: InventoryItem, quantity: number = 1) => {
    const available = getAvailableQuantity(item);
    
    if (quantity > available) {
      toast({
        title: 'Stock Limited',
        description: `Only ${available} units available`,
        variant: 'destructive'
      });
      return;
    }

    // Check if already in cart
    const existingItem = cart.find(i => i.id === item.id);
    
    if (existingItem) {
      const newQuantity = existingItem.cart_quantity + quantity;
      
      if (newQuantity > available) {
        toast({
          title: 'Stock Limited',
          description: `Only ${available} units available`,
          variant: 'destructive'
        });
        return;
      }
      
      // Update reservation
      await reserveItemMutation.mutateAsync({
        itemId: item.id,
        quantity: newQuantity - existingItem.cart_quantity
      });
      
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, cart_quantity: newQuantity } : i
      ));
    } else {
      // New reservation
      await reserveItemMutation.mutateAsync({
        itemId: item.id,
        quantity
      });
      
      setCart([...cart, { 
        ...item, 
        cart_quantity: quantity,
        reserved_quantity: quantity
      }]);
    }
    
    toast({
      title: 'Added to Cart',
      description: `${quantity} x ${item.item_name} reserved`,
    });
  };

  // Update cart quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    const available = getAvailableQuantity(item) + item.cart_quantity;
    
    if (newQuantity <= 0) {
      if (item.reservation_id) {
        await releaseReservation(item.id, item.reservation_id);
      }
      return;
    }
    
    if (newQuantity > available) {
      toast({
        title: 'Stock Limited',
        description: `Only ${available} units available`,
        variant: 'destructive'
      });
      return;
    }
    
    const quantityDiff = newQuantity - item.cart_quantity;
    
    if (quantityDiff > 0) {
      // Reserve more
      await reserveItemMutation.mutateAsync({
        itemId: item.id,
        quantity: quantityDiff
      });
    } else if (quantityDiff < 0) {
      // Release some
      await supabase.rpc('release_reservation', {
        item_id: item.id,
        quantity: -quantityDiff,
        reservation_id: item.reservation_id
      });
    }
    
    setCart(cart.map(i => 
      i.id === itemId ? { ...i, cart_quantity: newQuantity } : i
    ));
  };

  // Remove from cart
  const removeFromCart = async (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.reservation_id) {
      await releaseReservation(item.id, item.reservation_id);
    }
    
    setCart(cart.filter(i => i.id !== itemId));
  };

  // Cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => 
      total + (item.cart_quantity * item.unit_price), 0);
  }, [cart]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return inventoryItems;
    
    const lowerSearch = searchTerm.toLowerCase();
    return inventoryItems.filter(item => 
      item.item_name.toLowerCase().includes(lowerSearch) ||
      item.category.toLowerCase().includes(lowerSearch)
    );
  }, [inventoryItems, searchTerm]);

  // Handle checkout
  const handleCheckout = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please sign in to complete your order',
        variant: 'destructive'
      });
      router.push('/login');
      return;
    }
    
    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Add items to your cart first',
        variant: 'destructive'
      });
      return;
    }
    
    setShowCheckout(true);
  };

  // Complete order
  const completeOrder = async () => {
    if (!paymentMethod) {
      toast({
        title: 'Select Payment',
        description: 'Choose a payment method',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // 1. Update profile
      await updateProfile({
        full_name: customerProfile.name,
        phone: customerProfile.phone,
        address: customerProfile.address
      });
      
      // 2. Create sale record
      const saleData = {
        user_id: user!.id,
        customer_name: customerProfile.name,
        customer_phone: customerProfile.phone,
        customer_email: customerProfile.email,
        items: cart.map(item => ({
          id: item.id,
          name: item.item_name,
          quantity: item.cart_quantity,
          unit_price: item.unit_price
        })),
        total_amount: cartTotal,
        payment_status: 'completed',
        payment_method: paymentMethod,
        bill_data: {
          items: cart.map(item => ({
            id: item.id,
            item_name: item.item_name,
            quantity: item.cart_quantity,
            unit_price: item.unit_price,
            total: item.cart_quantity * item.unit_price
          })),
          total: cartTotal,
          timestamp: new Date(),
          customer: customerProfile
        }
      };
      
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // 3. Finalize reservations (convert to sales)
      await Promise.all(cart.map(item => 
        supabase.rpc('finalize_reservation', {
          item_id: item.id,
          reservation_id: item.reservation_id!,
          quantity: item.cart_quantity
        })
      ));
      
      // 4. Clear cart and show success
      setCart([]);
      setCompletedOrder(sale);
      setShowCheckout(false);
      
      toast({
        title: 'Order Complete!',
        description: 'Your order has been placed',
        className: 'bg-green-100 border-green-400'
      });
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate PDF invoice
  const generateInvoice = () => {
    if (!completedOrder) return;
    
    const doc = new jsPDF();
    // ... (invoice generation logic similar to previous implementation)
    doc.save(`invoice-${completedOrder.id}.pdf`);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" /> 
              Shop & Checkout
            </h1>
            <p className="text-gray-600">Browse products and complete your purchase</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="relative"
              onClick={() => setActiveTab('cart')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {cart.length}
                </span>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setActiveTab('profile')}
            >
              <User className="h-4 w-4 mr-2" /> Profile
            </Button>
          </div>
        </header>
        
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white shadow-sm"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full bg-gray-100">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="cart">Your Cart</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          {/* Products Tab */}
          <TabsContent value="products" className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(item => (
                <Card 
                  key={item.id}
                  className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => addToCart(item, 1)}
                >
                  {item.image_url ? (
                    <div className="bg-gray-100 h-40 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.item_name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-100 border-b h-40 flex items-center justify-center">
                      <ShoppingCart className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{item.item_name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{item.category}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">₹{item.unit_price.toFixed(2)}</span>
                      <Badge 
                        variant={
                          getAvailableQuantity(item) > 5 ? 'default' : 
                          getAvailableQuantity(item) > 0 ? 'warning' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {getAvailableQuantity(item) > 0 
                          ? `${getAvailableQuantity(item)} available` 
                          : 'Out of stock'}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      disabled={getAvailableQuantity(item) === 0}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Cart Tab */}
          <TabsContent value="cart" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Shopping Cart</CardTitle>
                <CardDescription>
                  Items reserved for you for 10 minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="mt-2 text-gray-500">Your cart is empty</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setActiveTab('products')}
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="bg-gray-100 border rounded w-16 h-16 flex items-center justify-center">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.item_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingCart className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{item.item_name}</h3>
                          <p className="text-sm text-gray-500">₹{item.unit_price.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, item.cart_quantity - 1);
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-8 text-center">{item.cart_quantity}</span>
                          
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, item.cart_quantity + 1);
                            }}
                            disabled={getAvailableQuantity(item) + item.cart_quantity === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="w-20 text-right font-medium">
                          ₹{(item.cart_quantity * item.unit_price).toFixed(2)}
                        </p>
                        
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Update your information for faster checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input 
                      value={customerProfile.name}
                      onChange={e => setCustomerProfile(p => ({...p, name: e.target.value}))}
                    />
                  </div>
                  
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={customerProfile.email}
                      onChange={e => setCustomerProfile(p => ({...p, email: e.target.value}))}
                    />
                  </div>
                  
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={customerProfile.phone}
                      onChange={e => setCustomerProfile(p => ({...p, phone: e.target.value}))}
                    />
                  </div>
                  
                  <div>
                    <Label>Address</Label>
                    <Input 
                      value={customerProfile.address}
                      onChange={e => setCustomerProfile(p => ({...p, address: e.target.value}))}
                    />
                  </div>
                  
                  <Button 
                    className="mt-2"
                    onClick={async () => {
                      await updateProfile({
                        full_name: customerProfile.name,
                        phone: customerProfile.phone,
                        address: customerProfile.address
                      });
                      toast({ title: 'Profile Updated!' });
                    }}
                  >
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>Total: ₹{cartTotal.toFixed(2)}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button 
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <CreditCard className="h-4 w-4 mr-2" /> Cash
                </Button>
                <Button 
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <QrCode className="h-4 w-4 mr-2" /> UPI
                </Button>
              </div>
            </div>
            
            {paymentMethod === 'upi' && (
              <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                <div className="bg-white p-3 rounded-lg border mb-3">
                  {/* QR Code would be generated here */}
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-40 h-40 flex items-center justify-center">
                    <QrCode className="h-20 w-20 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-center text-gray-600">
                  Scan this QR code to complete payment
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCheckout(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={completeOrder}
              disabled={!paymentMethod || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Order Complete Dialog */}
      <Dialog open={!!completedOrder} onOpenChange={() => setCompletedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-6 w-6" /> Order Complete!
            </DialogTitle>
            <DialogDescription>
              Thank you for your purchase
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">Order ID: #{completedOrder?.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-gray-600">
                {format(new Date(completedOrder?.created_at), 'MMM d, yyyy h:mm a')}
              </p>
              
              <div className="mt-4 space-y-2">
                {completedOrder?.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-3 pt-3 font-bold flex justify-between">
                <span>Total:</span>
                <span>₹{completedOrder?.total_amount.toFixed(2)}</span>
              </div>
            </div>
            
            <p className="text-center text-gray-600">
              Show this confirmation to staff for verification
            </p>
          </div>
          
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={generateInvoice}
            >
              Download Invoice
            </Button>
            <Button 
              className="w-full"
              onClick={() => {
                setCompletedOrder(null);
                setActiveTab('products');
              }}
            >
              Continue Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPOS;