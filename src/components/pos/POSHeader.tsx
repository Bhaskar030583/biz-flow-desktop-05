
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
  showSearch: boolean;
  toggleSearch: () => void;
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
  showSearch,
  toggleSearch,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Logo and Store Info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/31fce476-e564-4413-90e1-e9d9fd78516f.png" 
                alt="ABC Cafe Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            
            {storeInfo && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-6">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{storeInfo.storeName}</div>
                <div className="flex items-center space-x-2">
                  <span>{storeInfo.salespersonName}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{storeInfo.shiftName}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right section - Actions */}
          <div className="flex items-center space-x-3">
            <ThemeSwitcher />
            
            <Button
              variant="outline"
              size="icon"
              onClick={onQuickStock}
              className="h-10 w-10 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Quick Stock"
            >
              <Package className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={onCustomerManagement}
              className="h-10 w-10 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Customer Management"
            >
              <User className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={onBillHistory}
              className="h-10 w-10 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Bill History"
            >
              <History className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSearch}
              className={`h-10 w-10 border-gray-200 dark:border-gray-600 ${
                showSearch ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              title="Search Products"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="h-10 w-10 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              title={showOrderSummary ? "Hide Order Summary" : "Show Order Summary"}
            >
              {showOrderSummary ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
