
import React from "react";
import { PlusCircle, FileDown, FileUp, Layers, Calendar, ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { generateStockTemplate } from "@/utils/templateUtils";
import { toast } from "sonner";

interface StockHeaderProps {
  stockCount: number;
  exporting: boolean;
  dateLabel: string;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  setDateLabel: (label: string) => void;
  handleExport: () => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  showBatchEntry: boolean;
  setShowBatchEntry: (show: boolean) => void;
  showCollectionForm: boolean;
  setShowCollectionForm: (show: boolean) => void;
  setShowImport: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
}

const StockHeader: React.FC<StockHeaderProps> = ({
  stockCount,
  exporting,
  dateLabel,
  dateRange,
  setDateRange,
  setDateLabel,
  handleExport,
  showForm,
  setShowForm,
  showBatchEntry,
  setShowBatchEntry,
  showCollectionForm,
  setShowCollectionForm,
  setShowImport,
  setActiveTab,
}) => {
  const handleDatePresetChange = (preset: string) => {
    switch (preset) {
      case "today":
        setDateRange({
          from: new Date(),
          to: new Date()
        });
        setDateLabel("Today");
        break;
      case "yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setDateRange({
          from: yesterday,
          to: yesterday
        });
        setDateLabel("Yesterday");
        break;
      case "last7days":
        setDateRange({
          from: subDays(new Date(), 7),
          to: new Date()
        });
        setDateLabel("Last 7 days");
        break;
      case "last30days":
        setDateRange({
          from: subDays(new Date(), 30),
          to: new Date()
        });
        setDateLabel("Last 30 days");
        break;
      default:
        break;
    }
  };

  const handleDownloadTemplate = () => {
    try {
      generateStockTemplate();
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error generating template:", error);
      toast.error("Failed to download template");
    }
  };

  return (
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
              {dateLabel}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white">
            <DropdownMenuItem onClick={() => handleDatePresetChange("today")} className="cursor-pointer">
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDatePresetChange("yesterday")} className="cursor-pointer">
              Yesterday
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDatePresetChange("last7days")} className="cursor-pointer">
              Last 7 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDatePresetChange("last30days")} className="cursor-pointer">
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
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <div className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium">Select date range</h4>
                      <div className="border rounded-md p-2">
                        <CalendarComponent
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={(range) => {
                            setDateRange(range);
                            if (range?.from && range?.to) {
                              setDateLabel(`${format(range.from, "MMM d")} - ${format(range.to, "MMM d")}`);
                            }
                          }}
                          numberOfMonths={2}
                          className="pointer-events-auto"
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
            onClick={handleDownloadTemplate}
            title="Download import template"
          >
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          
          <Button
            variant="outline"
            className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex-1 sm:flex-none"
            onClick={handleExport}
            disabled={exporting || stockCount === 0}
            title={stockCount === 0 ? "No stock entries to export" : "Export to Excel"}
          >
            <FileDown className="mr-2 h-4 w-4" /> 
            {exporting ? "Exporting..." : "Export"}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-1 sm:flex-none">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-indigo-100 shadow-lg w-[220px]">
              <DropdownMenuItem 
                onClick={() => {
                  setShowBatchEntry(false);
                  setShowForm(!showForm);
                  setShowCollectionForm(false);
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
                  setShowCollectionForm(false);
                  setActiveTab("batch");
                }}
                className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer"
              >
                <Layers className="mr-2 h-4 w-4" />
                {showBatchEntry ? "Cancel Batch Entry" : "Batch Stock Entry"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setShowForm(false);
                  setShowBatchEntry(false);
                  setShowCollectionForm(!showCollectionForm);
                  setActiveTab("collection");
                }}
                className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {showCollectionForm ? "Cancel Collection" : "Add Collection"}
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
  );
};

export default StockHeader;
