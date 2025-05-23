
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StockForm from "@/components/stock/StockForm";
import StockList from "@/components/stock/StockList";
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import CreditDetails from "@/components/credit/CreditDetails";

const Stocks = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("stocks");

  const handleStockAdded = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Stock & Credit Management</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {activeTab === "stocks" && (
                <DropdownMenuItem onClick={() => setShowForm(!showForm)}>
                  {showForm ? "Cancel Entry" : "Add Stock Entry"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem disabled>
                Import from Excel (Coming soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="stocks" onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="stocks">Stock Entries</TabsTrigger>
            <TabsTrigger value="credits">Credit Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stocks">
            {showForm && (
              <div className="mb-8">
                <StockForm onSuccess={handleStockAdded} onCancel={() => setShowForm(false)} />
              </div>
            )}
            <StockList refreshTrigger={refreshTrigger} />
          </TabsContent>
          
          <TabsContent value="credits">
            <CreditDetails />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Stocks;
