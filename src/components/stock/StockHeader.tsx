
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface StockHeaderProps {
  stockCount: number;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
}

const StockHeader: React.FC<StockHeaderProps> = ({
  stockCount,
  showForm,
  setShowForm,
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
      </div>
    </div>
  );
};

export default StockHeader;
