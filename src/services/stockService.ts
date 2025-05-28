
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartItem {
  id: string;
  quantity: number;
}

export const updateProductStock = async (
  productId: string, 
  shopId: string, 
  quantityChange: number, // positive to add, negative to subtract
  userId: string
) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current stock for today
    const { data: currentStock, error: fetchError } = await supabase
      .from('stocks')
      .select('*')
      .eq('product_id', productId)
      .eq('shop_id', shopId)
      .eq('stock_date', today)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching current stock:', fetchError);
      throw fetchError;
    }

    if (currentStock) {
      // Update existing stock record
      const newActualStock = currentStock.actual_stock + quantityChange;
      
      // Prevent negative stock
      if (newActualStock < 0) {
        throw new Error('Insufficient stock available');
      }

      const { error: updateError } = await supabase
        .from('stocks')
        .update({ 
          actual_stock: newActualStock,
          closing_stock: newActualStock
        })
        .eq('id', currentStock.id);

      if (updateError) {
        console.error('Error updating stock:', updateError);
        throw updateError;
      }
    } else {
      // Create new stock record if none exists for today
      if (quantityChange < 0) {
        throw new Error('Cannot sell from empty stock');
      }

      const { error: insertError } = await supabase
        .from('stocks')
        .insert({
          product_id: productId,
          shop_id: shopId,
          stock_date: today,
          opening_stock: quantityChange,
          closing_stock: quantityChange,
          actual_stock: quantityChange,
          stock_added: quantityChange,
          user_id: userId
        });

      if (insertError) {
        console.error('Error creating stock record:', insertError);
        throw insertError;
      }
    }

    return true;
  } catch (error) {
    console.error('Stock update failed:', error);
    throw error;
  }
};

export const adjustStockForBill = async (
  cartItems: CartItem[],
  shopId: string,
  userId: string,
  operation: 'sale' | 'cancel'
) => {
  try {
    for (const item of cartItems) {
      const quantityChange = operation === 'sale' ? -item.quantity : item.quantity;
      await updateProductStock(item.id, shopId, quantityChange, userId);
    }
    return true;
  } catch (error) {
    console.error(`Stock adjustment failed for ${operation}:`, error);
    throw error;
  }
};
