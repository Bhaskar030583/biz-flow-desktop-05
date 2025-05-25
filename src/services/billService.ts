
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface BillData {
  customerId?: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  cartItems: CartItem[];
}

export const generateBill = async (billData: BillData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Generate bill number
    const { data: billNumberData, error: billNumberError } = await supabase
      .rpc('generate_bill_number');

    if (billNumberError) throw billNumberError;

    // Create the bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        user_id: user.id,
        customer_id: billData.customerId || null,
        bill_number: billNumberData,
        total_amount: billData.totalAmount,
        payment_method: billData.paymentMethod,
        payment_status: billData.paymentMethod === 'credit' ? 'pending' : 'completed'
      })
      .select()
      .single();

    if (billError) throw billError;

    // Create bill items
    const billItems = billData.cartItems.map(item => ({
      bill_id: bill.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.total
    }));

    const { error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItems);

    if (itemsError) throw itemsError;

    return bill;
  } catch (error) {
    console.error('Error generating bill:', error);
    throw error;
  }
};

export const getBillDetails = async (billId: string) => {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        customers (
          name,
          phone,
          email
        ),
        bill_items (
          *
        )
      `)
      .eq('id', billId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bill details:', error);
    throw error;
  }
};
