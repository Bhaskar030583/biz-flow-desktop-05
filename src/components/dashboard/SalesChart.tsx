
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { IndianRupee } from "lucide-react";

interface SalesDataPoint {
  date: string;
  sales: number;
  profit: number;
}

interface SalesChartProps {
  startDate: Date | null;
  endDate: Date | null;
  shopIds: string[];
  categoryId: string | null;
  productId: string | null;
}

interface ProductData {
  id: string;
  name: string;
  cost_price: number | null;
  price: number;
  category: string;
}

interface SaleData {
  sale_date: string;
  quantity: number;
  price: number;
  products: ProductData;
}

export function SalesChart({ startDate, endDate, shopIds, categoryId, productId }: SalesChartProps) {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        
        // Build the query
        let query = supabase
          .from("sales")
          .select(`
            sale_date,
            quantity,
            price,
            products(id, name, cost_price, price, category)
          `)
          .order("sale_date");
        
        // Add filters
        if (startDate) {
          query = query.gte("sale_date", format(startDate, "yyyy-MM-dd"));
        }
        if (endDate) {
          query = query.lte("sale_date", format(endDate, "yyyy-MM-dd"));
        }
        if (shopIds && shopIds.length > 0) {
          query = query.in("shop_id", shopIds);
        }
        if (productId) {
          query = query.eq("product_id", productId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Process data
        const processedData: Record<string, SalesDataPoint> = {};
        
        data?.forEach((sale: SaleData) => {
          if (!sale.products) return;
          
          // Apply category filter
          if (categoryId && sale.products.category !== categoryId) {
            return;
          }
          
          const date = sale.sale_date;
          
          if (!processedData[date]) {
            processedData[date] = {
              date,
              sales: 0,
              profit: 0
            };
          }
          
          const totalSale = Number(sale.price) * sale.quantity;
          // Default cost price to 0 if not available
          const costPrice = Number(sale.products.cost_price || 0) * sale.quantity;
          const profit = totalSale - costPrice;
          
          processedData[date].sales += totalSale;
          processedData[date].profit += profit;
        });
        
        // Convert to array and sort
        const sortedData = Object.values(processedData).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        setSalesData(sortedData);
      } catch (error: any) {
        console.error("Error fetching sales data:", error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSalesData();
  }, [startDate, endDate, shopIds, categoryId, productId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales and Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p>Loading sales data...</p>
        </CardContent>
      </Card>
    );
  }

  if (salesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales and Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No sales data available for the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales and Profit Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer
            config={{
              sales: {
                label: "Sales",
                color: "#4f46e5"
              },
              profit: {
                label: "Profit",
                color: "#22c55e"
              }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <ChartTooltipContent
                          className="border border-slate-200"
                          payload={payload}
                          formatter={(value, name) => (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{name}:</span>
                              <div className="flex items-center">
                                <IndianRupee className="h-3 w-3 mr-1" />
                                {Number(value).toFixed(2)}
                              </div>
                            </div>
                          )}
                        />
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="#4f46e5" />
                <Bar dataKey="profit" name="Profit" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
