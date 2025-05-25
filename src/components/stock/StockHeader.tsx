
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
import { generateStockTemplate } from "@/utils/templateUtils";
import { toast } from "sonner";

interface StockHeaderProps {
  stockCount: number;
  exporting: boolean;
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
                  setActiveTab("management");
                }}
                className="text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer focus:bg-gradient-to-r focus:from-indigo-50 focus:to-purple-50 focus:text-indigo-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {showForm ? "Cancel Entry" : "Add Single Stock Entry"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setShowForm(false);
                  setShowBatchEntry(!showBatchEntry);
                  setShowCollectionForm(false);
                  setActiveTab("management");
                }}
                className="text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer focus:bg-gradient-to-r focus:from-indigo-50 focus:to-purple-50 focus:text-indigo-700"
              >
                <Layers className="mr-2 h-4 w-4" />
                {showBatchEntry ? "Cancel Batch Entry" : "Batch Stock Entry"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setShowForm(false);
                  setShowBatchEntry(false);
                  setShowCollectionForm(!showCollectionForm);
                  setActiveTab("management");
                }}
                className="text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer focus:bg-gradient-to-r focus:from-indigo-50 focus:to-purple-50 focus:text-indigo-700"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {showCollectionForm ? "Cancel Collection" : "Add Collection"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowImport(true)}
                className="text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 cursor-pointer focus:bg-gradient-to-r focus:from-indigo-50 focus:to-purple-50 focus:text-indigo-700"
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
