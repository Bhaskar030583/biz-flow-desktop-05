
import React, { useState, useEffect } from "react";
import { POSSystem } from "@/components/pos/POSSystem";
import { StoreInfoModal } from "@/components/pos/StoreInfoModal";
import QuickActualStockButton from "@/components/stock/QuickActualStockButton";
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
  const [isPopupWindow, setIsPopupWindow] = useState(false);
  const [storeInfoCompleted, setStoreInfoCompleted] = useState(false);

  const { data: products, isLoading, refetch: refetchProducts } = useQuery({
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

  // Check if this is a popup window and open popup if not
  useEffect(() => {
    const checkIfPopup = window.opener !== null || window.name === 'POSWindow';
    setIsPopupWindow(checkIfPopup);
    
    if (!checkIfPopup) {
      const openPOSPopup = () => {
        const popupUrl = window.location.href;
        const popupFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
        
        const popup = window.open(popupUrl, 'POSWindow', popupFeatures);
        
        if (popup) {
          popup.focus();
          console.log('POS popup window opened successfully');
        } else {
          console.warn('Popup was blocked by browser');
          alert('Please allow popups for this site to use the POS system in a separate window');
        }
      };

      // Open popup after a short delay to ensure page is loaded
      const timer = setTimeout(openPOSPopup, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('Already in popup window, showing clean POS interface');
    }
  }, []);

  const handleStoreInfoComplete = (info: StoreInfo) => {
    setStoreInfo(info);
    setShowStoreModal(false);
    setStoreInfoCompleted(true);
  };

  const handleStoreModalClose = () => {
    setShowStoreModal(false);
    setStoreInfoCompleted(true);
  };

  const handleStockAdded = () => {
    // Refresh products query to reflect updated stock without page reload
    refetchProducts();
  };

  // Only show store modal if store info hasn't been completed yet
  const shouldShowStoreModal = showStoreModal && !storeInfoCompleted;

  // If this is a popup window, render without DashboardLayout
  if (isPopupWindow) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StoreInfoModal
          isOpen={shouldShowStoreModal}
          onComplete={handleStoreInfoComplete}
          onClose={handleStoreModalClose}
        />
        
        {storeInfoCompleted && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
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
          </>
        )}
      </div>
    );
  }

  // Regular view with DashboardLayout for non-popup
  return (
    <>
      <StoreInfoModal
        isOpen={shouldShowStoreModal}
        onComplete={handleStoreInfoComplete}
        onClose={handleStoreModalClose}
      />
      
      {storeInfoCompleted && (
        <div className="container mx-auto px-4 py-6 h-full">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Point of Sale</h1>
            <QuickActualStockButton onStockAdded={handleStockAdded} />
          </div>
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
    </>
  );
};

export default POS;
