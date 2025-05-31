
import { toast } from "sonner";
import { generateBill } from "@/services/billService";
import { adjustStockForBill } from "@/services/stockService";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
}

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

interface PaymentActionsProps {
  cart: CartItem[];
  products: Product[];
  selectedShopId: string;
  storeInfo: StoreInfo | null;
  userId: string;
  onStockUpdated?: () => void;
}

export const createPaymentActions = ({
  cart,
  products,
  selectedShopId,
  storeInfo,
  userId,
  onStockUpdated
}: PaymentActionsProps) => {
  const createBill = async (paymentMethod: string, paymentStatus: string = 'completed', customerId?: string, customerName?: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return null;
    }

    if (!selectedShopId) {
      toast.error("No store selected");
      return null;
    }

    try {
      // First, check if we have sufficient stock for all items
      for (const item of cart) {
        const product = products?.find(p => p.id === item.id);
        if (product?.quantity !== undefined && item.quantity > product.quantity) {
          toast.error(`Insufficient stock for ${item.name}. Available: ${product.quantity}, Required: ${item.quantity}`);
          return null;
        }
      }

      // Create the bill using the service
      const billData = await generateBill({
        customerId,
        customerName,
        totalAmount: cart.reduce((sum, item) => sum + item.total, 0),
        paymentMethod: paymentMethod as any,
        cartItems: cart,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      // Update stock levels - decrease for sale
      try {
        await adjustStockForBill(cart, selectedShopId, userId, 'sale');
        
        // Refresh products data to show updated stock
        if (onStockUpdated) {
          onStockUpdated();
        }
      } catch (stockError) {
        console.error('Stock update failed:', stockError);
        toast.error("Bill created but stock update failed. Please check stock manually.");
      }

      return billData;
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error("Failed to create bill");
      return null;
    }
  };

  const handleUPIPayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    try {
      const bill = await createBill('upi', 'completed');
      if (bill) {
        toast.success("UPI Payment completed successfully!");
        return true;
      }
    } catch (error) {
      console.error('Error processing UPI payment:', error);
      toast.error("Failed to process UPI payment");
    }
    return false;
  };

  return {
    createBill,
    handleUPIPayment
  };
};
