
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickActualStockButton from "@/components/stock/QuickActualStockButton";

interface POSMainViewProps {
  onStockAdded: () => void;
}

export const POSMainView: React.FC<POSMainViewProps> = ({ onStockAdded }) => {
  const navigate = useNavigate();
  const [popupOpened, setPopupOpened] = useState(false);

  useEffect(() => {
    // Check if popup was already opened in this session
    const hasOpenedPopup = sessionStorage.getItem('pos-popup-opened');
    if (hasOpenedPopup) {
      setPopupOpened(true);
    }

    // Listen for popup opening
    const handlePopupOpen = () => {
      setPopupOpened(true);
      sessionStorage.setItem('pos-popup-opened', 'true');
    };

    // Set up a timer to check if popup opened
    const timer = setTimeout(handlePopupOpen, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleOpenPOSAgain = () => {
    const popupUrl = window.location.href;
    const popupFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
    
    const popup = window.open(popupUrl, 'POSWindow', popupFeatures);
    
    if (popup) {
      popup.focus();
      setPopupOpened(true);
      sessionStorage.setItem('pos-popup-opened', 'true');
    } else {
      alert('Please allow popups for this site to use the POS system in a separate window');
    }
  };

  const handleRefresh = () => {
    sessionStorage.removeItem('pos-popup-opened');
    window.location.reload();
  };

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
        <QuickActualStockButton onStockAdded={onStockAdded} />
      </div>
      
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          {popupOpened ? (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-green-700">POS Window Opened</h2>
                <p className="text-gray-600 mb-4">
                  The POS system is now running in a separate window for better usability. 
                  Please check your browser for the POS window.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleOpenPOSAgain}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open POS Window Again
                </Button>
                
                <Button 
                  onClick={handleRefresh}
                  className="w-full flex items-center gap-2"
                  variant="ghost"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">POS System</h2>
              <p className="text-gray-600 mb-4">The POS system will open in a separate window for better usability.</p>
              <p className="text-sm text-gray-500">If the popup was blocked, please allow popups for this site and refresh the page.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
