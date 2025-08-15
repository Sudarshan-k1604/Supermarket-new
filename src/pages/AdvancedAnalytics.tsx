// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// // Fixed: Use aliases for conflicting icon imports
// import { 
//   Download, 
//   AlertTriangle, 
//   ArrowRight, 
//   ShoppingCart, 
//   TrendingUp, 
//   TrendingDown, // Added
//   BarChart as BarChartIcon,
//   PieChart as PieChartIcon,
//   LineChart as LineChartIcon,
//   Users 
// } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';
// // Now these can be imported without conflicts
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, LabelList } from 'recharts';
// import { Navbar } from '@/components/Navbar';
// import { useQuery } from '@tanstack/react-query';
// import { format } from 'date-fns';
// import { Skeleton } from '@/components/ui/skeleton';

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

// const AdvancedAnalytics = () => {
//   const { toast } = useToast();
//   const [analyticsData, setAnalyticsData] = useState<any>(null);

//   // Fetch analytics data
//   const { data, isLoading, isError } = useQuery({
//     queryKey: ['advanced_analytics'],
//     queryFn: async () => {
//       const response = await fetch('http://localhost:8000/api/analytics');
//       if (!response.ok) throw new Error('Failed to fetch analytics');
//       return response.json();
//     },
//     refetchOnWindowFocus: false,
//     staleTime: 300000 // 5 minutes
//   });

//   useEffect(() => {
//     if (data) {
//       setAnalyticsData(data);
//     }
//   }, [data]);

//   const downloadReport = () => {
//     toast({
//       title: "Report Downloaded",
//       description: "Advanced analytics report has been saved as PDF",
//       duration: 3000
//     });
//   };

//   // Custom tooltip for charts
//   const renderTooltip = (props: any) => {
//     const { active, payload, label } = props;
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-white p-4 border rounded-lg shadow-lg">
//           <p className="font-medium">{label}</p>
//           {payload.map((entry: any, index: number) => (
//             <p key={index} style={{ color: entry.color }}>
//               {entry.name}: ₹{entry.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
//             </p>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   if (isError) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Navbar />
//         <div className="container mx-auto px-4 py-8">
//           <div className="text-center py-12">
//             <h2 className="text-xl font-semibold text-red-600">Failed to load analytics</h2>
//             <p className="text-gray-600 mt-2">Please check the backend service and try again.</p>
//             <Button 
//               className="mt-4" 
//               onClick={() => window.location.reload()}
//             >
//               Retry
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
//       <Navbar />
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Intelligence Dashboard</h1>
//             <p className="text-gray-600">Advanced analytics and predictive insights for smarter decisions</p>
//           </div>
          
//           <Button 
//             onClick={downloadReport} 
//             className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
//           >
//             <Download className="h-4 w-4" />
//             Export Full Report
//           </Button>
//         </div>

//         {isLoading ? (
//           <div className="space-y-8">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               {[...Array(4)].map((_, i) => (
//                 <Skeleton key={i} className="h-32 rounded-xl" />
//               ))}
//             </div>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//               {[...Array(4)].map((_, i) => (
//                 <Skeleton key={i} className="h-96 rounded-xl" />
//               ))}
//             </div>
//           </div>
//         ) : analyticsData ? (
//           <>
//             {/* Key Metrics */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
//                   <TrendingUp className="h-5 w-5 text-green-600" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold text-gray-900">
//                     ₹{analyticsData.financial_metrics.total_sales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
//                   </div>
//                   <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
//                 </CardContent>
//               </Card>

//               <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
//                   <TrendingDown className="h-5 w-5 text-red-600" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold text-gray-900">
//                     ₹{analyticsData.financial_metrics.total_expenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
//                   </div>
//                   <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
//                 </CardContent>
//               </Card>

