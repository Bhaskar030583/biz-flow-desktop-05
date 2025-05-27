
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, Send, Inbox } from "lucide-react";
import { StockRequestForm } from "@/components/stock-movements/StockRequestForm";
import { StockRequestsList } from "@/components/stock-movements/StockRequestsList";
import { IncomingRequestsList } from "@/components/stock-movements/IncomingRequestsList";

const StockMovements = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRequestCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRequestUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ArrowRightLeft className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold">Stock Movements</h1>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Create Request
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            My Requests
          </TabsTrigger>
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Incoming Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Request Stock from Another Store</CardTitle>
            </CardHeader>
            <CardContent>
              <StockRequestForm onRequestCreated={handleRequestCreated} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests">
          <Card>
            <CardHeader>
              <CardTitle>My Stock Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <StockRequestsList 
                key={`my-requests-${refreshTrigger}`}
                onRequestUpdated={handleRequestUpdated}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomingRequestsList 
                key={`incoming-${refreshTrigger}`}
                onRequestUpdated={handleRequestUpdated}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockMovements;
