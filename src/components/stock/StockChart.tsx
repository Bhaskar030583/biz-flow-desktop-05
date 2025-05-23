
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, parseISO, subDays } from "date-fns";

interface StockEntry {
  id: string;
  stock_date: string;
  opening_stock: number;
  closing_stock: number;
  actual_stock: number;
  products?: {
    name: string;
    price?: number;
    cost_price?: number;
  };
  shops?: {
    name: string;
  };
}

interface GroupedData {
  date: string;
  totalSold: number;
  totalSales: number;
  totalProfit: number;
  formattedDate: string;
}

interface ChartProps {
  entries?: StockEntry[];
  isLoading?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  shopIds?: string[];
  productId?: string | null;
}

const StockChart: React.FC<ChartProps> = ({ entries = [], isLoading = false }) => {
  // Group data by date for charts
  const chartData = useMemo(() => {
    // Create a map to aggregate data by date
    const dateMap = new Map<string, GroupedData>();
    
    // Make sure entries is defined and is an array before using forEach
    if (!entries || !Array.isArray(entries)) {
      return [];
    }
    
    entries.forEach(entry => {
      const date = entry.stock_date;
      const unitsSold = entry.opening_stock - entry.closing_stock;
      const sales = unitsSold * Number(entry.products?.price || 0);
      const cost = unitsSold * Number(entry.products?.cost_price || 0);
      const profit = sales - cost;
      
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        dateMap.set(date, {
          ...existing,
          totalSold: existing.totalSold + unitsSold,
          totalSales: existing.totalSales + sales,
          totalProfit: existing.totalProfit + profit
        });
      } else {
        dateMap.set(date, {
          date,
          totalSold: unitsSold,
          totalSales: sales,
          totalProfit: profit,
          formattedDate: format(new Date(date), 'dd MMM')
        });
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries]);

  // If we have no data or loading, show empty state
  if ((chartData.length === 0 && !isLoading) || entries.length === 0) {
    return null;
  }

  const chartConfig = {
    sales: {
      label: "Sales Amount",
      color: "hsl(var(--chart-sales))"
    },
    profit: {
      label: "Profit",
      color: "hsl(var(--chart-profit))"
    },
    loss: {
      label: "Loss",
      color: "hsl(var(--chart-loss))"
    },
    units: {
      label: "Units Sold",
      color: "hsl(var(--chart-units))"
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle>Stock Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="mb-4 grid grid-cols-3 md:w-auto">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="profit">Profit/Loss</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="space-y-4">
            <div className="aspect-[4/3] sm:aspect-[16/9] h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalSales" 
                    name="Sales"
                    stroke={chartConfig.sales.color} 
                    strokeWidth={2} 
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="units" className="space-y-4">
            <div className="aspect-[4/3] sm:aspect-[16/9] h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} units`, 'Units']}
                  />
                  <Bar 
                    dataKey="totalSold" 
                    name="Units" 
                    fill={chartConfig.units.color} 
                    radius={[4, 4, 0, 0]} 
                    barSize={20} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="profit" className="space-y-4">
            <div className="aspect-[4/3] sm:aspect-[16/9] h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Profit/Loss']}
                  />
                  <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
                  <Bar 
                    dataKey="totalProfit"
                    name="Profit/Loss"
                    fill={chartConfig.profit.color}
                    radius={[4, 4, 0, 0]} 
                    barSize={20} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockChart;
