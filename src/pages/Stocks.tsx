
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StockForm from "@/components/stock/StockForm";
import StockList from "@/components/stock/StockList";
import BatchStockEntry from "@/components/stock/BatchStockEntry";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileDown, FileUp, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StockImport from "@/components/stock/StockImport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { utils, writeFile } from "xlsx";

const Stocks = () => {
  const [showForm, setShowForm] = useState(false);
  const [showBatchEntry, setShowBatchEntry] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [exporting, setExporting] = useState(false);

  const handleStockAdded = () => {
    setShowForm(false);
    setShowBatchEntry(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleImportComplete = () => {
    setShowImport(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success("Stock data imported successfully");
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Fetch stock data
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
          shops (id, name),
          products (id, name, price, cost_price)
        `)
        .order("stock_date", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning("No stock data to export");
        return;
      }

      // Format data for export
      const exportData = data.map(entry => ({
        Date: entry.stock_date,
        Shop: entry.shops?.name,
        Product: entry.products?.name,
        "Opening Stock": entry.opening_stock,
        "Closing Stock": entry.closing_stock,
        "Actual Stock": entry.actual_stock,
        "Shift": entry.shift || "N/A",
        "Operator": entry.operator_name || "N/A",
        "Units Sold": entry.opening_stock - entry.closing_stock,
        "Sales Amount": (entry.opening_stock - entry.closing_stock) * Number(entry.products?.price || 0),
        "Profit/Loss": ((entry.opening_stock - entry.closing_stock) * Number(entry.products?.price || 0)) - 
                      ((entry.opening_stock - entry.closing_stock) * Number(entry.products?.cost_price || 0))
      }));

      // Create worksheet
      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Stock Data");

      // Generate file name with date
      const fileName = `stock_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write and download file
      writeFile(wb, fileName);
      toast.success("Stock data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">Stock Management</h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={handleExport}
              disabled={exporting}
            >
              <FileDown className="mr-2 h-4 w-4" /> 
              {exporting ? "Exporting..." : "Export"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-indigo-100 shadow-lg">
                <DropdownMenuItem 
                  onClick={() => {
                    setShowBatchEntry(false);
                    setShowForm(!showForm);
                  }}
                  className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer"
                >
                  {showForm ? "Cancel Entry" : "Add Single Stock Entry"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setShowForm(false);
                    setShowBatchEntry(!showBatchEntry);
                  }}
                  className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer"
                >
                  <Layers className="mr-2 h-4 w-4" />
                  {showBatchEntry ? "Cancel Batch Entry" : "Batch Stock Entry"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowImport(true)}
                  className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import from Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
            <StockForm onSuccess={handleStockAdded} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {showBatchEntry && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
            <BatchStockEntry onSuccess={handleStockAdded} onCancel={() => setShowBatchEntry(false)} />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md border border-gray-200 bg-gradient-to-br from-white to-purple-50/20">
          <StockList refreshTrigger={refreshTrigger} />
        </div>
        
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Import Stock Data</DialogTitle>
            </DialogHeader>
            <StockImport onComplete={handleImportComplete} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Stocks;
