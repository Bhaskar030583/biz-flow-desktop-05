
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  BarChart3,
  CreditCard,
  Receipt
} from "lucide-react";

interface MetricsProps {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  averageSaleValue: number;
  creditGiven: number;
  creditReceived: number;
  creditBalance: number;
}

export const DashboardMetrics: React.FC<MetricsProps> = ({
  totalRevenue,
  totalSales,
  totalProducts,
  averageSaleValue,
  creditGiven,
  creditReceived,
  creditBalance
}) => {
  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
              <div className="text-2xl font-bold">{formatIndianRupee(totalRevenue)}</div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+4.3% from last month</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Sales</p>
              <div className="text-2xl font-bold">{totalSales}</div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+2.5% from last week</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Products Sold</p>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+5.7% from last week</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Sale Value</p>
              <div className="text-2xl font-bold">
                {formatIndianRupee(averageSaleValue)}
              </div>
              <div className="mt-2 text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+1.2% from last week</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Credit Given</p>
              <div className="text-2xl font-bold text-red-500">{formatIndianRupee(creditGiven)}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span>Money lent out</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Credit Received</p>
              <div className="text-2xl font-bold text-green-500">{formatIndianRupee(creditReceived)}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span>Money received back</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Credit Balance</p>
              <div className={`text-2xl font-bold ${creditBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatIndianRupee(Math.abs(creditBalance))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span>{creditBalance >= 0 ? 'Net receivable' : 'Net payable'}</span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${creditBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <BarChart3 className={`h-6 w-6 ${creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
