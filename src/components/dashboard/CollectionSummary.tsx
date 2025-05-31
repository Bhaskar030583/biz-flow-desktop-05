
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Return empty div since no collection summary is needed
  return <div></div>;
}
