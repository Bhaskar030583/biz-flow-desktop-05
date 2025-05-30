
import React, { useEffect } from "react";

interface POSPopupManagerProps {
  onPopupCheck: (isPopup: boolean) => void;
}

export const POSPopupManager: React.FC<POSPopupManagerProps> = ({ onPopupCheck }) => {
  useEffect(() => {
    const checkIfPopup = window.opener !== null || window.name === 'POSWindow';
    onPopupCheck(checkIfPopup);
    
    if (!checkIfPopup) {
      const openPOSPopup = () => {
        const popupUrl = window.location.href;
        const popupFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
        
        const popup = window.open(popupUrl, 'POSWindow', popupFeatures);
        
        if (popup) {
          popup.focus();
          console.log('🪟 [POS] POS popup window opened successfully');
        } else {
          console.warn('⚠️ [POS] Popup was blocked by browser');
          alert('Please allow popups for this site to use the POS system in a separate window');
        }
      };

      // Open popup after a short delay to ensure page is loaded
      const timer = setTimeout(openPOSPopup, 500);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🪟 [POS] Already in popup window, showing clean POS interface');
    }
  }, [onPopupCheck]);

  return null; // This component doesn't render anything
};
