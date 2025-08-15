
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package } from 'lucide-react';

interface InventoryItem {
  item_name: string;
  quantity: number;
  low_stock_threshold: number;
  category: string;
}

interface InventoryAlertsCardProps {
  data: InventoryItem[];
}

export const InventoryAlertsCard: React.FC<InventoryAlertsCardProps> = ({ data }) => {
  const criticalItems = data.filter(item => item.quantity === 0);
  const lowStockItems = data.filter(item => item.quantity > 0 && item.quantity <= item.low_stock_threshold);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${data.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
          Inventory Alerts
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Items needing immediate attention to avoid stockouts and lost sales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-green-700">All Good!</p>
            <p className="text-xs text-slate-500">All items are well-stocked</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Critical - Out of Stock */}
            {criticalItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive" className="text-xs">CRITICAL</Badge>
                  <span className="text-sm font-medium text-red-700">Out of Stock</span>
                </div>
                <div className="space-y-2">
                  {criticalItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.item_name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">0 left</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock */}
            {lowStockItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">LOW STOCK</Badge>
                  <span className="text-sm font-medium text-orange-700">Running Low</span>
                </div>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.item_name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          {item.quantity} left
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">Min: {item.low_stock_threshold}</p>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length > 5 && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      +{lowStockItems.length - 5} more items need restocking
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded mt-4">
              ⚠️ <strong>Action Needed:</strong> {criticalItems.length > 0 ? 'Restock critical items immediately to avoid lost sales. ' : ''}
              {lowStockItems.length > 0 ? 'Schedule restocking for low inventory items this week.' : ''}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
