
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";

interface SummaryData {
  totalSold: number;
  totalSales: number;
  totalProfit: number;
  totalProductLoss: number;
}

interface StockSummaryCardsProps {
  summary: SummaryData;
}

const StockSummaryCards = ({ summary }: StockSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/50 dark:to-gray-900 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Units Sold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold animate-fade-in">{summary.totalSold.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/50 dark:to-gray-900 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-2xl font-bold animate-fade-in">
            <IndianRupee className="h-5 w-5 mr-1" />
            {summary.totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>
      
      <Card className={`bg-gradient-to-br ${summary.totalProfit >= 0 ? 'from-green-50 dark:from-green-950/30' : 'from-red-50 dark:from-red-950/30'} to-white dark:to-gray-900 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit/Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} animate-fade-in`}>
            <IndianRupee className="h-5 w-5 mr-1" />
            {Math.abs(summary.totalProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-gray-900 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Product Loss Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-2xl font-bold text-amber-600 dark:text-amber-400 animate-fade-in">
            <IndianRupee className="h-5 w-5 mr-1" />
            {summary.totalProductLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Due to missing inventory</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockSummaryCards;
