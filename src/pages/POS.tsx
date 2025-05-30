
import React, { useState } from "react";
import { POSPopupManager } from "@/components/pos/POSPopupManager";
import { POSPopupInterface } from "@/components/pos/POSPopupInterface";
import { POSMainView } from "@/components/pos/POSMainView";
import { usePOSProducts } from "@/hooks/usePOSProducts";

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

const POS = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(true);
  const [isPopupWindow, setIsPopupWindow] = useState(false);
  const [storeInfoCompleted, setStoreInfoCompleted] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  const { products, productsLoading, handleStockAdded } = usePOSProducts(selectedStoreId);

  const handlePopupCheck = (isPopup: boolean) => {
    setIsPopupWindow(isPopup);
  };

  const handleStoreInfoComplete = (info: StoreInfo, shiftId: string, storeId: string) => {
    console.log('✅ [POS] Store info completed:', { info, shiftId, storeId });
    setStoreInfo(info);
    setSelectedShiftId(shiftId);
    setSelectedStoreId(storeId);
    setShowStoreModal(false);
    setStoreInfoCompleted(true);
  };

  const handleStoreModalClose = () => {
    setShowStoreModal(false);
    setStoreInfoCompleted(true);
  };

  const handleClosePopup = () => {
    if (window.opener) {
      window.opener.focus();
    }
    window.close();
  };

  // Only show store modal if store info hasn't been completed yet
  const shouldShowStoreModal = showStoreModal && !storeInfoCompleted;

  return (
    <>
      <POSPopupManager onPopupCheck={handlePopupCheck} />
      
      {isPopupWindow ? (
        <POSPopupInterface
          shouldShowStoreModal={shouldShowStoreModal}
          storeInfoCompleted={storeInfoCompleted}
          selectedStoreId={selectedStoreId}
          productsLoading={productsLoading}
          products={products || []}
          storeInfo={storeInfo}
          selectedShiftId={selectedShiftId}
          onStoreInfoComplete={handleStoreInfoComplete}
          onStoreModalClose={handleStoreModalClose}
          onClosePopup={handleClosePopup}
          onStockUpdated={handleStockAdded}
        />
      ) : (
        <POSMainView onStockAdded={handleStockAdded} />
      )}
    </>
  );
};

export default POS;
