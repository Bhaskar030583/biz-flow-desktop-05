
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { POSSystem } from "@/components/pos/POSSystem";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const POS = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 h-full">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        ) : (
          <POSSystem products={products} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default POS;
