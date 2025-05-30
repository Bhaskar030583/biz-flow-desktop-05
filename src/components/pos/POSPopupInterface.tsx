
import React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { POSSystem } from "./POSSystem";
import { StoreInfoModal } from "./StoreInfoModal";

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

interface POSPopupInterfaceProps {
  shouldShowStoreModal: boolean;
  storeInfoCompleted: boolean;
  selectedStoreId: string;
  productsLoading: boolean;
  products: any[];
  storeInfo: StoreInfo | null;
  selectedShiftId: string;
  onStoreInfoComplete: (info: StoreInfo, shiftId: string, storeId: string) => void;
  onStoreModalClose: () => void;
  onClosePopup: () => void;
  onStockUpdated: () => void;
}

export const POSPopupInterface: React.FC<POSPopupInterfaceProps> = ({
  shouldShowStoreModal,
  storeInfoCompleted,
  selectedStoreId,
  productsLoading,
  products,
  storeInfo,
  selectedShiftId,
  onStoreInfoComplete,
  onStoreModalClose,
  onClosePopup,
  onStockUpdated
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Exit button for popup */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={onClosePopup}
          className="bg-white hover:bg-gray-100"
          title="Close POS Window"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <StoreInfoModal
        isOpen={shouldShowStoreModal}
        onComplete={onStoreInfoComplete}
        onClose={onStoreModalClose}
      />
      
      {storeInfoCompleted && selectedStoreId && (
        <div className="p-6">
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
              products={products || []} 
              storeInfo={storeInfo} 
              selectedShopId={selectedStoreId}
              selectedShiftId={selectedShiftId}
              onStockUpdated={onStockUpdated}
            />
          )}
        </div>
      )}
    </div>
  );
};
