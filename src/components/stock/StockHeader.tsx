
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, BarChart3 } from "lucide-react";

interface StockHeaderProps {
  stockCount: number;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
}

const StockHeader = ({ stockCount, showForm, setShowForm, setActiveTab }: StockHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground">
            Manage inventory across all stores
            {stockCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stockCount} entries
              </Badge>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => setActiveTab("add-stock")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Quick Add Stock
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setActiveTab("reports")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Reports
        </Button>
      </div>
    </div>
  );
};

export default StockHeader;