//               <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
//                   <BarChartIcon className="h-5 w-5 text-blue-600" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className={`text-2xl font-bold ${
//                     analyticsData.financial_metrics.net_profit >= 0 
//                       ? 'text-green-600' 
//                       : 'text-red-600'
//                   }`}>
//                     ₹{analyticsData.financial_metrics.net_profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
//                   </div>
//                   <div className="flex items-center mt-1">
//                     <Badge className={
//                       analyticsData.financial_metrics.net_profit >= 0 
//                         ? 'bg-green-100 text-green-800' 
//                         : 'bg-red-100 text-red-800'
//                     }>
//                       Margin: {analyticsData.financial_metrics.profit_margin.toFixed(1)}%
//                     </Badge>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium text-gray-600">7-Day Forecast</CardTitle>
//                   <LineChartIcon className="h-5 w-5 text-purple-600" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold text-gray-900">
//                     ₹{analyticsData.forecast.reduce((a: number, b: number) => a + b, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
//                   </div>
//                   <p className="text-xs text-gray-500 mt-1">Projected sales</p>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Actionable Insights */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//               {/* Top Selling Products */}
//               <Card className="border-0 shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <ShoppingCart className="h-5 w-5 text-blue-600" />
//                     Top Selling Products
//                   </CardTitle>
//                   <CardDescription>Best performing items in the last 30 days</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {analyticsData.top_selling.length > 0 ? (
//                     <div className="space-y-4">
//                       {analyticsData.top_selling.map((item: any, index: number) => (
//                         <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                           <div className="flex items-center gap-3">
//                             <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center">
//                               {index + 1}
//                             </div>
//                             <div>
//                               <p className="font-medium">{item.item_name}</p>
//                               <p className="text-sm text-gray-500">Category: {item.category || 'General'}</p>
//                             </div>
//                           </div>
//                           <Badge variant="secondary" className="px-3 py-1 text-base">
//                             {item.quantity} units
//                           </Badge>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No sales data available</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Inventory Intelligence */}
//               <Card className="border-0 shadow-md">
//                 <CardHeader>
//                   <div className="flex items-center gap-2">
//                     <AlertTriangle className="h-5 w-5 text-yellow-500" />
//                     <CardTitle>Inventory Intelligence</CardTitle>
//                   </div>
//                   <CardDescription>Items needing attention</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {/* Low Stock Section */}
//                   <div>
//                     <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
//                       <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
//                       Low Stock Alerts
//                     </h3>
//                     {analyticsData.low_stock.length > 0 ? (
//                       <div className="space-y-3">
//                         {analyticsData.low_stock.map((item: any, index: number) => (
//                           <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
//                             <span className="font-medium">{item.item_name}</span>
//                             <Badge variant="destructive" className="px-3 py-1">
//                               {item.quantity} units (min: {item.low_stock_threshold})
//                             </Badge>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center py-3 text-gray-500 bg-green-50 rounded-lg">
//                         <p>All items are sufficiently stocked</p>
//                       </div>
//                     )}
//                   </div>

