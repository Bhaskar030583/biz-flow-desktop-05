import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  quantity: number;
}

export const adjustStockForBill = async (
  cartItems: CartItem[], 
  shopId: string, 
  userId: string, 
  adjustmentType: 'sale' | 'return' = 'sale'
) => {
  const today = new Date().toISOString().split('T')[0];
  
  for (const item of cartItems) {
    // Get current stock record using hr_shop_id
    const { data: currentStock, error: fetchError } = await supabase
      .from('stocks')
      .select('*')
      .eq('product_id', item.id)
      .eq('hr_shop_id', shopId)
      .eq('user_id', userId)
      .eq('stock_date', today)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching current stock:', fetchError);
      throw fetchError;
    }
    
    if (currentStock) {
      // Update existing stock record
      const adjustment = adjustmentType === 'sale' ? -item.quantity : item.quantity;
      
      const { error: updateError } = await supabase
        .from('stocks')
        .update({
          actual_stock: Math.max(0, currentStock.actual_stock + adjustment),
          closing_stock: Math.max(0, currentStock.closing_stock + adjustment)
        })
        .eq('id', currentStock.id);
      
      if (updateError) {
        console.error('Error updating stock:', updateError);
        throw updateError;
      }
    } else {
      // Create new stock record if none exists for today
      const initialStock = adjustmentType === 'sale' ? 0 : item.quantity;
      const actualStock = adjustmentType === 'sale' ? Math.max(0, -item.quantity) : item.quantity;
      
      const { error: insertError } = await supabase
        .from('stocks')
        .insert({
          product_id: item.id,
          shop_id: shopId, // Keep for backward compatibility
          hr_shop_id: shopId, // Use hr_shop_id as primary field
          stock_date: today,
          opening_stock: initialStock,
          closing_stock: actualStock,
          actual_stock: actualStock,
          stock_added: adjustmentType === 'return' ? item.quantity : 0,
          user_id: userId
        });
      
      if (insertError) {
        console.error('Error creating stock record:', insertError);
        throw insertError;
      }
    }
  }
};

export const updateProductStock = async (
  productId: string,
  shopId: string,
  quantityToAdd: number,
  userId: string
) => {
  console.log('📦 [StockService] Updating actual stock only:', {
    productId,
    shopId,
    quantityToAdd,
    userId
  });

  const today = new Date().toISOString().split('T')[0];
  
  // Get current stock record using hr_shop_id (trying both shop_id and hr_shop_id for compatibility)
  const { data: currentStock, error: fetchError } = await supabase
    .from('stocks')
    .select('*')
    .eq('product_id', productId)
    .or(`hr_shop_id.eq.${shopId},shop_id.eq.${shopId}`)
    .eq('user_id', userId)
    .eq('stock_date', today)
    .maybeSingle();
  
  console.log('📦 [StockService] Current stock found:', currentStock);
  
  if (fetchError) {
    console.error('Error fetching current stock:', fetchError);
    throw fetchError;
  }
  
  if (currentStock) {
    // Update existing stock record - ONLY update actual_stock
    const newActualStock = quantityToAdd; // Set to the new quantity directly

    console.log('📦 [StockService] Updating actual stock only:', {
      oldActual: currentStock.actual_stock,
      newActual: newActualStock
    });

    const { error: updateError } = await supabase
      .from('stocks')
      .update({
        actual_stock: newActualStock
      })
      .eq('id', currentStock.id);
    
    if (updateError) {
      console.error('Error updating stock:', updateError);
      throw updateError;
    }

    console.log('✅ [StockService] Actual stock updated successfully');
  } else {
    // Create new stock record if none exists for today
    console.log('📦 [StockService] Creating new stock record with actual stock only');

    const { error: insertError } = await supabase
      .from('stocks')
      .insert({
        product_id: productId,
        shop_id: shopId, // Keep for backward compatibility
        hr_shop_id: shopId, // Use hr_shop_id as primary field
        stock_date: today,
        opening_stock: 0, // Start with 0 if no previous record
        closing_stock: 0, // Keep closing stock at 0 for new records
        actual_stock: quantityToAdd, // Only set the actual stock
        stock_added: 0, // Don't update stock_added for quick updates
        user_id: userId
      });
    
    if (insertError) {
      console.error('Error creating stock record:', insertError);
      throw insertError;
    }

    console.log('✅ [StockService] New stock record created with actual stock only');
  }
};
