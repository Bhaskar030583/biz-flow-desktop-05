
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
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [showStoreModal, setShowStoreModal] = useState(true); // Show modal initially
  const [isPopupWindow, setIsPopupWindow] = useState(false);
  const [storeInfoCompleted, setStoreInfoCompleted] = useState(false); // Start as false
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>(""); // Start empty
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
        <>
          {shouldShowStoreModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Select Store Location</h2>
                <p className="text-gray-600 mb-4">Please select a store location to continue with POS operations.</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      // For demo purposes, set a default store
                      handleStoreInfoComplete(
                        {
                          storeName: "Demo Store",
                          salespersonName: "Demo User",
                          shiftName: "Day Shift"
                        },
                        "demo-shift-id",
                        "checkpost" // Use actual store identifier
                      );
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Select Demo Store
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {storeInfoCompleted && (
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
