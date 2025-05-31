
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoDebitConfigs } from "./AutoDebitConfigs";
import { AutoDebitTransactions } from "./AutoDebitTransactions";
import { PaymentMethodsManagement } from "./PaymentMethodsManagement";
import { ApiKeyManagement } from "./ApiKeyManagement";
import { Settings, CreditCard, History, Key } from "lucide-react";

export const AutoDebitManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="api-config" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-config" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Configuration
          </TabsTrigger>
          <TabsTrigger value="configs" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Auto Debit Configs
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-config" className="mt-6">
          <ApiKeyManagement />
        </TabsContent>

        <TabsContent value="configs" className="mt-6">
          <AutoDebitConfigs />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodsManagement />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <AutoDebitTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
};
