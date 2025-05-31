
import React from "react";
import { CashPaymentModal } from "./CashPaymentModal";
import { CreditPaymentModal } from "./CreditPaymentModal";
import { SplitPaymentModal } from "./SplitPaymentModal";
import { PendingPaymentModal } from "./PendingPaymentModal";
import { QuickStockUpdateModal } from "./QuickStockUpdateModal";
import { createPaymentActions } from "./POSPaymentActions";
import { useAuth } from "@/context/AuthContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  total: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

interface POSModalsProps {
  showCashModal: boolean;
  showCreditModal: boolean;
  showSplitModal: boolean;
  showPendingModal: boolean;
  showQuickStockModal: boolean;
  cart: CartItem[];
  products: Product[];
  totalAmount: number;
  storeInfo: StoreInfo | null;
  selectedShopId: string;
  onCloseCash: () => void;
  onCloseCredit: () => void;
  onCloseSplit: () => void;
  onClosePending: () => void;
  onCloseQuickStock: () => void;
  onPaymentComplete: () => void;
  onStockUpdated: () => void;
}

export const POSModals: React.FC<POSModalsProps> = ({
  showCashModal,
  showCreditModal,
  showSplitModal,
  showPendingModal,
  showQuickStockModal,
  cart,
  products,
  totalAmount,
  storeInfo,
  selectedShopId,
  onCloseCash,
  onCloseCredit,
  onCloseSplit,
  onClosePending,
  onCloseQuickStock,
  onPaymentComplete,
  onStockUpdated,
}) => {
  const { user } = useAuth();

  // Create payment actions
  const paymentActions = createPaymentActions({
    cart,
    products: products || [],
    selectedShopId,
    storeInfo,
    userId: user?.id || '',
    onStockUpdated
  });

  const handleCreditPaymentComplete = async (customerId: string, customerName?: string): Promise<boolean> => {
    try {
      const success = await paymentActions.handleCreditPayment(customerId, customerName);
      if (success) {
        onPaymentComplete();
      }
      return success;
    } catch (error) {
      console.error('Error in credit payment completion:', error);
      return false;
    }
  };

  return (
    <>
      <CashPaymentModal
        isOpen={showCashModal}
        onClose={onCloseCash}
        totalAmount={totalAmount}
        cartItems={cart}
        onPaymentComplete={onPaymentComplete}
        storeInfo={storeInfo}
      />

      <CreditPaymentModal
        isOpen={showCreditModal}
        onClose={onCloseCredit}
        totalAmount={totalAmount}
        cartItems={cart}
        onPaymentComplete={handleCreditPaymentComplete}
      />

      <SplitPaymentModal
        isOpen={showSplitModal}
        onClose={onCloseSplit}
        totalAmount={totalAmount}
        cartItems={cart}
        onPaymentComplete={onPaymentComplete}
      />

      <PendingPaymentModal
        isOpen={showPendingModal}
        onClose={onClosePending}
        totalAmount={totalAmount}
        cartItems={cart}
        onPaymentComplete={onPaymentComplete}
      />

      <QuickStockUpdateModal
        isOpen={showQuickStockModal}
        onClose={onCloseQuickStock}
        products={products}
        selectedShopId={selectedShopId}
        onStockUpdated={onStockUpdated}
      />
    </>
  );
};