//                   {/* Slow Moving Section */}
//                   <div>
//                     <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
//                       <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
//                       Slow Moving Inventory
//                     </h3>
//                     {analyticsData.slow_moving.length > 0 ? (
//                       <div className="space-y-3">
//                         {analyticsData.slow_moving.map((item: any, index: number) => (
//                           <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
//                             <span className="font-medium">{item.item_name}</span>
//                             <Badge variant="outline" className="border-purple-300 text-purple-700">
//                               No sales in 30 days
//                             </Badge>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-center py-3 text-gray-500 bg-green-50 rounded-lg">
//                         <p>No slow moving items</p>
//                       </div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Profitability & Trends */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//               {/* Profitability Analysis */}
//               <Card className="border-0 shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <TrendingUp className="h-5 w-5 text-green-600" />
//                     Profitability Analysis
//                   </CardTitle>
//                   <CardDescription>Most profitable items by margin</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {analyticsData.profitable_items.length > 0 ? (
//                     <div className="h-80">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <BarChart data={analyticsData.profitable_items}>
//                           <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
//                           <XAxis dataKey="item_name" />
//                           <YAxis 
//                             tickFormatter={(value) => `₹${value}`}
//                             width={80}
//                           />
//                           <Tooltip content={renderTooltip} />
//                           <Bar 
//                             dataKey="profit" 
//                             name="Profit"
//                             fill="#10b981"
//                             radius={[4, 4, 0, 0]}
//                           >
//                             <LabelList 
//                               dataKey="profit" 
//                               position="top" 
//                               formatter={(value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
//                             />
//                           </Bar>
//                         </BarChart>
//                       </ResponsiveContainer>
//                     </div>
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No profitability data available</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Sales Trend & Forecast */}
//               <Card className="border-0 shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <LineChartIcon className="h-5 w-5 text-blue-600" />
//                     Sales Trend & Forecast
//                   </CardTitle>
//                   <CardDescription>Daily sales with 7-day projection</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {analyticsData.daily_sales.length > 0 ? (
//                     <div className="h-80">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <LineChart data={analyticsData.daily_sales}>
//                           <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
//                           <XAxis 
//                             dataKey="date" 
//                             tickFormatter={(value) => format(new Date(value), 'MMM dd')}
//                           />
//                           <YAxis 
//                             tickFormatter={(value) => `₹${value}`}
//                             width={80}
//                           />
//                           <Tooltip content={renderTooltip} />
//                           <Line 
//                             type="monotone" 
//                             dataKey="total_amount" 
//                             name="Actual Sales"
//                             stroke="#3b82f6" 
//                             strokeWidth={3} 
//                             dot={{ r: 4 }}
//                             activeDot={{ r: 6 }}
//                           />
//                           {analyticsData.forecast.length > 0 && (
//                             <Line 
//                               type="monotone" 
//                               dataKey="forecast" 
//                               name="7-Day Forecast"
//                               stroke="#ef4444" 
//                               strokeWidth={2} 
//                               strokeDasharray="5 5"
//                               dot={false}
//                             />
//                           )}
//                           <Legend />
//                         </LineChart>
//                       </ResponsiveContainer>
//                     </div>
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No sales data available</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Customer & Expense Analysis */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//               {/* Customer Trends */}
//               <Card className="border-0 shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <Users className="h-5 w-5 text-indigo-600" />
//                     Customer Trends
//                   </CardTitle>
//                   <CardDescription>New vs returning customers</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {analyticsData.customer_trends.length > 0 ? (
//                     <div className="h-80">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                           <Pie
//                             data={analyticsData.customer_trends}
//                             cx="50%"
//                             cy="50%"
//                             outerRadius={80}
//                             fill="#8884d8"
//                             dataKey="count"
//                             label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                           >
//                             {analyticsData.customer_trends.map((entry: any, index: number) => (
//                               <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#8b5cf6'} />
//                             ))}
//                           </Pie>
//                           <Tooltip formatter={(value) => [`${value} customers`]} />
//                           <Legend />
//                         </PieChart>
//                       </ResponsiveContainer>
//                     </div>
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No customer data available</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Expense Breakdown */}
//               <Card className="border-0 shadow-md">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <PieChartIcon className="h-5 w-5 text-amber-600" />
//                     Expense Breakdown
//                   </CardTitle>
//                   <CardDescription>Distribution of business expenses</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {analyticsData.expense_breakdown.length > 0 ? (
//                     <div className="h-80">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                           <Pie
//                             data={analyticsData.expense_breakdown}
//                             cx="50%"
//                             cy="50%"
//                             outerRadius={80}
//                             fill="#8884d8"
//                             dataKey="amount"
//                             label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                           >
//                             {analyticsData.expense_breakdown.map((entry: any, index: number) => (
//                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                             ))}
//                           </Pie>
//                           <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`]} />
//                           <Legend />
//                         </PieChart>
//                       </ResponsiveContainer>
//                     </div>
//                   ) : (
//                     <div className="text-center py-8 text-gray-500">
//                       <p>No expense data available</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Association Rules */}
//             {analyticsData.associations && analyticsData.associations.length > 0 && (
//               <Card className="mb-8 border-0 shadow-md border-blue-100">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <BarChartIcon className="h-5 w-5 text-teal-600" />
//                     Frequently Bought Together
//                   </CardTitle>
//                   <CardDescription>Product association insights</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {analyticsData.associations.map((rule: any, index: number) => (
//                       <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
//                         <div className="flex flex-col sm:flex-row sm:items-center gap-3">
//                           <div className="flex items-center">
//                             <div className="bg-white px-3 py-2 rounded-md border shadow-sm">
//                               {rule.antecedents.join(', ')}
//                             </div>
//                             <ArrowRight className="h-5 w-5 mx-2 text-blue-500" />
//                             <div className="bg-white px-3 py-2 rounded-md border shadow-sm">
//                               {rule.consequents.join(', ')}
//                             </div>
//                           </div>
//                           <div className="ml-auto flex flex-col sm:flex-row sm:items-center gap-2">
//                             <Badge className="bg-blue-100 text-blue-800">
//                               Confidence: {(rule.confidence * 100).toFixed(1)}%
//                             </Badge>
//                             <Badge variant="secondary" className="bg-green-100 text-green-800">
//                               Lift: {rule.lift.toFixed(2)}
//                             </Badge>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             )}

