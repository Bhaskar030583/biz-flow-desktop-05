
export const downloadBillAsPDF = async (billId: string) => {
  try {
    // For now, we'll create a simple text-based bill format
    // In a real application, you might want to use a PDF library like jsPDF
    
    const { data: billData, error } = await supabase
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

    // Create bill content
    const billContent = generateBillContent(billData);
    
    // Create and download file
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${billData.bill_number}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading bill:', error);
    throw error;
  }
};

const generateBillContent = (billData: any): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  let content = `
===========================================
                    BILL
===========================================

Bill Number: ${billData.bill_number}
Date: ${formatDate(billData.bill_date)}
Status: ${billData.payment_status.toUpperCase()}
Payment Method: ${billData.payment_method.toUpperCase()}

`;

  if (billData.customers) {
    content += `
-------------------------------------------
Customer Details:
-------------------------------------------
Name: ${billData.customers.name}
${billData.customers.phone ? `Phone: ${billData.customers.phone}` : ''}
${billData.customers.email ? `Email: ${billData.customers.email}` : ''}

`;
  }

  content += `
-------------------------------------------
Items:
-------------------------------------------
`;

  billData.bill_items.forEach((item: any, index: number) => {
    content += `${index + 1}. ${item.product_name}
   Qty: ${item.quantity} × ₹${Number(item.unit_price).toFixed(2)} = ₹${Number(item.total_price).toFixed(2)}

`;
  });

  content += `
-------------------------------------------
Total Amount: ₹${Number(billData.total_amount).toFixed(2)}
-------------------------------------------

Thank you for your business!
`;

  return content;
};

// You'll need to import supabase at the top of the file
import { supabase } from "@/integrations/supabase/client";
