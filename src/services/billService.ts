
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
  customerName?: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit' | 'pending';
  cartItems: CartItem[];
  storeName?: string;
  salespersonName?: string;
}

export const generateBill = async (billData: BillData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Generate custom bill number based on store, salesperson, and date
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // Get count of bills for today for this user
    const { data: billsToday, error: countError } = await supabase
      .from('bills')
      .select('id')
      .eq('user_id', user.id)
      .gte('bill_date', `${today.toISOString().slice(0, 10)}T00:00:00.000Z`)
      .lt('bill_date', `${new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}T00:00:00.000Z`);

    if (countError) throw countError;

    const billCount = (billsToday?.length || 0) + 1;
    
    // Create bill number: STORE-SALESPERSON-YYYYMMDD-XXXX
    const storePrefix = (billData.storeName || 'STORE').substring(0, 4).toUpperCase();
    const salespersonPrefix = (billData.salespersonName || 'USER').substring(0, 4).toUpperCase();
    const billNumber = `${storePrefix}-${salespersonPrefix}-${dateStr}-${billCount.toString().padStart(4, '0')}`;

    // Handle customer for pending payments with manual name entry
    let customerId = billData.customerId;
    
    // If it's a pending payment with a customer name but no ID, create a temporary customer record
    if (billData.paymentMethod === 'pending' && billData.customerName && !customerId) {
      // Check if customer with this name already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', billData.customerName)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer record
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            name: billData.customerName,
            phone: '', // Empty phone for pending payment customers
            email: null
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }
    }

    // Create the bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        user_id: user.id,
        customer_id: customerId || null,
        bill_number: billNumber,
        total_amount: billData.totalAmount,
        payment_method: billData.paymentMethod,
        payment_status: billData.paymentMethod === 'credit' || billData.paymentMethod === 'pending' ? 'pending' : 'completed'
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