//             {/* Recommendations */}
//             <Card className="border-0 shadow-md border-green-100">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <BarChartIcon className="h-5 w-5 text-green-600" />
//                   Strategic Recommendations
//                 </CardTitle>
//                 <CardDescription>Actionable insights based on analysis</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {analyticsData.low_stock.length > 0 && (
//                     <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
//                       <h3 className="font-semibold text-amber-800 mb-2">Restock Recommendations</h3>
//                       <p className="text-amber-700">
//                         Consider restocking: {analyticsData.low_stock.map((item: any) => item.item_name).join(', ')}
//                       </p>
//                     </div>
//                   )}
                  
//                   {analyticsData.slow_moving.length > 0 && (
//                     <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
//                       <h3 className="font-semibold text-purple-800 mb-2">Slow-Moving Items</h3>
//                       <p className="text-purple-700">
//                         Run promotions on: {analyticsData.slow_moving.map((item: any) => item.item_name).join(', ')}
//                       </p>
//                     </div>
//                   )}
                  
//                   {analyticsData.associations && analyticsData.associations.length > 0 && (
//                     <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
//                       <h3 className="font-semibold text-teal-800 mb-2">Bundling Opportunities</h3>
//                       <p className="text-teal-700">
//                         Create bundles for: {analyticsData.associations.map((rule: any) => 
//                           `${rule.antecedents.join(' + ')} → ${rule.consequents.join(' + ')}`
//                         ).join(', ')}
//                       </p>
//                     </div>
//                   )}
                  
//                   <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
//                     <h3 className="font-semibold text-blue-800 mb-2">Revenue Optimization</h3>
//                     <p className="text-blue-700">
//                       Focus on high-margin products: {analyticsData.profitable_items
//                         .slice(0, 3)
//                         .map((item: any) => item.item_name)
//                         .join(', ')}
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </>
//         ) : null}
//       </div>
//     </div>
//   );
// };

// export default AdvancedAnalytics;

 {/* Recommendations */}
            

           import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Use aliases for conflicting icon imports
import { 
  Download, 
  AlertTriangle, 
  ArrowRight, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Users 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Import recharts components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, LabelList } from 'recharts';
import { Navbar } from '@/components/Navbar';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];
// The single, correct API endpoint for your deployed application
const API_URL = 'http://localhost:8000/api/analytics';

