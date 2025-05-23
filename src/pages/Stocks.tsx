
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StockForm from "@/components/stock/StockForm";
import StockList from "@/components/stock/StockList";
import BatchStockEntry from "@/components/stock/BatchStockEntry";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileDown, FileUp, Layers, Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StockImport from "@/components/stock/StockImport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { utils, writeFile } from "xlsx";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfDay, endOfDay, startOfToday, startOfYesterday, endOfYesterday } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const Stocks = () => {
  const [showForm, setShowForm] = useState(false);
  const [showBatchEntry, setShowBatchEntry] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("list");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const handleStockAdded = () => {
    setShowForm(false);
    setShowBatchEntry(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success("Stock entry added successfully");
  };

  const handleImportComplete = () => {
    setShowImport(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success("Stock data imported successfully");
  };
  
  const handleDatePresetChange = (preset: string) => {
    switch (preset) {
      case "today":
        setDateRange({
          from: startOfToday(),
          to: new Date()
        });
        break;
      case "yesterday":
        setDateRange({
          from: startOfYesterday(),
          to: endOfYesterday()
        });
        break;
      case "last7days":
        setDateRange({
          from: subDays(new Date(), 7),
          to: new Date()
        });
        break;
      case "last30days":
        setDateRange({
          from: subDays(new Date(), 30),
          to: new Date()
        });
        break;
      default:
        break;
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportProgress(10);
      
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
          cash_received,
          online_received,
          shops (id, name),
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
        "Cash Received": entry.cash_received || 0,
        "Online Received": entry.online_received || 0,
        "Total Received": (entry.cash_received || 0) + (entry.online_received || 0),
        "Units Sold": entry.opening_stock - entry.closing_stock,
        "Sales Amount": (entry.opening_stock - entry.closing_stock) * Number(entry.products?.price || 0),
        "Profit/Loss": ((entry.opening_stock - entry.closing_stock) * Number(entry.products?.price || 0)) - 
                      ((entry.opening_stock - entry.closing_stock) * Number(entry.products?.cost_price || 0))
      }));
      
      setExportProgress(70);

      // Create worksheet
      const ws = utils.json_to_sheet(exportData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Stock Data");

      // Generate file name with date
      const fileName = `stock_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      setExportProgress(90);
      
      // Write and download file
      writeFile(wb, fileName);
      setExportProgress(100);
      toast.success("Stock data exported successfully");
      
      // Reset progress after a delay
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent mb-1">Stock Management</h1>
            <p className="text-muted-foreground text-sm">Track inventory, monitor sales, and analyze performance</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 justify-start w-full sm:w-auto"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Date range</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleDatePresetChange("today")}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDatePresetChange("yesterday")}>
                  Yesterday
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDatePresetChange("last7days")}>
                  Last 7 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDatePresetChange("last30days")}>
                  Last 30 days
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        Custom Range
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium">Select date range</h4>
                          <div className="border rounded-md p-2">
                            <CalendarComponent
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange?.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                            />
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex-1 sm:flex-none"
                onClick={handleExport}
                disabled={exporting}
              >
                <FileDown className="mr-2 h-4 w-4" /> 
                {exporting ? "Exporting..." : "Export"}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-1 sm:flex-none">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Stock
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-indigo-100 shadow-lg w-[220px]">
                  <DropdownMenuItem 
                    onClick={() => {
                      setShowBatchEntry(false);
                      setShowForm(!showForm);
                      setActiveTab("entry");
                    }}
                    className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {showForm ? "Cancel Entry" : "Add Single Stock Entry"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setShowForm(false);
                      setShowBatchEntry(!showBatchEntry);
                      setActiveTab("batch");
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
        </div>

        {exporting && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Exporting data...</span>
              <span className="text-sm text-muted-foreground">{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-muted/50">
            <TabsTrigger value="list" className="flex-1">Stock List</TabsTrigger>
            {showForm && <TabsTrigger value="entry" className="flex-1">Add Stock Entry</TabsTrigger>}
            {showBatchEntry && <TabsTrigger value="batch" className="flex-1">Batch Entry</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="list" className="space-y-6">
            <StockList refreshTrigger={refreshTrigger} dateRange={dateRange} />
          </TabsContent>
          
          {showForm && (
            <TabsContent value="entry" className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
                <StockForm onSuccess={handleStockAdded} onCancel={() => {
                  setShowForm(false);
                  setActiveTab("list");
                }} />
              </div>
            </TabsContent>
          )}

          {showBatchEntry && (
            <TabsContent value="batch" className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
                <BatchStockEntry onSuccess={handleStockAdded} onCancel={() => {
                  setShowBatchEntry(false);
                  setActiveTab("list");
                }} />
              </div>
            </TabsContent>
          )}
        </Tabs>
        
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
