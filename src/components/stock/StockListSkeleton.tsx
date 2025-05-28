
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StockSummaryCardsSkeleton from "./StockSummaryCardsSkeleton";
import StockTableSkeleton from "./StockTableSkeleton";

const StockListSkeleton = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <StockSummaryCardsSkeleton />
      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4">
          <CardTitle>Assigned Products Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
};

export default StockListSkeleton;
