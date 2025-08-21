import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
    Package, TrendingUp, DollarSign, FileText, ShoppingCart, Receipt,
    Banknote, ShieldCheck, Users, Loader2, UserCheck, UserX, Briefcase // <-- Import Briefcase icon
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Json } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// --- Type Definitions ---
// 1. Add is_staff to the Profile interface
interface Profile { 
    id: string; 
    email: string | null; 
    phone: string | null; 
    role: string | null; 
    name: string | null;
    is_staff?: boolean; // <-- MODIFIED: Add is_staff property
}
interface Sale { id: string; items: Json; total_amount: number; created_at: string; customer_name: string; }
interface InventoryItem { id: string; cost_price: number; }
interface Expense { amount: number; }

// --- Helper Functions (No changes needed) ---
const parseSaleItems = (items: Json): any[] => {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') { try { const parsed = JSON.parse(items); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
    return [];
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

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

// --- Loading State Component (No changes needed) ---
const SkeletonCard = () => (
    <Card className="border-0 shadow-sm dark:bg-gray-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </CardHeader>
        <CardContent>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-1 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const navigate = useNavigate();
    // 2. Get isStaff from the authentication context
    const { user, isAdmin, isStaff } = useAuth(); // <-- MODIFIED: Add isStaff
    const { toast } = useToast();

    // --- State for User Management (No changes needed) ---
    const [searchPhone, setSearchPhone] = useState('');
    const [foundUser, setFoundUser] = useState<Profile | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMessage, setSearchMessage] = useState('');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString();

    // --- Data Fetching Queries (No changes needed) ---
    const { data: salesData = [], isLoading: isSalesLoading } = useQuery({
        queryKey: ['dashboardSales', user?.id, isAdmin],
        queryFn: async () => {
            if (!user) return [];
            let query = supabase.from('sales').select('items, total_amount, created_at, customer_name').gte('created_at', startDate);
            if (!isAdmin) {
                query = query.eq('user_id', user.id);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user
    });

    const { data: inventoryData = [], isLoading: isInventoryLoading } = useQuery({
        queryKey: ['allAdminInventoryForDashboard'],
        queryFn: async () => {
            const { data: adminProfiles, error: adminError } = await supabase.from('profiles').select('id').eq('role', 'admin');
            if (adminError) throw adminError;
            const adminIds = adminProfiles.map(p => p.id);
            if (adminIds.length === 0) return [];
            const { data, error } = await supabase.from('inventory').select('id, cost_price').in('user_id', adminIds);
            if (error) throw error;
            return data || [];
        },
        enabled: !!isAdmin
    });

    const { data: expensesData = [], isLoading: isExpensesLoading } = useQuery({
        queryKey: ['dashboardExpenses', user?.id, isAdmin],
        queryFn: async () => {
            if (!user) return [];
            let query = supabase.from('expenses').select('amount').gte('date', startDate.split('T')[0]);
            if (!isAdmin) {
                query = query.eq('user_id', user.id);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user
    });

    // --- Calculations (No changes needed) ---
    const dashboardData = useMemo(() => {
        // ... (calculations remain the same)
        const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        const totalExpenses = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const inventoryMap = new Map(inventoryData.map(item => [item.id, item.cost_price]));
        const totalCOGS = salesData.reduce((sum, sale) => {
            const items = parseSaleItems(sale.items);
            return sum + items.reduce((itemSum, soldItem) => {
                const costPrice = inventoryMap.get(soldItem.id) || 0;
                const quantity = soldItem.cart_quantity || 1;
                return itemSum + (Number(costPrice) * quantity);
            }, 0);
        }, 0);
        const netProfit = totalRevenue - totalCOGS - totalExpenses;
        const recentActivity = salesData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map(sale => ({
            description: `Sale to ${sale.customer_name || 'Customer'}`,
            amount: Number(sale.total_amount),
            date: new Date(sale.created_at)
        }));
        return { totalRevenue, totalCOGS, totalExpenses, netProfit, recentActivity };
    }, [salesData, inventoryData, expensesData]);

    const isLoading = isSalesLoading || (isAdmin && isInventoryLoading) || isExpensesLoading;

    // --- User Management Mutation & Handler ---
    // 3. Update the mutation to be more flexible
    const updateUserRoleMutation = useMutation({
        mutationFn: async ({ userId, updates }: { userId: string; updates: { role: string; is_staff: boolean } }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (updatedProfile) => {
            setFoundUser(updatedProfile);
            const roleDisplay = updatedProfile.is_staff ? 'Staff' : updatedProfile.role;
            toast({ title: "Role Updated", description: `${updatedProfile.name || updatedProfile.email} is now a(n) ${roleDisplay}.` });
        },
        onError: (error) => {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        },
    });

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

    // --- Card Data Arrays (Now with role-based filtering) ---
    // 4. Filter Stats and Actions based on user role (Admin vs Staff)
    const allStatsCards = [
        { title: "Revenue", value: formatCurrency(dashboardData?.totalRevenue || 0), description: "Last 30 days", icon: TrendingUp, color: "text-green-600" },
        { title: "Cost of Goods", value: formatCurrency(dashboardData?.totalCOGS || 0), description: "Last 30 days", icon: Receipt, color: "text-orange-600" },
        { title: "Expenses", value: formatCurrency(dashboardData?.totalExpenses || 0), description: "Last 30 days", icon: Banknote, color: "text-red-600" },
        { title: "Net Profit", value: formatCurrency(dashboardData?.netProfit || 0), description: "Last 30 days", icon: DollarSign, color: (dashboardData?.netProfit ?? 0) >= 0 ? "text-blue-600" : "text-red-600" }
    ];

    const allQuickActions = [
        { name: "inventory", title: "Manage Inventory", description: "Add, edit or view stock", icon: Package, action: () => navigate('/inventory'), color: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800" },
        { name: "pos", title: "Point of Sale", description: "Create new transactions", icon: ShoppingCart, action: () => navigate('/sales'), color: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800" },
        { name: "expenses", title: "Track Expenses", description: "Record business costs", icon: Receipt, action: () => navigate('/expense'), color: "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-orange-200 dark:border-orange-800" },
        { name: "reports", title: "View Reports", description: "Analyze your performance", icon: FileText, action: () => navigate('/reports'), color: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800" }
    ];
    
    // Staff members see a limited set of cards and actions
    const statsCards = isStaff ? allStatsCards.slice(0, 2) : allStatsCards; // Revenue & COGS for staff
    const quickActions = isStaff ? allQuickActions.filter(a => a.name === 'inventory' || a.name === 'pos') : allQuickActions;


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Business Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isAdmin ? "Welcome! Here's a 30-day overview of the entire business." : "Welcome back! Here's your 30-day activity overview."}
                        </p>
                    </div>
                    {/* Display a specific badge for staff */}
                    {isAdmin && <Badge variant="default" className={isStaff ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"}><ShieldCheck className="mr-2 h-4 w-4"/>{isStaff ? 'Staff View' : 'Admin View'}</Badge>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {statsCards.map((card, index) => ( <Card key={index} className="border-0 shadow-sm hover:shadow-lg transition-shadow dark:bg-gray-900"> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</CardTitle> <card.icon className={`h-5 w-5 ${card.color}`} /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div> <p className="text-xs text-gray-500 mt-1">{card.description}</p> </CardContent> </Card> ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {quickActions.map((action, index) => ( <Card key={index} className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg dark:shadow-none ${action.color}`} onClick={action.action}> <CardHeader className="flex flex-row items-center gap-4 space-y-0"> <action.icon className="h-8 w-8 text-gray-700 dark:text-gray-300" /> <div> <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{action.title}</CardTitle> <CardDescription className="text-gray-600 dark:text-gray-400">{action.description}</CardDescription> </div> </CardHeader> </Card> ))}
                        </div>
                        
                        {/* Show User Management only to pure admins, not staff */}
                        {isAdmin && !isStaff && (
                            <div className="mt-8">
                                <Card className="border-0 shadow-sm dark:bg-gray-900">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl"><Users className="text-indigo-500"/>User Management</CardTitle>
                                        <CardDescription>Search for a user by phone number to update their role.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 max-w-sm">
                                            <Input type="tel" placeholder="Enter phone number..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()} />
                                            <Button onClick={handleSearchUser} disabled={isSearching}>
                                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                            </Button>
                                        </div>
                                        {/* 5. Final update to the User Management card */}
                                        <div className="mt-4 min-h-[6rem] p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            {foundUser ? (
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100">{foundUser.name || 'No Name'}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{foundUser.email}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                                        Current Role: <Badge>{foundUser.role === 'admin' && foundUser.is_staff ? 'Staff' : foundUser.role}</Badge>
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {/* Make Admin Button */}
                                                        <Button size="sm" onClick={() => updateUserRoleMutation.mutate({ userId: foundUser.id, updates: { role: 'admin', is_staff: false } })} disabled={(foundUser.role === 'admin' && !foundUser.is_staff) || updateUserRoleMutation.isPending} className="bg-green-600 hover:bg-green-700"><UserCheck className="h-4 w-4 mr-2" /> Make Admin</Button>
                                                        
                                                        {/* Make Staff Button */}
                                                        <Button size="sm" onClick={() => updateUserRoleMutation.mutate({ userId: foundUser.id, updates: { role: 'admin', is_staff: true } })} disabled={(foundUser.role === 'admin' && foundUser.is_staff) || updateUserRoleMutation.isPending} className="bg-blue-600 hover:bg-blue-700"><Briefcase className="h-4 w-4 mr-2" /> Make Staff</Button>
                                                        
                                                        {/* Make Customer Button */}
                                                        <Button size="sm" variant="destructive" onClick={() => updateUserRoleMutation.mutate({ userId: foundUser.id, updates: { role: 'customer', is_staff: false } })} disabled={foundUser.role === 'customer' || updateUserRoleMutation.isPending}><UserX className="h-4 w-4 mr-2" /> Make Customer</Button>
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
                                <CardDescription className="dark:text-gray-400">Your latest transactions from the last 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                                    dashboardData.recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full"><ShoppingCart className="h-4 w-4 text-green-600" /></div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{getTimeAgo(activity.date)}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-green-600">+ {formatCurrency(activity.amount)}</span>
                                    </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>No sales in the last 30 days.</p></div>
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