
import React, { useEffect, useState } from "react";

interface POSPopupManagerProps {
  onPopupCheck: (isPopup: boolean) => void;
}

export const POSPopupManager: React.FC<POSPopupManagerProps> = ({ onPopupCheck }) => {
  const [popupOpened, setPopupOpened] = useState(false);

  useEffect(() => {
    const checkIfPopup = window.opener !== null || window.name === 'POSWindow';
    console.log('🔍 [POSPopupManager] Checking if popup:', checkIfPopup);
    onPopupCheck(checkIfPopup);
    
    if (!checkIfPopup && !popupOpened) {
      console.log('📝 [POSPopupManager] Not in popup, attempting to open popup window');
      
      const openPOSPopup = () => {
        const popupUrl = window.location.href;
        const popupFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
        
        const popup = window.open(popupUrl, 'POSWindow', popupFeatures);
        
        if (popup) {
          popup.focus();
          setPopupOpened(true);
          console.log('🪟 [POS] POS popup window opened successfully');
        } else {
          console.warn('⚠️ [POS] Popup was blocked by browser');
          setPopupOpened(true); // Prevent further attempts
        }
      };

      // Open popup after a short delay to ensure page is loaded
      const timer = setTimeout(openPOSPopup, 500);
      
      return () => clearTimeout(timer);
    } else if (checkIfPopup) {
      console.log('🪟 [POS] Already in popup window, showing clean POS interface');
    }
  }, [onPopupCheck, popupOpened]);

  return null; // This component doesn't render anything
};
