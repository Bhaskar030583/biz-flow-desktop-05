
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
          <h1 className="text-2xl font-bold">Stock Management</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Stock Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel Entry" : "Add Stock Entry"}
              </DropdownMenuItem>
              {/* We can add more options here in the future */}
              <DropdownMenuItem disabled>
                Import from Excel (Coming soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showForm && (
          <div className="mb-8">
            <StockForm onSuccess={handleStockAdded} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <StockList refreshTrigger={refreshTrigger} />
      </div>
    </DashboardLayout>
  );
};

export default Stocks;
