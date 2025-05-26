
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, Upload, Package2, FileSpreadsheet, Store } from "lucide-react";
import QuickActualStockButton from "./QuickActualStockButton";

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

const StockHeader = ({
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
  setActiveTab
}: StockHeaderProps) => {
  
  const handleStockAdded = () => {
    // This will trigger a refresh in the parent component
    window.location.reload();
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
              <Package2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                Stock Management
              </CardTitle>
              <p className="text-blue-600 dark:text-blue-300 text-sm">
                Manage your inventory and track stock levels
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {stockCount} {stockCount === 1 ? 'entry' : 'entries'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setShowForm(true);
              setActiveTab("form");
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>

          <Button
            onClick={() => {
              setShowBatchEntry(true);
              setActiveTab("batch");
            }}
            variant="outline"
            size="sm"
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Batch Entry
          </Button>

          <Button
            onClick={() => {
              setShowCollectionForm(true);
              setActiveTab("collection");
            }}
            variant="outline"
            size="sm"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Store className="h-4 w-4 mr-2" />
            Store Management
          </Button>

          <QuickActualStockButton onStockAdded={handleStockAdded} />

          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>

          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockHeader;
