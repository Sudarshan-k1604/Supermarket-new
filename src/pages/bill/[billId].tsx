import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { format } from 'date-fns';

// Define the shape of your sale and item data for type safety
interface SaleItem {
  id: string;
  item_name: string;
  hsn_code?: string;
  cart_quantity: number;
  unit_price: number;
  total_price: number;
  gst_rate: number;
  gst_amount: number;
  final_amount: number;
}

interface SaleData {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  items: SaleItem[];
  bill_data: any;
}

const BillPage = () => {
  const router = useRouter();
  const { billId } = router.query;
  const [sale, setSale] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId || typeof billId !== 'string') return;

    const fetchSaleData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('id', billId)
        .single();

      if (error || !data) {
        setError('Could not find the invoice. Please check the link.');
        console.error(error);
      } else {
        // Safely parse JSON data
        const parsedData = {
          ...data,
          items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
          bill_data: typeof data.bill_data === 'string' ? JSON.parse(data.bill_data) : data.bill_data,
        };
        setSale(parsedData);
      }
      setLoading(false);
    };

    fetchSaleData();
  }, [billId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Card className="p-8">
            <CardContent>
                <h2 className="text-xl font-bold text-red-600">Error</h2>
                <p className="mt-2 text-gray-600">{error || 'An unknown error occurred.'}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  const { bill_data: billData } = sale;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Card className="max-w-4xl mx-auto p-6 bg-white shadow-lg">
        <CardContent>
          {/* Use company info from the saved bill_data */}
          <div className="text-center mb-6 border-b pb-4">
            <h2 className="text-3xl font-bold">{billData?.companyInfo?.name}</h2>
            <p className="text-gray-600 mt-1">{billData?.companyInfo?.address}</p>
            <p className="text-sm text-gray-500">GSTIN: {billData?.companyInfo?.gstin} | Phone: {billData?.companyInfo?.phone}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
              <p className="font-medium text-lg">{sale.customer_name}</p>
              <p className="text-gray-600">{sale.customer_phone}</p>
            </div>
            <div className="text-right">
              <p><strong>Invoice No:</strong> {billData?.billId}</p>
              <p><strong>Date:</strong> {format(new Date(sale.created_at), 'dd MMM yyyy, hh:mm a')}</p>
            </div>
          </div>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="font-bold">Description</TableHead>
                    <TableHead className="text-right font-bold">Qty</TableHead>
                    <TableHead className="text-right font-bold">Rate</TableHead>
                    <TableHead className="text-right font-bold">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sale.items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell className="text-right">{item.cart_quantity}</TableCell>
                        <TableCell className="text-right">₹{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.final_amount.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
                <div className="flex justify-between border-t pt-3">
                    <span>Subtotal</span>
                    <span className="text-gray-700">₹{billData?.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total GST</span>
                    <span className="text-gray-700">₹{billData?.totalGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t-2 pt-3">
                    <span>Grand Total:</span>
                    <span>₹{sale.total_amount.toFixed(2)}</span>
                </div>
            </div>
          </div>
          <div className="text-center mt-10 text-sm text-gray-500">
            Thank you for your business! This is a computer-generated invoice.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillPage;