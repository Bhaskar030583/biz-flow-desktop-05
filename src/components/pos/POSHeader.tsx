
import React from "react";
import { Button } from "@/components/ui/button";
import { Package, User, History, Search, PanelRightClose, PanelRightOpen } from "lucide-react";

interface StoreInfo {
  storeName: string;
  salespersonName: string;
  shiftName: string;
}

interface POSHeaderProps {
  storeInfo: StoreInfo | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showOrderSummary: boolean;
  setShowOrderSummary: (show: boolean) => void;
  onQuickStock: () => void;
  onCustomerManagement: () => void;
  onBillHistory: () => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  storeInfo,
  searchTerm,
  setSearchTerm,
  showOrderSummary,
  setShowOrderSummary,
  onQuickStock,
  onCustomerManagement,
  onBillHistory,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {storeInfo && (
            <div className="flex items-center space-x-3 text-body-sm text-slate-600">
              <span className="font-medium">{storeInfo.storeName}</span>
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span>{storeInfo.salespersonName}</span>
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span className="text-blue-600 font-medium">{storeInfo.shiftName}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onQuickStock}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm h-14 w-14 p-0 rounded-xl"
          >
            <Package className="h-7 w-7" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onCustomerManagement}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm h-14 w-14 p-0 rounded-xl"
          >
            <User className="h-7 w-7" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onBillHistory}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm h-14 w-14 p-0 rounded-xl"
          >
            <History className="h-7 w-7" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setSearchTerm(searchTerm ? "" : "search")}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm h-14 w-14 p-0 rounded-xl"
          >
            <Search className="h-7 w-7" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowOrderSummary(!showOrderSummary)}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm h-14 w-14 p-0 rounded-xl"
            title={showOrderSummary ? "Hide Order Summary" : "Show Order Summary"}
          >
            {showOrderSummary ? <PanelRightClose className="h-7 w-7" /> : <PanelRightOpen className="h-7 w-7" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
