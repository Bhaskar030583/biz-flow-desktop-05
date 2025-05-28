
import React, { useState, useEffect } from "react";
import { POSSystem } from "@/components/pos/POSSystem";
import { StoreInfoModal } from "@/components/pos/StoreInfoModal";
import QuickActualStockButton from "@/components/stock/QuickActualStockButton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Store } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface StoreInfo {
  storeName: string;
  salespersonName: string;
}

interface Shop {
  id: string;
  name: string;
}

const POS = () => {
  const { user } = useAuth();
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(true);
  const [isPopupWindow, setIsPopupWindow] = useState(false);
  const [storeInfoCompleted, setStoreInfoCompleted] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const navigate = useNavigate();

  // Query for shops
  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Query for products assigned to selected shop
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['pos-products', selectedShopId],
    queryFn: async () => {
      if (!selectedShopId) return [];
      
      const { data, error } = await supabase
        .from('product_shops')
        .select(`
          products (
            id,
            name,
            price,
            category
          )
        `)
        .eq('shop_id', selectedShopId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Extract products from the join result
      return data?.map(item => item.products).filter(Boolean) || [];
    },
    enabled: !!selectedShopId && !!user?.id
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

  const handleClosePopup = () => {
    if (window.opener) {
      window.opener.focus();
    }
    window.close();
  };

  // Only show store modal if store info hasn't been completed yet
  const shouldShowStoreModal = showStoreModal && !storeInfoCompleted;

  // If this is a popup window, render without DashboardLayout
  if (isPopupWindow) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Exit button for popup */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={handleClosePopup}
            className="bg-white hover:bg-gray-100"
            title="Close POS Window"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <StoreInfoModal
          isOpen={shouldShowStoreModal}
          onComplete={handleStoreInfoComplete}
          onClose={handleStoreModalClose}
        />
        
        {storeInfoCompleted && (
          <div className="p-6">
            {/* Store Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Select Store
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="shop-select">Choose Store for POS</Label>
                  {shopsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a store to start POS" />
                      </SelectTrigger>
                      <SelectContent>
                        {shops?.map(shop => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                        {shops?.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            No stores available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* POS System */}
            {selectedShopId ? (
              <>
                {productsLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                      <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-96 w-full" />
                    </div>
                  </div>
                ) : (
                  <POSSystem 
                    products={products} 
                    storeInfo={storeInfo} 
                    selectedShopId={selectedShopId}
                  />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Select a Store</h3>
                  <p className="text-gray-600">Please select a store to view assigned products and start using the POS system.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  // For non-popup (main app), show a simple message and handle popup opening
  return (
    <div className="container mx-auto px-4 py-6 h-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
        </div>
        <QuickActualStockButton onStockAdded={handleStockAdded} />
      </div>
      
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">POS System</h2>
          <p className="text-gray-600 mb-4">The POS system will open in a separate window for better usability.</p>
          <p className="text-sm text-gray-500">If the popup was blocked, please allow popups for this site and refresh the page.</p>
        </div>
      </div>
    </div>
  );
};

export default POS;
