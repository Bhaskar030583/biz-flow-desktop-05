
import React, { useState } from "react";
import { POSPopupManager } from "@/components/pos/POSPopupManager";
import { POSPopupInterface } from "@/components/pos/POSPopupInterface";
import { POSSystem } from "@/components/pos/POSSystem";
import { StoreInfoModal } from "@/components/pos/StoreInfoModal";
import { usePOSProducts } from "@/hooks/usePOSProducts";

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

const POS = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(true); // Show modal initially
  const [isPopupWindow, setIsPopupWindow] = useState(false);
  const [storeInfoCompleted, setStoreInfoCompleted] = useState(false); // Start as false
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>(""); // Start empty
  const [showSearch, setShowSearch] = useState(false);

  const { products, productsLoading, handleStockAdded } = usePOSProducts(selectedStoreId);

  const handlePopupCheck = (isPopup: boolean) => {
    console.log('🔍 [POS] Popup check result:', isPopup);
    setIsPopupWindow(isPopup);
    
    // Don't automatically show store modal for popup windows if already completed
    if (isPopup && storeInfoCompleted) {
      setShowStoreModal(false);
    }
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
    // Only close if store info is completed
    if (storeInfoCompleted) {
      setShowStoreModal(false);
    }
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

  // Show store modal if store info hasn't been completed yet
  const shouldShowStoreModal = !storeInfoCompleted;

  console.log('🔄 [POS] Current state:', {
    isPopupWindow,
    storeInfoCompleted,
    shouldShowStoreModal,
    showStoreModal
  });

  return (
    <>
      <POSPopupManager onPopupCheck={handlePopupCheck} />
      
      {/* Always show StoreInfoModal first if store info not completed */}
      {shouldShowStoreModal && (
        <StoreInfoModal
          isOpen={shouldShowStoreModal}
          onComplete={handleStoreInfoComplete}
          onClose={handleStoreModalClose}
        />
      )}
      
      {/* Only show POS interface after store info is completed */}
      {storeInfoCompleted && (
        <>
          {isPopupWindow ? (
            <POSPopupInterface
              shouldShowStoreModal={false}
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
      )}
    </>
  );
};

export default POS;
