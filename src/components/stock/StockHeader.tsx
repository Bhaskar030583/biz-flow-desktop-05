
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, BarChart3, Eye, Settings } from "lucide-react";

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
  setActiveTab
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {stockCount} entries
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setShowForm(true);
            setActiveTab("management");
          }}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Stock
        </Button>
        
        <Button
          onClick={() => {
            setShowBatchEntry(true);
            setActiveTab("management");
          }}
          variant="outline"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-1" />
          Batch Entry
        </Button>
        
        <Button
          onClick={() => setShowImport(true)}
          variant="outline"
          size="sm"
        >
          <Upload className="h-4 w-4 mr-1" />
          Import
        </Button>
        
        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
          size="sm"
        >
          <Download className="h-4 w-4 mr-1" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
        
        <Button
          onClick={() => setActiveTab("chart")}
          variant="outline"
          size="sm"
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Analytics
        </Button>
        
        <Button
          onClick={() => setActiveTab("view")}
          variant="outline"
          size="sm"
        >
          <Eye className="h-4 w-4 mr-1" />
          Real-time
        </Button>
      </div>
    </div>
  );
};

export default StockHeader;
