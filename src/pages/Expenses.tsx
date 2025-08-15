import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Receipt, TrendingDown, Trash2, Pencil, Search, Calendar as CalendarIcon, FileX2 } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

// --- Type Definitions ---
interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}
type NewExpense = Omit<Expense, 'id'>;

// --- Constants & Helpers ---
const CATEGORIES = ['Rent', 'Transport', 'Utilities', 'Inventory', 'Marketing', 'Maintenance', 'Miscellaneous'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#f59e0b'];
const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      Rent: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      Transport: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      Utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      Inventory: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      Marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      Maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

// --- Main Expenses Component ---
const Expenses = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- State Management ---
  const [dialogs, setDialogs] = useState({ add: false, edit: false });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState({ category: 'all', search: '' });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [newExpense, setNewExpense] = useState<NewExpense>({
    amount: 0, category: '', description: '', date: new Date().toISOString().split('T')[0]
  });

  // --- Data Fetching ---
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id || !dateRange?.from || !dateRange?.to) return [];
      const { data, error } = await supabase.from('expenses').select('*').eq('user_id', user.id)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!dateRange,
  });

  // --- Mutations (Create, Update, Delete) ---
  const createMutation = useMutation({
    mutationFn: (expense: NewExpense) => supabase.from('expenses').insert([{ ...expense, user_id: user!.id }]).select().single(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setDialogs({ ...dialogs, add: false });
      setNewExpense({ amount: 0, category: '', description: '', date: new Date().toISOString().split('T')[0] });
      toast({ title: "Success", description: "Expense added successfully." });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (expense: Expense) => supabase.from('expenses').update({ amount: expense.amount, category: expense.category, description: expense.description, date: expense.date }).eq('id', expense.id).select().single(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setDialogs({ ...dialogs, edit: false });
      toast({ title: "Success", description: "Expense updated successfully." });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => supabase.from('expenses').delete().eq('id', expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Success", description: "Expense deleted successfully." });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  // --- Event Handlers ---
  // FIX: Re-added the missing handler function
  const handleAddExpense = () => {
    if (!newExpense.category || newExpense.amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a category and enter an amount greater than zero.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newExpense);
  };
  
  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogs({ ...dialogs, edit: true });
  };
  const handleUpdateExpense = () => {
    if (editingExpense) updateMutation.mutate(editingExpense);
  };

  // --- Filtering & Memoized Calculations ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const { category, search } = filters;
      return (category === 'all' || expense.category === category) &&
             (!search || expense.description.toLowerCase().includes(search.toLowerCase()));
    });
  }, [expenses, filters]);

  const totalFilteredExpenses = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0), [filteredExpenses]);
  const categoryStats = useMemo(() => {
    const stats = filteredExpenses.reduce((acc, { category, amount }) => {
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  // --- JSX Render ---
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6 md:gap-8 md:p-10">
        
        {/* --- Header & Filters --- */}
        <div className="mx-auto flex w-full max-w-7xl flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-3xl font-semibold">Expense Tracker</h1>
                <p className="text-muted-foreground">Manage and analyze your business expenditures.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className="w-full sm:w-[280px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
                <Button className="w-full sm:w-auto" onClick={() => setDialogs({...dialogs, add: true})}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>
        </div>

        {/* --- KPI Cards --- */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-red-500"><CardHeader className="pb-2"><CardTitle>Total Expenses</CardTitle><CardDescription>For the selected period & filters</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(totalFilteredExpenses)}</p></CardContent></Card>
          <Card className="border-l-4 border-blue-500"><CardHeader className="pb-2"><CardTitle>Number of Entries</CardTitle><CardDescription>Total expenses recorded</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{filteredExpenses.length}</p></CardContent></Card>
          <Card className="border-l-4 border-purple-500"><CardHeader className="pb-2"><CardTitle>Average Expense</CardTitle><CardDescription>Average cost per transaction</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(filteredExpenses.length > 0 ? totalFilteredExpenses / filteredExpenses.length : 0)}</p></CardContent></Card>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="mx-auto grid w-full max-w-7xl auto-rows-fr grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Expense Table */}
            <Card className="lg:col-span-3 flex flex-col">
                <CardHeader>
                    <CardTitle>Expense History</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search description..." className="pl-8" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} /></div>
                        <Select value={filters.category} onValueChange={v => setFilters({...filters, category: v})}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 relative h-[450px] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm"><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-24 text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading ? (<TableRow><TableCell colSpan={4} className="text-center h-24">Loading expenses...</TableCell></TableRow>) :
                            filteredExpenses.length > 0 ? (
                                filteredExpenses.map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-muted/50">
                                    <TableCell>
                                    <div className="font-medium">{format(new Date(expense.date), "dd MMM, yyyy")}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.description || '-'}</div>
                                    </TableCell>
                                    <TableCell><Badge className={getCategoryColor(expense.category)} variant="secondary">{expense.category}</Badge></TableCell>
                                    <TableCell className="font-medium text-right">{formatCurrency(expense.amount)}</TableCell>
                                    <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(expense)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this expense record.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(expense.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="text-center h-24"><FileX2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" /><p>No expenses found.</p><p className="text-sm text-muted-foreground">Try adjusting your filters.</p></TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Expense Pie Chart */}
            <Card className="lg:col-span-2 flex flex-col"><CardHeader><CardTitle>Category Breakdown</CardTitle><CardDescription>Visual distribution of spending.</CardDescription></CardHeader><CardContent className="flex-1 flex items-center justify-center p-0">{categoryStats.length > 0 ? <ExpensePieChart data={categoryStats} total={totalFilteredExpenses} /> : <p className="text-sm text-muted-foreground">No data to display.</p>}</CardContent></Card>
        </div>
      </main>

      {/* --- Dialogs for Add/Edit --- */}
      <ExpenseDialog open={dialogs.add} onOpenChange={(isOpen) => setDialogs({...dialogs, add: isOpen})} expense={newExpense} setExpense={setNewExpense} onSave={handleAddExpense} isPending={createMutation.isPending} title="Add New Expense" />
      {editingExpense && <ExpenseDialog open={dialogs.edit} onOpenChange={(isOpen) => setDialogs({...dialogs, edit: isOpen})} expense={editingExpense} setExpense={setEditingExpense} onSave={handleUpdateExpense} isPending={updateMutation.isPending} title="Edit Expense" />}
    </div>
  );
};

// --- Sub-components ---
const ExpensePieChart = ({ data, total }: { data: {name: string, value: number}[], total: number }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 w-full h-full items-center gap-4 p-4">
            <ResponsiveContainer width="100%" height={240}>
                <PieChart><Pie activeIndex={activeIndex} activeShape={props => <ActiveShape {...props} total={total} />} data={data} cx="50%" cy="50%" dataKey="value" nameKey="name" innerRadius="60%" outerRadius="80%" onMouseEnter={(_, index) => setActiveIndex(index)}>{data.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="focus:outline-none" />)}</Pie></PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 text-sm overflow-y-auto max-h-[240px]">
                {data.map((entry, index) => (<div key={index} className={`flex items-center justify-between p-2 rounded-md transition-all cursor-pointer ${index === activeIndex ? 'bg-muted' : ''}`} onMouseEnter={() => setActiveIndex(index)}><div className="flex items-center gap-2 truncate"><div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}/><span className="truncate">{entry.name}</span></div><span className="font-semibold">{((entry.value / total) * 100).toFixed(0)}%</span></div>))}
            </div>
        </div>
    );
};

const ActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    return (
        <g><text x={cx} y={cy - 5} dy={8} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-bold">{payload.name}</text><text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">{formatCurrency(payload.value)}</text><Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} /></g>
    );
};

const ExpenseDialog = ({ open, onOpenChange, expense, setExpense, onSave, isPending, title }: any) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="amount">Amount (₹)</Label><Input id="amount" type="number" value={expense.amount} onChange={(e) => setExpense({...expense, amount: parseFloat(e.target.value) || 0})} /></div>
                <div className="grid gap-2"><Label htmlFor="category">Category</Label><Select value={expense.category} onValueChange={(v) => setExpense({...expense, category: v})}><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={expense.description} onChange={(e) => setExpense({...expense, description: e.target.value})} /></div>
                <div className="grid gap-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" value={expense.date} onChange={(e) => setExpense({...expense, date: e.target.value})} /></div>
            </div>
            <DialogFooter><Button onClick={onSave} disabled={isPending}>{isPending ? 'Saving...' : 'Save Expense'}</Button></DialogFooter>
        </DialogContent>
    </Dialog>
);

export default Expenses;