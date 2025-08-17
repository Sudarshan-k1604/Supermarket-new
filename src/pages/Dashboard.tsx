import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
    Package, TrendingUp, DollarSign, FileText, ShoppingCart, Receipt, 
    Banknote, ShieldCheck, Users, Loader2, UserCheck, UserX 
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; // <-- FIX: Added the missing import
import { useToast } from '@/hooks/use-toast';

// --- Type Definitions ---
interface Profile { id: string; email: string | null; phone: string | null; role: string | null; name: string | null; }

// Helper function to parse items from sales data
const parseSaleItems = (items: Json): any[] => {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') { try { const parsed = JSON.parse(items); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
    return [];
};

// Helper for consistent currency formatting
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const SkeletonCard = () => (
    <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
        </CardHeader>
        <CardContent>
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-1 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </CardContent>
    </Card>
);


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // --- NEW: State for User Management ---
  const [searchPhone, setSearchPhone] = useState('');
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardSummary', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString();
      const startDateOnly = thirtyDaysAgo.toISOString().split('T')[0];

      let salesQuery = supabase.from('sales').select('*').gte('created_at', startDate);
      let expensesQuery = supabase.from('expenses').select('*').gte('date', startDateOnly);
      
      if (!isAdmin) {
        salesQuery = salesQuery.eq('user_id', user.id);
        expensesQuery = expensesQuery.eq('user_id', user.id);
      }

      const inventoryPromise = supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single()
        .then(async (adminRes) => {
          if (adminRes.error) throw new Error("Could not find admin user for inventory.");
          const adminId = adminRes.data.id;
          const [inventoryDataRes, inventoryCountRes] = await Promise.all([
            supabase.from('inventory').select('id, cost_price').eq('user_id', adminId),
            supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('user_id', adminId),
          ]);
          if(inventoryDataRes.error) throw inventoryDataRes.error;
          if(inventoryCountRes.error) throw inventoryCountRes.error;
          return { inventory: inventoryDataRes.data || [], count: inventoryCountRes.count || 0 };
        });

      const [salesRes, expensesRes, inventoryInfo] = await Promise.all([
        salesQuery,
        expensesQuery,
        inventoryPromise,
      ]);

      if (salesRes.error || expensesRes.error) {
        throw new Error('Failed to fetch dashboard data');
      }

      const sales = salesRes.data || [];
      const expenses = expensesRes.data || [];
      const { inventory, count: totalInventoryItems } = inventoryInfo;
      
      const inventoryMap = new Map(inventory.map(item => [item.id, item.cost_price]));
      const totalCOGS = sales.reduce((sum, sale) => {
        const items = parseSaleItems(sale.items);
        return sum + items.reduce((itemSum, soldItem) => {
          const costPrice = inventoryMap.get(soldItem.id) || 0;
          const quantity = soldItem.cart_quantity || soldItem.quantity_sold || 1;
          return itemSum + (Number(costPrice) * quantity);
        }, 0);
      }, 0);

      const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const netProfit = totalSales - totalCOGS - totalExpenses;

      const recentSales = sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3).map(sale => ({
          type: 'sale',
          description: `Sale to ${sale.customer_name || 'Customer'}`,
          amount: Number(sale.total_amount),
          date: new Date(sale.created_at!)
        }));

      return { totalSales, totalExpenses, totalCOGS, netProfit, activeItems: totalInventoryItems, recentActivity: recentSales };
    },
    enabled: !!user?.id
  });

  // --- NEW: Mutation to update a user's role ---
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string, newRole: 'admin' | 'customer' }) => {
        const { data, error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId).select().single();
        if (error) throw error;
        return data;
    },
    onSuccess: (updatedProfile) => {
        setFoundUser(updatedProfile);
        toast({ title: "Role Updated", description: `${updatedProfile.email || 'User'} is now a(n) ${updatedProfile.role}.` });
    },
    onError: (error) => {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  // --- NEW: Function to handle user search ---
  const handleSearchUser = async () => {
    if (!searchPhone) { setSearchMessage("Please enter a phone number."); return; }
    setIsSearching(true);
    setFoundUser(null);
    setSearchMessage('');
    const { data, error } = await supabase.from('profiles').select('*').eq('phone', searchPhone).single();
    if (error) {
        if (error.code === 'PGRST116') { setSearchMessage("No user found with that phone number."); } 
        else { setSearchMessage(`Error: ${error.message}`); }
    } else { setFoundUser(data); }
    setIsSearching(false);
  };

  const quickActions = [
    { title: "Manage Inventory", description: "Add, edit or view stock", icon: Package, action: () => navigate('/inventory'), color: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800" },
    { title: "Point of Sale", description: "Create new transactions", icon: ShoppingCart, action: () => navigate('/sales'), color: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800" },
    { title: "Track Expenses", description: "Record business costs", icon: Receipt, action: () => navigate('/expense'), color: "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-orange-200 dark:border-orange-800" },
    { title: "View Reports", description: "Analyze your performance", icon: FileText, action: () => navigate('/reports'), color: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800" }
  ];

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="h-36 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-36 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-36 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-36 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    { title: "Revenue", value: formatCurrency(dashboardData?.totalSales || 0), description: "Last 30 days", icon: TrendingUp, color: "text-green-600" },
    { title: "Cost of Goods", value: formatCurrency(dashboardData?.totalCOGS || 0), description: "Last 30 days", icon: Receipt, color: "text-orange-600" },
    { title: "Expenses", value: formatCurrency(dashboardData?.totalExpenses || 0), description: "Last 30 days", icon: Banknote, color: "text-red-600" },
    { title: "Net Profit", value: formatCurrency(dashboardData?.netProfit || 0), description: "Last 30 days", icon: DollarSign, color: (dashboardData?.netProfit ?? 0) >= 0 ? "text-blue-600" : "text-red-600" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Business Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {isAdmin ? "Welcome back! Here's an overview of the entire business." : "Welcome back! Here's an overview of your activity."}
                </p>
            </div>
            {isAdmin && <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700"><ShieldCheck className="mr-2 h-4 w-4"/>Admin View</Badge>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statsCards.map((card, index) => ( <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-shadow dark:bg-gray-900"> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</CardTitle> <card.icon className={`h-5 w-5 ${card.color}`} /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div> <p className="text-xs text-gray-500 mt-1">{card.description}</p> </CardContent> </Card> ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => ( <Card key={index} className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg dark:shadow-none ${action.color}`} onClick={action.action}> <CardHeader className="flex flex-row items-center gap-4 space-y-0"> <action.icon className="h-8 w-8 text-gray-700 dark:text-gray-300" /> <div className="grid gap-1"> <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{action.title}</CardTitle> <CardDescription className="text-gray-600 dark:text-gray-400">{action.description}</CardDescription> </div> </CardHeader> </Card> ))}
                </div>

                {/* --- NEW: User Management Card --- */}
                {isAdmin && (
                    <div className="mt-8">
                        <Card className="border-0 shadow-sm dark:bg-gray-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl"><Users className="text-indigo-500"/>User Management</CardTitle>
                                <CardDescription>Search for a user by phone number to update their role.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 max-w-sm">
                                    <Input type="tel" placeholder="Enter phone number..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
                                    <Button onClick={handleSearchUser} disabled={isSearching}>
                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                    </Button>
                                </div>
                                <div className="mt-4 min-h-[6rem] p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    {foundUser ? (
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{foundUser.name || 'No Name'}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{foundUser.email}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">Current Role: <Badge>{foundUser.role}</Badge></p>
                                            <div className="mt-2 flex gap-2">
                                                <Button size="sm" onClick={() => updateUserRoleMutation.mutate({ userId: foundUser.id, newRole: 'admin' })} disabled={foundUser.role === 'admin' || updateUserRoleMutation.isPending} className="bg-green-600 hover:bg-green-700">
                                                    <UserCheck className="h-4 w-4 mr-2" /> Make Admin
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => updateUserRoleMutation.mutate({ userId: foundUser.id, newRole: 'customer' })} disabled={foundUser.role !== 'admin' || updateUserRoleMutation.isPending}>
                                                    <UserX className="h-4 w-4 mr-2" /> Make Customer
                                                </Button>
                                            </div>
                                        </div>
                                    ) : ( <p className="text-sm text-gray-500 dark:text-gray-400">{searchMessage || "Search results will appear here."}</p> )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <div>
                <Card className="border-0 shadow-sm dark:bg-gray-900 h-full">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Recent Sales</CardTitle>
                        <CardDescription className="dark:text-gray-400">Your latest transactions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                        {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                            dashboardData.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                                    <ShoppingCart className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{getTimeAgo(activity.date)}</p>
                                </div>
                                </div>
                                <span className="font-semibold text-green-600">+ {formatCurrency(activity.amount)}</span>
                            </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No sales in the last 30 days.</p>
                            </div>
                        )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;