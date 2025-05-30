
import { supabase } from "@/integrations/supabase/client";
import { utils, writeFile } from "xlsx";
import { toast } from "sonner";

export const exportStockData = async (
  setExporting: (exporting: boolean) => void,
  setExportProgress: (progress: number) => void
): Promise<void> => {
  try {
    setExporting(true);
    setExportProgress(10);
    
    const { data, error } = await supabase
      .from("stocks")
      .select(`
        id, 
        stock_date, 
        opening_stock, 
        closing_stock, 
        actual_stock,
        shift,
        operator_name,
        cash_received,
        online_received,
        hr_stores!stocks_hr_shop_id_fkey (id, store_name),
        products (id, name, price, cost_price)
      `)
      .order("stock_date", { ascending: false });

    if (error) {
      toast.error(`Failed to fetch data: ${error.message}`);
      setExporting(false);
      setExportProgress(0);
      return;
    }
    
    setExportProgress(40);

    if (!data || data.length === 0) {
      toast.warning("No stock data to export");
      setExporting(false);
      setExportProgress(0);
      return;
    }

    const exportData = data.map(entry => ({
      Date: entry.stock_date,
      Shop: entry.hr_stores?.store_name || "Unknown Store",
      Product: entry.products?.name || "Unknown Product",
      "Opening Stock": entry.opening_stock,
      "Closing Stock": entry.closing_stock,
      "Actual Stock": entry.actual_stock,
      "Shift": entry.shift || "N/A",
      "Operator": entry.operator_name || "N/A",
      "Cash Received": entry.cash_received || 0,
      "Online Received": entry.online_received || 0,
      "Total Received": (entry.cash_received || 0) + (entry.online_received || 0),
      "Units Sold": entry.opening_stock - entry.closing_stock,
      "Sales Amount": (entry.opening_stock - entry.closing_stock) * Number(entry.products?.price || 0),
      "Profit/Loss": ((entry.opening_stock - entry.closing_stock) * Number(entry.products?.price || 0)) - 
                    ((entry.opening_stock - entry.closing_stock) * Number(entry.products?.cost_price || 0))
    }));
    
    setExportProgress(70);

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Stock Data");

    const fileName = `stock_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    setExportProgress(90);
    
    writeFile(wb, fileName);
    setExportProgress(100);
    toast.success("Stock data exported successfully");
    
    setTimeout(() => {
      setExporting(false);
      setExportProgress(0);
    }, 1000);
    
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to export data");
    setExporting(false);
    setExportProgress(0);
  }
};
