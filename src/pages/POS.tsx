
import React, { useState } from "react";
import { POSPopupManager } from "@/components/pos/POSPopupManager";
import { POSPopupInterface } from "@/components/pos/POSPopupInterface";
import { POSSystem } from "@/components/pos/POSSystem";
import { usePOSProducts } from "@/hooks/usePOSProducts";

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

const POS = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>({
    storeName: "ABC Cafe",
    salespersonName: "John Doe",
    shiftName: "Morning Shift"
  });
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [isPopupWindow, setIsPopupWindow] = useState(false);
  const [storeInfoCompleted, setStoreInfoCompleted] = useState(true);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("1");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("1");
  const [showSearch, setShowSearch] = useState(false);

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

  const toggleSearch = () => {
    setShowSearch(prev => !prev);
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
          showSearch={showSearch}
          toggleSearch={toggleSearch}
        />
      ) : (
        <POSSystem 
          products={products || []}
          storeInfo={storeInfo}
          selectedShopId={selectedStoreId}
          selectedShiftId={selectedShiftId}
          onStockUpdated={handleStockAdded}
        />
      )}
    </>
  );
};

export default POS;
