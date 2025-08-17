import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { motion } from 'framer-motion';
import {
    Calendar as CalendarIcon, DollarSign, Package, TrendingUp, Users,
    Target, ShoppingCart, Lightbulb, AlertTriangle, Cpu, Link as LinkIcon, Zap, ShieldCheck
} from 'lucide-react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
    Tooltip as RechartsTooltip, XAxis, YAxis, Legend
} from 'recharts';


// --- Supabase and App-specific imports ---
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

// --- UI Component imports ---
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';

// --- Type Definitions ---
interface SalesRecord { id: string; items: Json; total_amount: number; created_at: string; }
interface InventoryItem { id: string; item_name: string; unit_price: number; cost_price: number; quantity: number; low_stock_threshold: number; }
interface ExpenseRecord { id: string; amount: number; category: string; }
interface InsightRule { antecedent: string; consequent: string; confidence: number; }

// --- Helper Functions ---
const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// --- Data Processing Function ---
const processAnalyticsData = (sales: SalesRecord[], inventory: InventoryItem[], expenses: ExpenseRecord[]) => {
    const total_sales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    const total_expenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const inventoryMap = new Map(inventory.map(item => [item.id, item]));
    const parseSaleItems = (items: Json): any[] => {
        if (Array.isArray(items)) return items;
        if (typeof items === 'string') { try { return JSON.parse(items); } catch { return []; } }
        return [];
    };

    const total_cogs = sales.reduce((sum, sale) => {
        return sum + parseSaleItems(sale.items).reduce((itemSum, soldItem) => {
            const inventoryItem = inventoryMap.get(soldItem.id);
            return itemSum + ((inventoryItem ? Number(inventoryItem.cost_price) : 0) * (soldItem.cart_quantity || 1));
        }, 0);
    }, 0);

    const net_profit = total_sales - total_cogs - total_expenses;
    const profit_margin = total_sales > 0 ? (net_profit / total_sales) * 100 : 0;
    
    let healthScore = 0;
    if (profit_margin > 20) healthScore += 40;
    else if (profit_margin > 10) healthScore += 20;
    if (total_sales > 50000) healthScore += 30;
    else if (total_sales > 10000) healthScore += 15;
    if (total_sales > total_expenses * 1.5) healthScore += 30;
    healthScore = Math.min(100, Math.max(0, healthScore));

    const productSales = new Map<string, { quantity: number; profit: number }>();
    sales.forEach(sale => {
        parseSaleItems(sale.items).forEach(item => {
            const existing = productSales.get(item.item_name) || { quantity: 0, profit: 0 };
            const inventoryItem = inventoryMap.get(item.id);
            const profitPerItem = inventoryItem ? (Number(inventoryItem.unit_price) - Number(inventoryItem.cost_price)) : 0;
            
            productSales.set(item.item_name, {
                quantity: existing.quantity + (item.cart_quantity || 1),
                profit: existing.profit + (profitPerItem * (item.cart_quantity || 1)),
            });
        });
    });

    const top_selling = Array.from(productSales.entries()).sort(([, a], [, b]) => b.quantity - a.quantity).slice(0, 5).map(([name, data]) => ({ name, quantity: data.quantity }));
    const profitable_items = Array.from(productSales.entries()).sort(([, a], [, b]) => b.profit - a.profit).slice(0, 5).map(([name, data]) => ({ name, profit: Math.round(data.profit) }));
    const low_stock = inventory.filter(item => item.quantity <= item.low_stock_threshold && item.quantity > 0);

    return {
        financial_metrics: { total_sales, total_expenses, net_profit, profit_margin, healthScore },
        low_stock,
        top_selling,
        profitable_items,
    };
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedLabel = format(parseISO(label), 'MMM dd, yyyy');
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">{formattedLabel}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} style={{ color: pld.color }}>
            <span className="font-bold">{pld.name}: </span>
            <span>{formatCurrency(pld.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};


// --- Main Dashboard Component ---
const Dashboard = () => {
    const { user, isAdmin } = useAuth();
    const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -29), to: new Date() });

    const { data, isLoading, error } = useQuery({
        queryKey: ['fullDashboard', user?.id, date, isAdmin],
        queryFn: async () => {
            if (!user?.id || !date?.from || !date?.to) throw new Error("User or date range is not defined.");

            const startDate = format(date.from, 'yyyy-MM-dd');
            const toDate = new Date(date.to);
            toDate.setHours(23, 59, 59, 999);
            const endDate = toDate.toISOString();

            // --- Build Conditional Queries ---
            let salesQuery = supabase.from('sales').select('items, total_amount, created_at')
                .gte('created_at', date.from.toISOString())
                .lte('created_at', endDate);

            let expensesQuery = supabase.from('expenses').select('amount, category')
                .gte('date', startDate)
                .lte('date', format(date.to, 'yyyy-MM-dd'));

            if (!isAdmin) {
                salesQuery = salesQuery.eq('user_id', user.id);
                expensesQuery = expensesQuery.eq('user_id', user.id);
            }
            
            const inventoryQuery = supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single()
                .then(adminRes => {
                    if (adminRes.error) throw new Error("Could not find admin profile for inventory.");
                    return supabase.from('inventory').select('id, item_name, unit_price, cost_price, quantity, low_stock_threshold').eq('user_id', adminRes.data.id);
                });

            // Step 1: Fetch the core data from your database first.
            const [salesRes, inventoryRes, expensesRes] = await Promise.all([
                salesQuery,
                inventoryQuery,
                expensesQuery
            ]);

            // Step 2: Check for errors before proceeding.
            if (salesRes.error) throw salesRes.error;
            if (inventoryRes.error) throw inventoryRes.error;
            if (expensesRes.error) throw expensesRes.error;

            // Step 3: Now, invoke the Edge Functions, passing the fetched data in the 'body'.
            const [forecastRes, insightsRes] = await Promise.all([
                supabase.functions.invoke('forecasting', {
                    body: { salesData: salesRes.data }
                }),
                supabase.functions.invoke('apriori-insights', {
                    body: { salesData: salesRes.data }
                })
            ]);

            if (forecastRes.error) throw forecastRes.error;
            if (insightsRes.error) throw insightsRes.error;

            // Step 4: Process all the successful results.
            const analytics = processAnalyticsData(salesRes.data, inventoryRes.data, expensesRes.data);
            
            return {
                analytics,
                forecast: forecastRes.data,
                insights: insightsRes.data.insights
            };
        },
        enabled: !!user?.id && !!date?.from && !!date?.to,
    });

    // --- RENDER STATES ---
    if (isLoading) return <div className="flex h-screen w-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500">Error: {(error as Error).message}</div>;
    if (!data) return <div className="flex h-screen items-center justify-center">No data available.</div>;

    const { analytics, forecast, insights } = data;
    const { financial_metrics, low_stock, top_selling, profitable_items } = analytics;
    
    const healthStatus = financial_metrics.healthScore > 75 ? { color: 'green', text: 'Excellent', icon: Zap } 
                           : financial_metrics.healthScore > 50 ? { color: 'yellow', text: 'Good', icon: TrendingUp }
                           : { color: 'red', text: 'Needs Attention', icon: AlertTriangle };
                           
    const combinedChartData = [
        ...(forecast.historicalData || []).map((d: any) => ({ date: d.date, sales: d.sales })),
        ...(forecast.forecastData || []).map((d: any) => ({ date: d.date, forecast: d.forecast })),
    ];

    return (
    <>
        <Navbar />
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isAdmin ? "Your complete business performance overview." : "Your personal performance overview."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 h-10"><ShieldCheck className="mr-2 h-4 w-4"/>Admin View</Badge>}
                        <Popover><PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date?.from ? (date.to ? (`${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`) : format(date.from, "LLL dd, y")) : (<span>Pick a date</span>)}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent></Popover>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sales</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(financial_metrics.total_sales)}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${financial_metrics.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(financial_metrics.net_profit)}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Profit Margin</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${financial_metrics.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{financial_metrics.profit_margin.toFixed(1)}%</div></CardContent></Card>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                        <Card className={`bg-${healthStatus.color}-50 border-${healthStatus.color}-200`}>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><healthStatus.icon className={`h-4 w-4 text-${healthStatus.color}-600`} />Performance Health</CardTitle></CardHeader>
                            <CardContent className="flex items-baseline gap-2">
                                <div className={`text-2xl font-bold text-${healthStatus.color}-600`}>{financial_metrics.healthScore.toFixed(0)}<span className="text-sm">/100</span></div>
                                <p className={`text-sm font-semibold text-${healthStatus.color}-500`}>{healthStatus.text}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 mt-6">
                    {/* Sales Forecasting Chart */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><TrendingUp className="text-indigo-500" />Sales & Forecasting</CardTitle>
                                <CardDescription>Historical sales data and a 7-day forecast to predict future trends.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={combinedChartData}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis dataKey="date" tickFormatter={(str) => format(parseISO(str), 'MMM d')} tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip content={<CustomAreaTooltip />} />
                                        <Legend />
                                        <Area type="monotone" dataKey="sales" name="Historical Sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                        <Area type="monotone" dataKey="forecast" name="Forecasted Sales" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 mt-6">
                         {/* Strategic Insights */}
                         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                              <Card>
                                  <CardHeader>
                                      <CardTitle className="flex items-center gap-2"><Cpu className="text-purple-500"/>Strategic Insights</CardTitle>
                                      <CardDescription>Actionable suggestions based on product association analysis.</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                      {insights && insights.length > 0 ? (
                                          insights.slice(0, 3).map((rule: InsightRule, index: number) => (
                                              <div key={index} className="flex items-start gap-4 p-3 bg-slate-100 rounded-lg">
                                                  <LinkIcon className="h-5 w-5 mt-1 text-purple-500 flex-shrink-0" />
                                                  <div>
                                                      <p className="font-semibold text-slate-800">
                                                          Customers who buy <span className="text-purple-600">{rule.antecedent}</span> also frequently buy <span className="text-purple-600">{rule.consequent}</span>.
                                                      </p>
                                                      <p className="text-xs text-slate-500">
                                                          Consider bundling these items or placing them near each other. Confidence: <span className="font-bold">{(rule.confidence * 100).toFixed(0)}%</span>
                                                      </p>
                                                  </div>
                                              </div>
                                          ))
                                      ) : (
                                          <p className="text-sm text-center text-slate-500 py-4">Not enough data to generate strategic insights yet.</p>
                                      )}
                                  </CardContent>
                              </Card>
                         </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Best Performers */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShoppingCart className="text-green-500"/>Best Performers</CardTitle>
                                <CardDescription>Top-selling items by quantity sold.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {top_selling.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={top_selling} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                            <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                                            <Bar dataKey="quantity" name="Quantity Sold" fill="#22c55e" background={{ fill: '#f1f5f9' }} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-center text-slate-500 py-4">No sales data for top products.</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Profit Champions */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Target className="text-purple-500"/>Profit Champions</CardTitle>
                                <CardDescription>Items generating the most profit.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profitable_items.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={profitable_items} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#f1f5f9' }} />
                                            <Bar dataKey="profit" name="Profit Generated" fill="#8b5cf6" background={{ fill: '#f1f5f9' }} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-sm text-center text-slate-500 py-4">No profit data available.</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Low Stock Alerts */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-500"/>Low Stock Alerts</CardTitle>
                                <CardDescription>Items that require reordering soon.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[250px] overflow-y-auto">
                                {low_stock.length > 0 ? (
                                    <ul className="space-y-3 text-sm">
                                        {low_stock.map((item: any) => (
                                            <li key={item.id} className="flex justify-between items-center">
                                                <span>{item.item_name}</span>
                                                <span className="font-bold text-red-500 bg-red-100 px-2 py-1 rounded">{item.quantity} left</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-sm text-center text-slate-500 py-4">✅ Inventory levels are healthy.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    </>
    );
};

export default Dashboard;