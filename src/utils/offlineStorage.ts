
interface OfflineSale {
  id: string;
  user_id: string;
  items: any[];
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  timestamp: number;
  synced: boolean;
}

const OFFLINE_SALES_KEY = 'vendorflow_offline_sales';

export const saveOfflineSale = (saleData: Omit<OfflineSale, 'id' | 'timestamp' | 'synced'>) => {
  const offlineSales = getOfflineSales();
  const newSale: OfflineSale = {
    ...saleData,
    id: `offline_${Date.now()}`,
    timestamp: Date.now(),
    synced: false
  };
  
  offlineSales.push(newSale);
  localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(offlineSales));
  return newSale;
};

export const getOfflineSales = (): OfflineSale[] => {
  try {
    const stored = localStorage.getItem(OFFLINE_SALES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getUnsyncedSales = (): OfflineSale[] => {
  return getOfflineSales().filter(sale => !sale.synced);
};

export const markSaleAsSynced = (saleId: string) => {
  const offlineSales = getOfflineSales();
  const updatedSales = offlineSales.map(sale => 
    sale.id === saleId ? { ...sale, synced: true } : sale
  );
  localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(updatedSales));
};

export const clearSyncedSales = () => {
  const offlineSales = getOfflineSales();
  const unsyncedSales = offlineSales.filter(sale => !sale.synced);
  localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(unsyncedSales));
};

export const syncOfflineSales = async (supabaseClient: any) => {
  const unsyncedSales = getUnsyncedSales();
  const syncResults = [];
  
  for (const sale of unsyncedSales) {
    try {
      const { data, error } = await supabaseClient
        .from('sales')
        .insert([{
          user_id: sale.user_id,
          items: sale.items,
          total_amount: sale.total_amount,
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone,
          customer_email: sale.customer_email
        }])
        .select()
        .single();
      
      if (!error) {
        markSaleAsSynced(sale.id);
        syncResults.push({ success: true, saleId: sale.id });
      } else {
        syncResults.push({ success: false, saleId: sale.id, error });
      }
    } catch (error) {
      syncResults.push({ success: false, saleId: sale.id, error });
    }
  }
  
  return syncResults;
};
