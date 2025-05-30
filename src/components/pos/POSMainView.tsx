
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickActualStockButton from "@/components/stock/QuickActualStockButton";

interface POSMainViewProps {
  onStockAdded: () => void;
}

export const POSMainView: React.FC<POSMainViewProps> = ({ onStockAdded }) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6 h-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
        </div>
        <QuickActualStockButton onStockAdded={onStockAdded} />
      </div>
      
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">POS System</h2>
          <p className="text-gray-600 mb-4">The POS system will open in a separate window for better usability.</p>
          <p className="text-sm text-gray-500">If the popup was blocked, please allow popups for this site and refresh the page.</p>
        </div>
      </div>
    </div>
  );
};
