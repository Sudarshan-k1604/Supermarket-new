import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';

// UI Components from shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Icons from lucide-react
import { Plus, Edit, Trash2, Search, Info, Package, BarChart, Box, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

// App-specific imports
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the shape of an inventory item
interface InventoryItem {
  id: string;
  user_id?: string;
  item_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  low_stock_threshold: number;
  is_available: boolean;
  barcode?: string | null;
  hsn_code?: string | null;
  image_url?: string | null;
  description?: string | null;
  brand?: string | null;
  sku?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Zod schema for form validation
const productSchema = z.object({
  item_name: z.string().min(2, "Product name must be at least 2 characters."),
  category: z.string().min(2, "Category is required."),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
  unit_price: z.coerce.number().min(0, "Selling price must be a positive number."),
  cost_price: z.coerce.number().min(0, "Cost price must be a positive number."),
  low_stock_threshold: z.coerce.number().min(0, "Low stock threshold cannot be negative."),
  is_available: z.boolean().default(true),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  hsn_code: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

// --- Reusable Child Components ---

const InventoryHeader = ({ onAddClick }: { onAddClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
  >
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <Package className="h-8 w-8 text-indigo-600" />
        Inventory Dashboard
      </h1>
      <p className="text-gray-600 max-w-2xl">
        A complete overview of your products. Add, edit, and track your inventory with ease.
      </p>
    </div>
    <Button onClick={onAddClick} className="bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-300 transform hover:scale-105">
      <Plus className="h-4 w-4 mr-2" />
      Add New Product
    </Button>
  </motion.div>
);

const InventoryStats = ({ items }: { items: InventoryItem[] }) => {
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.is_available && item.quantity > 0 && item.quantity <= item.low_stock_threshold).length;
    const outOfStockItems = items.filter(item => item.is_available && item.quantity === 0).length;
    return { totalItems, lowStockItems, outOfStockItems };
  }, [items]);

  const statCards = [
    { title: 'Total Products', value: stats.totalItems, icon: Box, color: 'indigo' },
    { title: 'Low Stock', value: stats.lowStockItems, icon: AlertTriangle, color: 'amber' },
    { title: 'Out of Stock', value: stats.outOfStockItems, icon: XCircle, color: 'rose' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`bg-${stat.color}-100 p-3 rounded-lg mr-4`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-500">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

const InventoryFilters = ({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, activeTab, setActiveTab, categories }: any) => (
  <Card className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm">
    <CardContent className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="w-full md:w-56">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: string) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1 rounded-lg w-full md:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="low">Low Stock</TabsTrigger>
          <TabsTrigger value="out">Out of Stock</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>
    </CardContent>
  </Card>
);

const ProductForm = ({ onSubmit, initialData, isSubmitting }: { onSubmit: (data: ProductFormData) => void; initialData?: Partial<ProductFormData>; isSubmitting: boolean }) => {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      item_name: '',
      category: '',
      quantity: 0,
      unit_price: 0,
      cost_price: 0,
      low_stock_threshold: 10,
      is_available: true,
      brand: '',
      description: '',
      image_url: '',
      hsn_code: '',
      sku: '',
      barcode: ''
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        {/* Left Column */}
        <div className="space-y-4">
          <FormField control={form.control} name="item_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name *</FormLabel>
              <FormControl><Input placeholder="e.g., Wireless Mouse" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <FormControl><Input placeholder="e.g., Electronics" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem>
              <FormLabel>Brand</FormLabel>
              <FormControl><Input placeholder="e.g., Logitech" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Product details..." {...field} value={field.value ?? ''} className="min-h-[100px]" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="image_url" render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl><Input placeholder="https://..." {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem> <FormLabel>Quantity *</FormLabel> <FormControl><Input type="number" min="0" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="low_stock_threshold" render={({ field }) => ( <FormItem> <FormLabel>Low Stock Alert</FormLabel> <FormControl><Input type="number" min="0" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="cost_price" render={({ field }) => ( <FormItem> <FormLabel>Cost Price (₹) *</FormLabel> <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            <FormField control={form.control} name="unit_price" render={({ field }) => ( <FormItem> <FormLabel>Selling Price (₹) *</FormLabel> <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          </div>
          <FormField control={form.control} name="hsn_code" render={({ field }) => ( <FormItem> <FormLabel>HSN Code</FormLabel> <FormControl><Input placeholder="e.g., 8471" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name="sku" render={({ field }) => ( <FormItem> <FormLabel>SKU</FormLabel> <FormControl><Input placeholder="e.g., WM-LOG-001" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name="barcode" render={({ field }) => ( <FormItem> <FormLabel>Barcode (UPC/EAN)</FormLabel> <FormControl><Input placeholder="e.g., 123456789012" {...field} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name="is_available" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-4">
              <FormLabel className="text-base">Product Available</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
        </div>
        <DialogFooter className="col-span-1 md:col-span-2 border-t border-gray-200 pt-4">
          <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// --- Main Inventory Component ---

const Inventory = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dialogState, setDialogState] = useState<{ mode: 'add' | 'edit' | null; item: InventoryItem | null }>({ mode: null, item: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // --- Data Fetching (React Query) ---
  const { data: inventoryItems = [], isLoading, isError, error } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('inventory').select('*').eq('user_id', user.id).order('item_name', { ascending: true });
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!user?.id
  });

  // --- Mutations (React Query) ---
  const useMutateInventory = (action: 'add' | 'update' | 'delete') => {
    return useMutation({
      mutationFn: async (payload: any) => {
        if (!user?.id) throw new Error("User not authenticated");
        let result;
        if (action === 'add') {
          result = await supabase.from('inventory').insert([{ ...payload, user_id: user.id }]).select().single();
        } else if (action === 'update') {
          const { id, ...updateData } = payload;
          result = await supabase.from('inventory').update(updateData).eq('id', id).eq('user_id', user.id).select().single();
        } else if (action === 'delete') {
          result = await supabase.from('inventory').delete().eq('id', payload.id).eq('user_id', user.id);
        }
        if (result?.error) throw result.error;
        return result?.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        setDialogState({ mode: null, item: null });
        toast({ title: "Success", description: `Item ${action === 'add' ? 'added' : action === 'update' ? 'updated' : 'deleted'} successfully` });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || `Failed to ${action} item`, variant: "destructive" });
      }
    });
  };

  const addItemMutation = useMutateInventory('add');
  const updateItemMutation = useMutateInventory('update');
  const deleteItemMutation = useMutateInventory('delete');

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.barcode && item.barcode.includes(searchTerm)) ||
                            (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      let matchesTab = false;
      switch (activeTab) {
        case 'active': matchesTab = item.is_available && item.quantity > 0; break;
        case 'low': matchesTab = item.is_available && item.quantity > 0 && item.quantity <= item.low_stock_threshold; break;
        case 'out': matchesTab = item.is_available && item.quantity === 0; break;
        case 'inactive': matchesTab = !item.is_available; break;
        default: matchesTab = true; // 'all'
      }
      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [inventoryItems, searchTerm, selectedCategory, activeTab]);

  // --- Event Handlers ---
  const handleFormSubmit = (data: ProductFormData) => {
    // Sanitize empty strings from optional fields to null for DB
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
    );

    if (dialogState.mode === 'add') {
      addItemMutation.mutate(sanitizedData);
    } else if (dialogState.mode === 'edit' && dialogState.item) {
      updateItemMutation.mutate({ id: dialogState.item.id, ...sanitizedData });
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (!item.is_available) return { text: "Inactive", icon: XCircle, color: "gray" };
    if (item.quantity === 0) return { text: "Out of Stock", icon: XCircle, color: "rose" };
    if (item.quantity <= item.low_stock_threshold) return { text: "Low Stock", icon: AlertTriangle, color: "amber" };
    return { text: "In Stock", icon: CheckCircle, color: "green" };
  };

  // --- Render Logic ---
  if (isLoading) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="container mx-auto p-8"><Skeleton className="h-96 w-full" /></div></div>
  );
  if (isError) return (
    <div className="min-h-screen bg-gray-50"><Navbar /><div className="container mx-auto p-8 text-center text-red-500">Error: {error?.message}</div></div>
  );

  const categories = [...new Set(inventoryItems.map(item => item.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        
        <InventoryHeader onAddClick={() => setDialogState({ mode: 'add', item: null })} />
        <InventoryStats items={inventoryItems} />
        <InventoryFilters 
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          activeTab={activeTab} setActiveTab={setActiveTab}
          categories={categories}
        />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle>Products ({filteredItems.length})</CardTitle>
              <CardDescription>Showing {filteredItems.length} of {inventoryItems.length} total products.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => {
                        const status = getStockStatus(item);
                        return (
                          <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-4">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.item_name} className="w-12 h-12 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="h-6 w-6 text-gray-400" /></div>
                                )}
                                <div>
                                  <div className="text-gray-900">{item.item_name}</div>
                                  <div className="text-sm text-gray-500">{item.brand || 'No Brand'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                            <TableCell><div className="font-mono text-sm">{item.sku || 'N/A'}</div></TableCell>
                            <TableCell className="text-center font-bold text-lg">{item.quantity}</TableCell>
                            <TableCell>
                              <div>Selling: <span className="font-semibold">₹{item.unit_price}</span></div>
                              <div className="text-xs text-gray-500">Cost: ₹{item.cost_price}</div>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-2 text-sm font-medium text-${status.color}-600`}>
                                <status.icon className="h-4 w-4" />
                                {status.text}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button size="icon" variant="ghost" onClick={() => setDialogState({ mode: 'edit', item })}><Edit className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="text-rose-500 hover:text-rose-700" onClick={() => deleteItemMutation.mutate({ id: item.id })}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                          <Package className="h-12 w-12 mx-auto text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                          <p className="mt-1 text-gray-500">Try adjusting your search or filter.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogState.mode === 'add' || dialogState.mode === 'edit'} onOpenChange={() => setDialogState({ mode: null, item: null })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {dialogState.mode === 'add' ? <Plus className="text-indigo-600" /> : <Edit className="text-indigo-600" />}
              {dialogState.mode === 'add' ? 'Add New Product' : 'Edit Product'}
            </DialogTitle>
            <DialogDescription>
              {dialogState.mode === 'add' ? 'Fill in the details to add a new product to your inventory.' : `Editing: ${dialogState.item?.item_name}`}
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            onSubmit={handleFormSubmit}
            initialData={dialogState.mode === 'edit' ? dialogState.item ?? undefined : undefined}
            isSubmitting={addItemMutation.isPending || updateItemMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;