
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Store {
  id: string;
  store_name: string;
}

interface Product {
  id: string;
  name: string;
}

interface Loss {
  id: string;
  product_id: string;
  hr_shop_id: string;
  loss_type: string;
  quantity_lost: number;
}

interface LossSummaryCardsProps {
  losses?: Loss[];
  products?: Product[];
  stores?: Store[];
}

export const LossSummaryCards: React.FC<LossSummaryCardsProps> = ({
  losses,
  products,
  stores
}) => {
  const summaryData = React.useMemo(() => {
    if (!losses || !products || !stores) return null;

    const totalLosses = losses.length;
    const totalQuantity = losses.reduce((sum, loss) => sum + loss.quantity_lost, 0);
    
    const lossTypeBreakdown = losses.reduce((acc, loss) => {
      acc[loss.loss_type] = (acc[loss.loss_type] || 0) + loss.quantity_lost;
      return acc;
    }, {} as Record<string, number>);

    const productBreakdown = losses.reduce((acc, loss) => {
      const productName = products.find(p => p.id === loss.product_id)?.name || 'Unknown';
      acc[productName] = (acc[productName] || 0) + loss.quantity_lost;
      return acc;
    }, {} as Record<string, number>);

    const storeBreakdown = losses.reduce((acc, loss) => {
      const storeName = stores.find(s => s.id === loss.hr_shop_id)?.store_name || 'Unknown';
      acc[storeName] = (acc[storeName] || 0) + loss.quantity_lost;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLosses,
      totalQuantity,
      lossTypeBreakdown,
      productBreakdown,
      storeBreakdown
    };
  }, [losses, products, stores]);

  if (!summaryData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Losses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.totalLosses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity Lost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summaryData.totalQuantity}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Most Affected Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {Object.entries(summaryData.productBreakdown).length > 0 
              ? Object.entries(summaryData.productBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
              : 'None'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Loss Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium capitalize">
            {Object.entries(summaryData.lossTypeBreakdown).length > 0 
              ? Object.entries(summaryData.lossTypeBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
              : 'None'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
