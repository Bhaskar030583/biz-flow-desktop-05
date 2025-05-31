
import React from "react";
import { Button } from "@/components/ui/button";
import { Package, User, History, Search, PanelRightClose, PanelRightOpen } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

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
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 shadow-sm px-6 py-4">
      <div className="flex flex-col items-center space-y-4">
        {/* Logo at the top */}
        <div className="flex justify-center">
          <img 
            src="/lovable-uploads/31fce476-e564-4413-90e1-e9d9fd78516f.png" 
            alt="ABC Cafe Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Store info and controls below */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4 flex-1">
            {storeInfo && (
              <div className="flex items-center space-x-3 text-body-sm text-slate-600 dark:text-gray-300">
                <span className="font-medium">{storeInfo.storeName}</span>
                <span className="w-1 h-1 bg-slate-400 dark:bg-gray-500 rounded-full"></span>
                <span>{storeInfo.salespersonName}</span>
                <span className="w-1 h-1 bg-slate-400 dark:bg-gray-500 rounded-full"></span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">{storeInfo.shiftName}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end space-x-4 flex-1">
            <ThemeSwitcher />
            <Button
              variant="outline"
              size="lg"
              onClick={onQuickStock}
              className="bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 shadow-sm h-14 w-14 p-0 rounded-xl"
            >
              <Package className="h-7 w-7" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onCustomerManagement}
              className="bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 shadow-sm h-14 w-14 p-0 rounded-xl"
            >
              <User className="h-7 w-7" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onBillHistory}
              className="bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 shadow-sm h-14 w-14 p-0 rounded-xl"
            >
              <History className="h-7 w-7" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSearchTerm(searchTerm ? "" : "search")}
              className="bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 shadow-sm h-14 w-14 p-0 rounded-xl"
            >
              <Search className="h-7 w-7" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 shadow-sm h-14 w-14 p-0 rounded-xl"
              title={showOrderSummary ? "Hide Order Summary" : "Show Order Summary"}
            >
              {showOrderSummary ? <PanelRightClose className="h-7 w-7" /> : <PanelRightOpen className="h-7 w-7" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
