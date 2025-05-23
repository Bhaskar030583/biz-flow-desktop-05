
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";

interface SummaryData {
  totalSold: number;
  totalSales: number;
  totalProfit: number;
}

interface StockSummaryCardsProps {
  summary: SummaryData;
}

const StockSummaryCards = ({ summary }: StockSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-indigo-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Units Sold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalSold.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-2xl font-bold">
            <IndianRupee className="h-5 w-5 mr-1" />
            {summary.totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
      
      <Card className={`bg-gradient-to-br ${summary.totalProfit >= 0 ? 'from-green-50' : 'from-red-50'} to-white`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit/Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <IndianRupee className="h-5 w-5 mr-1" />
            {Math.abs(summary.totalProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockSummaryCards;
