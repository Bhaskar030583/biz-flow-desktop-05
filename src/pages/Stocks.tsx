
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StockForm from "@/components/stock/StockForm";
import StockList from "@/components/stock/StockList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Stocks = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStockAdded = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-800">Stock Management</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-indigo-100 shadow-lg">
              <DropdownMenuItem 
                onClick={() => setShowForm(!showForm)}
                className="hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
              >
                {showForm ? "Cancel Entry" : "Add Stock Entry"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50">
                Import from Excel (Coming soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-indigo-100">
            <StockForm onSuccess={handleStockAdded} onCancel={() => setShowForm(false)} />
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <StockList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Stocks;