const AdvancedAnalytics = () => {
  const { toast } = useToast();

  // Fetch all analytics data from the single, correct endpoint
  const { data: analyticsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['advanced_analytics'],
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });


  const downloadReport = () => {
    toast({
      title: "Report Downloaded",
      description: "Advanced analytics report has been saved as PDF",
      duration: 3000
    });
    // Placeholder for actual PDF generation logic
  };

  // Custom tooltip for charts
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600">Failed to load analytics</h2>
            <p className="text-gray-600 mt-2">Could not connect to the analytics service. Please ensure the backend is running and the URL is correct.</p>
            <Button 
              className="mt-4" 
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Intelligence Dashboard</h1>
            <p className="text-gray-600">Advanced analytics and predictive insights for smarter decisions</p>
          </div>
          
          <Button 
            onClick={downloadReport} 
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          >
            <Download className="h-4 w-4" />
            Export Full Report
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-xl" />
              ))}
            </div>
          </div>
        ) : analyticsData ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{analyticsData.financial_metrics.total_sales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{analyticsData.financial_metrics.total_expenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
                  <BarChartIcon className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    analyticsData.financial_metrics.net_profit >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ₹{analyticsData.financial_metrics.net_profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center mt-1">
                    <Badge className={
                      analyticsData.financial_metrics.net_profit >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }>
                      Margin: {analyticsData.financial_metrics.profit_margin.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">7-Day Forecast</CardTitle>
                  <LineChartIcon className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {/* The API returns an array of numbers for forecast */}
                    ₹{analyticsData.forecast.reduce((a: number, b: number) => a + b, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Projected sales</p>
                </CardContent>
              </Card>
            </div>

            {/* Actionable Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Selling Products */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription>Best performing items in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.top_selling.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.top_selling.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-800 rounded-full h-8 w-8 flex items-center justify-center">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              <p className="text-sm text-gray-500">Category: {item.category || 'General'}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="px-3 py-1 text-base">
                            {item.quantity} units
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No sales data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inventory Intelligence */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <CardTitle>Inventory Intelligence</CardTitle>
                  </div>
                  <CardDescription>Items needing attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Low Stock Section */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Low Stock Alerts
                    </h3>
                    {analyticsData.low_stock.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.low_stock.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                            <span className="font-medium">{item.item_name}</span>
                            <Badge variant="destructive" className="px-3 py-1">
                              {item.quantity} units (min: {item.low_stock_threshold})
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-gray-500 bg-green-50 rounded-lg">
                        <p>All items are sufficiently stocked</p>
                      </div>
                    )}
                  </div>

                  {/* Slow Moving Section */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                      Slow Moving Inventory
                    </h3>
                    {analyticsData.slow_moving.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.slow_moving.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <span className="font-medium">{item.item_name}</span>
                            <Badge variant="outline" className="border-purple-300 text-purple-700">
                              No sales in 30 days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-gray-500 bg-green-50 rounded-lg">
                        <p>No slow moving items</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profitability & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Profitability Analysis */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Profitability Analysis
                  </CardTitle>
                  <CardDescription>Most profitable items by margin</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.profitable_items.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.profitable_items}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="item_name" angle={-10} textAnchor="end" height={60} interval={0} />
                          <YAxis 
                            tickFormatter={(value) => `₹${value}`}
                            width={80}
                          />
                          <Tooltip content={renderTooltip} />
                          <Bar 
                            dataKey="profit" 
                            name="Profit"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          >
                            <LabelList 
                              dataKey="profit" 
                              position="top" 
                              formatter={(value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No profitability data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sales Trend & Forecast */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-blue-600" />
                    Sales Trend & Forecast
                  </CardTitle>
                  <CardDescription>Daily sales with 7-day projection</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.daily_sales.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.daily_sales}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                          />
                          <YAxis 
                            tickFormatter={(value) => `₹${value}`}
                            width={80}
                          />
                          <Tooltip content={renderTooltip} />
                          <Line 
                            type="monotone" 
                            dataKey="total_amount" 
                            name="Actual Sales"
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          {analyticsData.forecast.length > 0 && (
                            <Line 
                              type="monotone" 
                              dataKey="forecast" 
                              name="7-Day Forecast"
                              stroke="#ef4444" 
                              strokeWidth={2} 
                              strokeDasharray="5 5"
                              dot={false}
                            />
                          )}
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No sales data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Customer & Expense Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Customer Trends */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Customer Trends
                  </CardTitle>
                  <CardDescription>New vs returning customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.customer_trends.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.customer_trends}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {analyticsData.customer_trends.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#8b5cf6'} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} customers`]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No customer data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expense Breakdown */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-amber-600" />
                    Expense Breakdown
                  </CardTitle>
                  <CardDescription>Distribution of business expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.expense_breakdown.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.expense_breakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {analyticsData.expense_breakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No expense data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Association Rules */}
            {analyticsData.associations && analyticsData.associations.length > 0 && (
              <Card className="mb-8 border-0 shadow-md border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-teal-600" />
                    Frequently Bought Together
                  </CardTitle>
                  <CardDescription>Product association insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.associations.map((rule: any, index: number) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center">
                            <div className="bg-white px-3 py-2 rounded-md border shadow-sm">
                              {rule.antecedents.join(', ')}
                            </div>
                            <ArrowRight className="h-5 w-5 mx-2 text-blue-500" />
                            <div className="bg-white px-3 py-2 rounded-md border shadow-sm">
                              {rule.consequents.join(', ')}
                            </div>
                          </div>
                          <div className="ml-auto flex flex-col sm:flex-row sm:items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              Confidence: {(rule.confidence * 100).toFixed(1)}%
                            </Badge>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Lift: {rule.lift.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="border-0 shadow-md border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChartIcon className="h-5 w-5 text-green-600" />
                  Strategic Recommendations
                </CardTitle>
                <CardDescription>Actionable insights based on analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.low_stock.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <h3 className="font-semibold text-amber-800 mb-2">Restock Recommendations</h3>
                      <p className="text-amber-700">
                        Consider restocking: {analyticsData.low_stock.map((item: any) => item.item_name).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {analyticsData.slow_moving.length > 0 && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="font-semibold text-purple-800 mb-2">Slow-Moving Items</h3>
                      <p className="text-purple-700">
                        Run promotions on: {analyticsData.slow_moving.map((item: any) => item.item_name).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {analyticsData.associations && analyticsData.associations.length > 0 && (
                    <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <h3 className="font-semibold text-teal-800 mb-2">Bundling Opportunities</h3>
                      <p className="text-teal-700">
                        Create bundles for: {analyticsData.associations.map((rule: any) => 
                          `${rule.antecedents.join(' + ')} → ${rule.consequents.join(' + ')}`
                        ).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Revenue Optimization</h3>
                    <p className="text-blue-700">
                      Focus on high-margin products: {analyticsData.profitable_items
                        .slice(0, 3)
                        .map((item: any) => item.item_name)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;