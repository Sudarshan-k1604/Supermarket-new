import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie,
  Sector,
  AreaChart,
  Area,
  LabelList
} from 'recharts';
import { 
    DollarSign, 
    TrendingUp, 
    Package, 
    ShoppingCart, 
    BarChart2, 
    Star, 
    AlertTriangle, 
    Receipt, 
    Banknote,
    ShieldCheck
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

// --- Type Definitions ---
interface SalesData { id: string; items: Json; total_amount: number; created_at: string; user_id: string; }
interface InventoryItem { id: string; item_name: string; unit_price: number; cost_price: number; quantity: number; }
interface Expense { id: string; amount: number; category: string; description: string; date: string; }

// --- Constants & Helpers ---
const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'];
const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
const formatCompact = (value: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(value);

// --- Custom Hook for Data Processing (No changes needed here) ---
const useAnalyticsData = (salesData: SalesData[], inventoryData: InventoryItem[], expensesData: Expense[]) => {
    const [processedData, setProcessedData] = useState<any>({
        totalRevenue: 0, totalCOGS: 0, totalExpenses: 0, netProfit: 0, inventoryValue: 0,
        topSellingProducts: [], lowStockItems: [], dailySalesTrend: [], expenseBreakdown: []
    });

    useEffect(() => {
        if (!salesData || !inventoryData || !expensesData) return;

        const revenue = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        const expenses = expensesData.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const inventoryMap = new Map(inventoryData.map(item => [item.id, item]));
        const parseSaleItems = (items: Json): any[] => {
            if (Array.isArray(items)) return items;
            if (typeof items === 'string') { try { const parsed = JSON.parse(items); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
            return [];
        };
        const cogs = salesData.reduce((sum, sale) => {
            const items = parseSaleItems(sale.items);
            return sum + items.reduce((itemSum, soldItem) => {
                const inventoryItem = inventoryMap.get(soldItem.id); 
                const costPrice = inventoryItem ? inventoryItem.cost_price : 0;
                return itemSum + (costPrice * (soldItem.cart_quantity || 1));
            }, 0);
        }, 0);

        const productSales = new Map<string, number>();
        salesData.forEach(sale => parseSaleItems(sale.items).forEach(item => {
            productSales.set(item.item_name, (productSales.get(item.item_name) || 0) + (item.cart_quantity || 1));
        }));
        const topSelling = Array.from(productSales.entries()).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, quantity]) => ({ name, quantity }));
        
        const lowStock = inventoryData.filter(item => item.quantity > 0 && item.quantity < 10).map(item => ({ name: item.item_name, stock: item.quantity }));
        
        const dailySales = new Map<string, number>();
        salesData.forEach(sale => {
            const date = new Date(sale.created_at).toLocaleDateString('en-CA');
            dailySales.set(date, (dailySales.get(date) || 0) + Number(sale.total_amount));
        });
        const trend = Array.from(dailySales.entries()).map(([date, sales]) => ({ date, sales })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const categoryExpenses = new Map<string, number>();
        expensesData.forEach(expense => {
            categoryExpenses.set(expense.category, (categoryExpenses.get(expense.category) || 0) + Number(expense.amount));
        });
        const breakdown = Array.from(categoryExpenses.entries()).map(([name, value]) => ({ name, value }));
        
        setProcessedData({
            totalRevenue: revenue,
            totalCOGS: cogs,
            totalExpenses: expenses,
            netProfit: revenue - cogs - expenses,
            inventoryValue: inventoryData.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0),
            topSellingProducts: topSelling,
            lowStockItems: lowStock,
            dailySalesTrend: trend,
            expenseBreakdown: breakdown,
        });

    }, [salesData, inventoryData, expensesData]);

    return processedData;
};

// --- Main Reports Component ---
const Reports = () => {
  const { toast } = useToast();
  // MODIFIED: Get isAdmin flag from auth context
  const { user, isAdmin } = useAuth();
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Default to start of the current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // --- MODIFIED: Data Fetching using React Query ---
  const { data: salesData = [] } = useQuery({ 
    queryKey: ['sales', user?.id, startDate, endDate, isAdmin], 
    queryFn: async () => { 
      if (!user?.id) return [];
      let query = supabase.from('sales').select('*')
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`);
      
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error; 
      return data || []; 
    }, 
    enabled: !!user?.id 
  });

  const { data: inventoryData = [] } = useQuery({
    queryKey: ['adminInventory'], // Use one key for the main business inventory
    queryFn: async () => {
        const { data: adminProfile, error: adminError } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
        if (adminError) throw new Error('Could not find admin user for inventory.');

        const { data, error } = await supabase.from('inventory').select('id, item_name, unit_price, cost_price, quantity').eq('user_id', adminProfile.id);
        if (error) throw error;
        return (data || []).map(item => ({ ...item, cost_price: Number(item.cost_price) || 0, quantity: Number(item.quantity) || 0 }));
    },
    enabled: !!user?.id
  });

  const { data: expensesData = [] } = useQuery({ 
    queryKey: ['expenses', user?.id, startDate, endDate, isAdmin], 
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase.from('expenses').select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error; 
      return data || []; 
    }, 
    enabled: !!user?.id 
  });

  // --- Use the custom hook for all calculations ---
  const { totalRevenue, totalCOGS, totalExpenses, netProfit, inventoryValue, topSellingProducts, lowStockItems, dailySalesTrend, expenseBreakdown } = useAnalyticsData(salesData, inventoryData, expensesData);
  
  // State for interactive Pie Chart
  const [activeIndex, setActiveIndex] = useState(0);

  // --- Chart Tooltips & Formatters ---
  const ChartTooltip = ({ active, payload, label }: any) => { if (active && payload && payload.length) { return (<div className="rounded-lg border bg-background p-2 shadow-sm"><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="font-bold text-foreground">{formatCurrency(payload[0].value)}</p></div>); } return null; };
  const formatYAxis = (tickItem: number) => `₹${(tickItem / 1000)}k`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:gap-8 md:p-10">
        
        {/* --- Header Section --- */}
        <div className="mx-auto flex w-full max-w-7xl flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Business Analytics</h1>
              <p className="text-muted-foreground">
                {isAdmin ? "Company-wide performance overview." : "Your personal performance overview."}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              {isAdmin && <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700"><ShieldCheck className="mr-2 h-4 w-4"/>Admin View</Badge>}
              <div className="grid gap-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            </div>
        </div>

        {/* --- KPI Cards --- */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-green-500 hover:shadow-lg transition-shadow"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div></CardContent></Card>
            <Card className="border-l-4 border-orange-500 hover:shadow-lg transition-shadow"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cost of Goods</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalCOGS)}</div></CardContent></Card>
            <Card className="border-l-4 border-red-500 hover:shadow-lg transition-shadow"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Expenses</CardTitle><Banknote className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div></CardContent></Card>
            <Card className="border-l-4 border-blue-500 hover:shadow-lg transition-shadow"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</div></CardContent></Card>
            <Card className="border-l-4 border-indigo-500 hover:shadow-lg transition-shadow"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(inventoryValue)}</div></CardContent></Card>
        </div>
        
        {/* --- Main Dashboard Grid --- */}
        <div className="mx-auto grid w-full max-w-7xl auto-rows-fr grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Daily Sales Trend - Main Chart */}
          <Card className="lg:col-span-5"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5"/> Daily Sales Trend</CardTitle><CardDescription>Revenue performance over the selected period.</CardDescription></CardHeader>
            <CardContent className="h-[24rem] w-full p-2">
                <ResponsiveContainer>
                    <AreaChart data={dailySalesTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                        <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Top Selling Products */}
          <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400"/> Top Selling Products</CardTitle><CardDescription>By quantity sold in the selected period.</CardDescription></CardHeader>
            <CardContent>
              {topSellingProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topSellingProducts} layout="vertical" margin={{ left: 10, right: 40}}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" interval={0} />
                        <Tooltip cursor={{ fill: 'hsla(var(--primary), 0.1)' }} formatter={(value) => [`${value} units`, 'Quantity Sold']} />
                        <Bar dataKey="quantity" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" background={{ fill: 'hsl(var(--muted))' }}>
                           <LabelList dataKey="quantity" position="right" offset={10} className="fill-foreground font-semibold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground py-10 text-center">No sales data for this period.</p>}
            </CardContent>
          </Card>

          {/* Expense Breakdown - Pie Chart */}
          <Card className="lg:col-span-3"><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Expense Breakdown</CardTitle><CardDescription>Distribution of costs by category.</CardDescription></CardHeader>
            <CardContent className="h-[240px] w-full p-0 flex items-center justify-center">
              {expenseBreakdown.length > 0 ? (
                <div className="grid grid-cols-2 w-full h-full items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie 
                                data={expenseBreakdown} 
                                cx="50%" cy="50%" 
                                dataKey="value" 
                                nameKey="name" 
                                innerRadius={60} 
                                outerRadius={80} 
                                cornerRadius={5}
                                paddingAngle={2}
                                activeIndex={activeIndex}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                activeShape={({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload }) => (
                                    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} />
                                )}
                            >
                                {expenseBreakdown.map((e, i) => (<Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} className="focus:outline-none" />))}
                           </Pie>
                           <foreignObject x="50%" y="50%" width={120} height={100} style={{ transform: 'translate(-60px, -40px)' }}>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                                    <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                                </div>
                           </foreignObject>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 pr-4">
                        {expenseBreakdown.map((entry, index) => (
                           <div key={index} className={`flex items-center justify-between text-sm p-2 rounded-md transition-all ${index === activeIndex ? 'bg-muted' : ''}`} onMouseEnter={() => setActiveIndex(index)}>
                                <div className="flex items-center gap-2 truncate">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}/>
                                    <span className="truncate">{entry.name}</span>
                                </div>
                                <span className="font-semibold">{formatCompact(entry.value)}</span>
                           </div>
                        ))}
                    </div>
                </div>
              ) : <p className="text-sm text-muted-foreground py-10 text-center">No expense data for this period.</p>}
            </CardContent>
          </Card>
          
          {/* Low Stock Items */}
          <Card className="lg:col-span-5"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-400"/> Low Stock Alerts</CardTitle><CardDescription>These items need your attention. Consider reordering to prevent stockouts.</CardDescription></CardHeader>
            <CardContent>
              {lowStockItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {lowStockItems.map((item, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-2xl font-bold text-orange-500">{item.stock}</p>
                        <p className="text-xs text-muted-foreground">units left</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground pt-10 text-center">✅ All items are well-stocked.</p>}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default Reports;