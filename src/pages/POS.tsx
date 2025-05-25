
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { POSSystem } from "@/components/pos/POSSystem";
import { StoreInfoModal } from "@/components/pos/StoreInfoModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreInfo {
  storeName: string;
  salespersonName: string;
}

const POS = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(true);

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

  const handleStoreInfoComplete = (info: StoreInfo) => {
    setStoreInfo(info);
    setShowStoreModal(false);
  };

  return (
    <DashboardLayout>
      <StoreInfoModal
        isOpen={showStoreModal}
        onComplete={handleStoreInfoComplete}
      />
      
      {!showStoreModal && (
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
            <POSSystem products={products} storeInfo={storeInfo} />
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default POS;
