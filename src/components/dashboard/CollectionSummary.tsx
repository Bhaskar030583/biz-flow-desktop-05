
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CreditCard, TrendingUp, TrendingDown } from "lucide-react";

interface CollectionSummaryProps {
  selectedShops: string[];
  startDate: Date | null;
  endDate: Date | null;
}

export function CollectionSummary({ selectedShops, startDate, endDate }: CollectionSummaryProps) {
  const { data: creditsData, isLoading } = useQuery({
    queryKey: ['collection-summary', selectedShops, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('credits')
        .select('credit_type, amount, hr_shop_id');

      if (selectedShops.length > 0) {
        query = query.in('hr_shop_id', selectedShops);
      }

      if (startDate) {
        query = query.gte('credit_date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('credit_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading collection summary...</div>;
  }

  const summary = creditsData?.reduce((acc, credit) => {
    if (credit.credit_type === 'cash_collection') {
      acc.cashCollection += Number(credit.amount);
    }
    return acc;
  }, {
    cashCollection: 0
  }) || { cashCollection: 0 };

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Additional Cash Collection</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{summary.cashCollection.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Extra cash collections recorded
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
