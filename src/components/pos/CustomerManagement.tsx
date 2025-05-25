
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerForm } from "./CustomerForm";
import { CustomerList } from "./CustomerList";
import { UserPlus, Users } from "lucide-react";

export const CustomerManagement: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCustomerAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer List
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <CustomerList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <CustomerForm onCustomerAdded={handleCustomerAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
