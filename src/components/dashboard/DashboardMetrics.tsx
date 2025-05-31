
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
  DollarSign,
  Banknote,
  Smartphone
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
  cashAmount?: number;
  onlineAmount?: number;
  gridColumns?: number;
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
  totalLoss,
  cashAmount = 0,
  onlineAmount = 0,
  gridColumns = 5
}) => {
  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getGridClass = () => {
    switch (gridColumns) {
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      case 5:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
      case 6:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
      case 7:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7";
      default:
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    }
  };

  // Calculate total amount (cash + UPI + credit received - credit given)
  const totalAmount = cashAmount + onlineAmount + creditReceived - creditGiven;

  return (
    <div className={`grid gap-3 ${getGridClass()} mb-6`}>
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Revenue</p>
              <div className="text-base font-bold truncate">{formatIndianRupee(totalRevenue)}</div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+4.3%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Cash Amount</p>
              <div className="text-base font-bold text-green-600 truncate">{formatIndianRupee(cashAmount)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Cash sales</span>
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-full ml-2">
              <Banknote className="h-3 w-3 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">UPI Amount</p>
              <div className="text-base font-bold text-blue-600 truncate">{formatIndianRupee(onlineAmount)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Digital payments</span>
              </div>
            </div>
            <div className="p-2 bg-blue-100 rounded-full ml-2">
              <Smartphone className="h-3 w-3 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Amount</p>
              <div className="text-base font-bold text-purple-600 truncate">{formatIndianRupee(totalAmount)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>All payments</span>
              </div>
            </div>
            <div className="p-2 bg-purple-100 rounded-full ml-2">
              <DollarSign className="h-3 w-3 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Sales</p>
              <div className="text-base font-bold">{totalSales}</div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+2.5%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <ShoppingCart className="h-3 w-3 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Products Sold</p>
              <div className="text-base font-bold">{totalProducts}</div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+5.7%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <Package className="h-3 w-3 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Avg. Sale Value</p>
              <div className="text-base font-bold truncate">
                {formatIndianRupee(averageSaleValue)}
              </div>
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+1.2%</span>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-full ml-2">
              <BarChart3 className="h-3 w-3 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Gross Profit</p>
              <div className="text-base font-bold text-green-500 truncate">{formatIndianRupee(grossProfit)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Sales profit</span>
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-full ml-2">
              <DollarSign className="h-3 w-3 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Net Profit</p>
              <div className={`text-base font-bold truncate ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatIndianRupee(Math.abs(netProfit))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>{netProfit >= 0 ? 'After expenses' : 'Net loss'}</span>
              </div>
            </div>
            <div className={`p-2 rounded-full ml-2 ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`h-3 w-3 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Total Loss</p>
              <div className="text-base font-bold text-red-500 truncate">{formatIndianRupee(totalLoss)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>From sales</span>
              </div>
            </div>
            <div className="p-2 bg-red-100 rounded-full ml-2">
              <TrendingDown className="h-3 w-3 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Credit Given</p>
              <div className="text-base font-bold text-red-500 truncate">{formatIndianRupee(creditGiven)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Money lent</span>
              </div>
            </div>
            <div className="p-2 bg-red-100 rounded-full ml-2">
              <CreditCard className="h-3 w-3 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Credit Received</p>
              <div className="text-base font-bold text-green-500 truncate">{formatIndianRupee(creditReceived)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>Money received</span>
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-full ml-2">
              <Receipt className="h-3 w-3 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1 truncate">Credit Balance</p>
              <div className={`text-base font-bold truncate ${creditBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatIndianRupee(Math.abs(creditBalance))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>{creditBalance >= 0 ? 'Receivable' : 'Payable'}</span>
              </div>
            </div>
            <div className={`p-2 rounded-full ml-2 ${creditBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <BarChart3 className={`h-3 w-3 ${creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
