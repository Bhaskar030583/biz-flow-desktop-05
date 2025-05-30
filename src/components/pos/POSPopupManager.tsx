
import React, { useEffect, useRef } from "react";

interface POSPopupManagerProps {
  onPopupCheck: (isPopup: boolean) => void;
}

export const POSPopupManager: React.FC<POSPopupManagerProps> = ({ onPopupCheck }) => {
  const hasChecked = useRef(false);
  const hasOpenedPopup = useRef(false);

  useEffect(() => {
    // Only run this check once
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkIfPopup = window.opener !== null || window.name === 'POSWindow';
    console.log('🔍 [POSPopupManager] Checking if popup (once only):', checkIfPopup);
    
    onPopupCheck(checkIfPopup);
    
    if (!checkIfPopup && !hasOpenedPopup.current) {
      // Check if we already tried to open a popup in this session
      const hasTriedPopup = sessionStorage.getItem('pos-popup-attempted');
      
      if (!hasTriedPopup) {
        console.log('📝 [POSPopupManager] First time - attempting to open popup window');
        sessionStorage.setItem('pos-popup-attempted', 'true');
        hasOpenedPopup.current = true;
        
        const openPOSPopup = () => {
          const popupUrl = window.location.href;
          const popupFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
          
          const popup = window.open(popupUrl, 'POSWindow', popupFeatures);
          
          if (popup) {
            popup.focus();
            console.log('🪟 [POS] POS popup window opened successfully');
          } else {
            console.warn('⚠️ [POS] Popup was blocked by browser');
          }
        };

        // Open popup after a short delay
        setTimeout(openPOSPopup, 500);
      } else {
        console.log('📝 [POSPopupManager] Popup already attempted in this session');
      }
    } else if (checkIfPopup) {
      console.log('🪟 [POS] Already in popup window, showing clean POS interface');
    }
  }, []); // Empty dependency array - only run once

  return null;
};
