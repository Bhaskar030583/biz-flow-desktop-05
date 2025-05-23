
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
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
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
}

interface ChartProps {
  entries: StockEntry[];
  isLoading?: boolean;
}

const StockChart: React.FC<ChartProps> = ({ entries, isLoading = false }) => {
  // Group data by date for charts
  const chartData = useMemo(() => {
    // Create a map to aggregate data by date
    const dateMap = new Map<string, GroupedData>();
    
    entries.forEach(entry => {
      const date = entry.stock_date;
      const unitsSold = entry.opening_stock - entry.closing_stock;
      const sales = unitsSold * Number(entry.products?.price || 0);
      const cost = unitsSold * Number(entry.products?.cost_price || 0);
      const profit = sales - cost;
      
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        dateMap.set(date, {
          date,
          totalSold: existing.totalSold + unitsSold,
          totalSales: existing.totalSales + sales,
          totalProfit: existing.totalProfit + profit
        });
      } else {
        dateMap.set(date, {
          date,
          totalSold: unitsSold,
          totalSales: sales,
          totalProfit: profit
        });
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        formattedDate: format(new Date(item.date), 'dd MMM')
      }));
  }, [entries]);

  // If we have no data or loading, show empty state
  if ((chartData.length === 0 && !isLoading) || entries.length === 0) {
    return null;
  }

  const chartConfig = {
    sales: {
      label: "Sales Amount",
      theme: {
        light: "#4f46e5",
        dark: "#818cf8"
      }
    },
    profit: {
      label: "Profit",
      theme: {
        light: "#10b981",
        dark: "#34d399"
      }
    },
    loss: {
      label: "Loss",
      theme: {
        light: "#ef4444",
        dark: "#f87171"
      }
    },
    units: {
      label: "Units Sold",
      theme: {
        light: "#f59e0b",
        dark: "#fbbf24"
      }
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
            <ChartContainer 
              config={chartConfig} 
              className="aspect-[4/3] sm:aspect-[16/9] h-[300px] sm:h-[400px]"
            >
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
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <ChartTooltipContent 
                          active={active} 
                          payload={payload} 
                          formatter={(value, name) => {
                            return (
                              <span className="font-mono text-sm">
                                ₹{Number(value).toLocaleString()}
                              </span>
                            );
                          }}
                        />
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalSales" 
                  name="sales"
                  stroke="var(--color-sales)" 
                  strokeWidth={2} 
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>
          
          <TabsContent value="units" className="space-y-4">
            <ChartContainer 
              config={chartConfig} 
              className="aspect-[4/3] sm:aspect-[16/9] h-[300px] sm:h-[400px]"
            >
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
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <ChartTooltipContent 
                          active={active} 
                          payload={payload} 
                          formatter={(value, name) => {
                            return (
                              <span className="font-mono text-sm">
                                {Number(value).toLocaleString()} units
                              </span>
                            );
                          }}
                        />
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="totalSold" 
                  name="units" 
                  fill="var(--color-units)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20} 
                />
              </BarChart>
            </ChartContainer>
          </TabsContent>
          
          <TabsContent value="profit" className="space-y-4">
            <ChartContainer 
              config={chartConfig} 
              className="aspect-[4/3] sm:aspect-[16/9] h-[300px] sm:h-[400px]"
            >
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
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0]?.value as number;
                      return (
                        <ChartTooltipContent 
                          active={active} 
                          payload={payload} 
                          formatter={(value, name) => {
                            return (
                              <span className="font-mono text-sm">
                                ₹{Number(value).toLocaleString()}
                              </span>
                            );
                          }}
                        />
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
                <Bar 
                  dataKey="totalProfit" 
                  name={({ totalProfit }: { totalProfit: number }) => totalProfit >= 0 ? "profit" : "loss"}
                  fill={({ totalProfit }: { totalProfit: number }) => totalProfit >= 0 ? "var(--color-profit)" : "var(--color-loss)"}
                  radius={[4, 4, 0, 0]} 
                  barSize={20} 
                />
              </BarChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockChart;
