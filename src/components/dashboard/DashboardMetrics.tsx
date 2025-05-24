
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  BarChart3,
  CreditCard,
  Receipt,
  TrendingDown,
  DollarSign
} from "lucide-react";

interface MetricsProps {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  averageSaleValue: number;
  creditGiven: number;
  creditReceived: number;
  creditBalance: number;
  grossProfit: number;
  netProfit: number;
  totalLoss: number;
}

export const DashboardMetrics: React.FC<MetricsProps> = ({
  totalRevenue,
  totalSales,
  totalProducts,
  averageSaleValue,
  creditGiven,
  creditReceived,
  creditBalance,
  grossProfit,
  netProfit,
  totalLoss
}) => {
  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mb-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Revenue</p>
              <div className="text-lg font-bold truncate">{formatIndianRupee(totalRevenue)}</div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-2 w-2 mr-1" />
                <span>+4.3%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Sales</p>
              <div className="text-lg font-bold">{totalSales}</div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-2 w-2 mr-1" />
                <span>+2.5%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Products Sold</p>
              <div className="text-lg font-bold">{totalProducts}</div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-2 w-2 mr-1" />
                <span>+5.7%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Avg. Sale Value</p>
              <div className="text-lg font-bold truncate">
                {formatIndianRupee(averageSaleValue)}
              </div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-2 w-2 mr-1" />
                <span>+1.2%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Gross Profit</p>
              <div className="text-lg font-bold text-green-500 truncate">{formatIndianRupee(grossProfit)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Sales profit</span>
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-full ml-2">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Net Profit</p>
              <div className={`text-lg font-bold truncate ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatIndianRupee(Math.abs(netProfit))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>{netProfit >= 0 ? 'After expenses' : 'Net loss'}</span>
              </div>
            </div>
            <div className={`p-2 rounded-full ml-2 ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Loss</p>
              <div className="text-lg font-bold text-red-500 truncate">{formatIndianRupee(totalLoss)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>From sales</span>
              </div>
            </div>
            <div className="p-2 bg-red-100 rounded-full ml-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Credit Given</p>
              <div className="text-lg font-bold text-red-500 truncate">{formatIndianRupee(creditGiven)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Money lent</span>
              </div>
            </div>
            <div className="p-2 bg-red-100 rounded-full ml-2">
              <CreditCard className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Credit Received</p>
              <div className="text-lg font-bold text-green-500 truncate">{formatIndianRupee(creditReceived)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Money received</span>
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-full ml-2">
              <Receipt className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Credit Balance</p>
              <div className={`text-lg font-bold truncate ${creditBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatIndianRupee(Math.abs(creditBalance))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>{creditBalance >= 0 ? 'Receivable' : 'Payable'}</span>
              </div>
            </div>
            <div className={`p-2 rounded-full ml-2 ${creditBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <BarChart3 className={`h-4 w-4 ${creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
