
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
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        setDebugInfo("");
        
        console.log('🔍 [SalesChart] Fetching sales data with filters:', {
          startDate,
          endDate,
          shopIds,
          categoryId,
          productId
        });
        
        // First, let's check if we have any sales data at all
        const { data: totalSalesCount, error: countError } = await supabase
          .from("sales")
          .select("id", { count: 'exact' });
        
        if (countError) {
          console.error('❌ [SalesChart] Error counting sales:', countError);
          setDebugInfo(`Error counting sales: ${countError.message}`);
        } else {
          console.log('📊 [SalesChart] Total sales in database:', totalSalesCount?.length || 0);
          setDebugInfo(`Total sales in database: ${totalSalesCount?.length || 0}`);
        }
        
        // Build the query with simplified approach
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
          const formattedStartDate = format(startDate, "yyyy-MM-dd");
          query = query.gte("sale_date", formattedStartDate);
          console.log('📅 [SalesChart] Start date filter:', formattedStartDate);
        }
        if (endDate) {
          const formattedEndDate = format(endDate, "yyyy-MM-dd");
          query = query.lte("sale_date", formattedEndDate);
          console.log('📅 [SalesChart] End date filter:', formattedEndDate);
        }
        if (shopIds && shopIds.length > 0) {
          query = query.in("shop_id", shopIds);
          console.log('🏪 [SalesChart] Shop filter:', shopIds);
        }
        if (productId) {
          query = query.eq("product_id", productId);
          console.log('📦 [SalesChart] Product filter:', productId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('❌ [SalesChart] Error fetching sales:', error);
          setDebugInfo(prev => prev + ` | Query error: ${error.message}`);
          setSalesData([]);
          return;
        }
        
        console.log('📊 [SalesChart] Raw sales data:', data?.length || 0, 'records');
        setDebugInfo(prev => prev + ` | Filtered results: ${data?.length || 0}`);
        
        if (!data || data.length === 0) {
          console.log('⚠️ [SalesChart] No sales data found');
          setSalesData([]);
          return;
        }
        
        // Process data
        const processedData: Record<string, SalesDataPoint> = {};
        
        data?.forEach((sale: SaleData) => {
          if (!sale.products) {
            console.warn('⚠️ [SalesChart] Sale without product data:', sale);
            return;
          }
          
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
          // Use cost_price from products table, default to 0 if not available
          const costPrice = Number(sale.products.cost_price || 0) * sale.quantity;
          const profit = totalSale - costPrice;
          
          processedData[date].sales += totalSale;
          processedData[date].profit += profit;
          
          console.log(`📈 [SalesChart] Processing ${date}: sale=${totalSale}, profit=${profit}`);
        });
        
        // Convert to array and sort
        const sortedData = Object.values(processedData).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        console.log('📊 [SalesChart] Final processed data:', sortedData.length, 'data points');
        setSalesData(sortedData);
      } catch (error: any) {
        console.error("❌ [SalesChart] Unexpected error:", error);
        setDebugInfo(prev => prev + ` | Unexpected error: ${error.message}`);
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
        <CardContent className="h-80 flex flex-col items-center justify-center">
          <p className="text-muted-foreground mb-2">No sales data available for the selected filters.</p>
          <p className="text-xs text-muted-foreground">{debugInfo}</p>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>This chart shows data from the "sales" table.</p>
            <p>Try adjusting your date range or removing filters to see data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales and Profit Analysis</CardTitle>
        <p className="text-xs text-muted-foreground">{debugInfo}</p>
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
