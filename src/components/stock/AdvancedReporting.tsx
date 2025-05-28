
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingDown, BarChart3, PieChart, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const AdvancedReporting = () => {
  const { user } = useAuth();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("week");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(subDays(new Date(), 7));
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(new Date());

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { from: format(now, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case "week":
        return { 
          from: format(startOfWeek(now), 'yyyy-MM-dd'), 
          to: format(endOfWeek(now), 'yyyy-MM-dd') 
        };
      case "month":
        return { 
          from: format(startOfMonth(now), 'yyyy-MM-dd'), 
          to: format(endOfMonth(now), 'yyyy-MM-dd') 
        };
      case "custom":
        return { 
          from: customDateFrom ? format(customDateFrom, 'yyyy-MM-dd') : format(subDays(now, 7), 'yyyy-MM-dd'),
          to: customDateTo ? format(customDateTo, 'yyyy-MM-dd') : format(now, 'yyyy-MM-dd')
        };
      default:
        return { from: format(subDays(now, 7), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
    }
  };

  // Fetch stores
  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch losses report
  const { data: lossesReport } = useQuery({
    queryKey: ['losses-report', selectedStore, dateRange, customDateFrom, customDateTo],
    queryFn: async () => {
      const { from, to } = getDateRange();
      
      let query = supabase
        .from('losses')
        .select(`
          *,
          products (name, category, price, cost_price),
          shops (name),
          hr_shifts (shift_name)
        `)
        .eq('user_id', user?.id)
        .gte('loss_date', from)
        .lte('loss_date', to);

      if (selectedStore) {
        query = query.eq('shop_id', selectedStore);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate summary metrics
      const totalQuantityLost = data?.reduce((sum, loss) => sum + loss.quantity_lost, 0) || 0;
      const totalValueLost = data?.reduce((sum, loss) => {
        const cost = loss.products?.cost_price || loss.products?.price || 0;
        return sum + (loss.quantity_lost * cost);
      }, 0) || 0;

      // Group by loss type
      const byLossType = data?.reduce((acc, loss) => {
        if (!acc[loss.loss_type]) {
          acc[loss.loss_type] = { quantity: 0, value: 0, count: 0 };
        }
        const cost = loss.products?.cost_price || loss.products?.price || 0;
        acc[loss.loss_type].quantity += loss.quantity_lost;
        acc[loss.loss_type].value += loss.quantity_lost * cost;
        acc[loss.loss_type].count += 1;
        return acc;
      }, {} as Record<string, { quantity: number; value: number; count: number }>) || {};

      // Group by store
      const byStore = data?.reduce((acc, loss) => {
        const storeName = loss.shops?.name || 'Unknown';
        if (!acc[storeName]) {
          acc[storeName] = { quantity: 0, value: 0, count: 0 };
        }
        const cost = loss.products?.cost_price || loss.products?.price || 0;
        acc[storeName].quantity += loss.quantity_lost;
        acc[storeName].value += loss.quantity_lost * cost;
        acc[storeName].count += 1;
        return acc;
      }, {} as Record<string, { quantity: number; value: number; count: number }>) || {};

      return {
        totalQuantityLost,
        totalValueLost,
        byLossType,
        byStore,
        losses: data || []
      };
    },
    enabled: !!user?.id
  });

  // Fetch stock performance report
  const { data: stockReport } = useQuery({
    queryKey: ['stock-report', selectedStore, dateRange, customDateFrom, customDateTo],
    queryFn: async () => {
      const { from, to } = getDateRange();
      
      let query = supabase
        .from('stocks')
        .select(`
          *,
          products (name, category, price, cost_price),
          shops (name)
        `)
        .eq('user_id', user?.id)
        .gte('stock_date', from)
        .lte('stock_date', to);

      if (selectedStore) {
        query = query.eq('shop_id', selectedStore);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const totalSales = data?.reduce((sum, stock) => {
        const sold = stock.opening_stock + (stock.stock_added || 0) - stock.actual_stock;
        return sum + (sold * (stock.products?.price || 0));
      }, 0) || 0;

      const totalProfit = data?.reduce((sum, stock) => {
        const sold = stock.opening_stock + (stock.stock_added || 0) - stock.actual_stock;
        const revenue = sold * (stock.products?.price || 0);
        const cost = sold * (stock.products?.cost_price || 0);
        return sum + (revenue - cost);
      }, 0) || 0;

      const totalVariance = data?.reduce((sum, stock) => {
        return sum + (stock.closing_stock - stock.actual_stock);
      }, 0) || 0;

      // Top performing products
      const productPerformance = data?.reduce((acc, stock) => {
        const productName = stock.products?.name || 'Unknown';
        const sold = stock.opening_stock + (stock.stock_added || 0) - stock.actual_stock;
        const revenue = sold * (stock.products?.price || 0);
        
        if (!acc[productName]) {
          acc[productName] = { sold: 0, revenue: 0 };
        }
        acc[productName].sold += sold;
        acc[productName].revenue += revenue;
        return acc;
      }, {} as Record<string, { sold: number; revenue: number }>) || {};

      const topProducts = Object.entries(productPerformance)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);

      return {
        totalSales,
        totalProfit,
        totalVariance,
        topProducts,
        entries: data || []
      };
    },
    enabled: !!user?.id
  });

  const getLossTypeColor = (type: string) => {
    const colors = {
      theft: "bg-red-100 text-red-800",
      damage: "bg-orange-100 text-orange-800",
      expiry: "bg-yellow-100 text-yellow-800",
      spillage: "bg-blue-100 text-blue-800",
      breakage: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800"
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Reporting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stores</SelectItem>
                  {stores?.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Stock Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{stockReport?.totalSales?.toLocaleString() || 0}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{stockReport?.totalProfit?.toLocaleString() || 0}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Losses</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{lossesReport?.totalValueLost?.toLocaleString() || 0}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loss Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Loss Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">By Loss Type</h4>
                  <div className="space-y-2">
                    {Object.entries(lossesReport?.byLossType || {}).map(([type, data]) => (
                      <div key={type} className="flex justify-between items-center p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge className={getLossTypeColor(type)}>{type}</Badge>
                          <span className="text-sm">{data.count} incidents</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{data.value.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{data.quantity} units</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">By Store</h4>
                  <div className="space-y-2">
                    {Object.entries(lossesReport?.byStore || {}).map(([store, data]) => (
                      <div key={store} className="flex justify-between items-center p-2 rounded border">
                        <div>
                          <div className="font-medium">{store}</div>
                          <div className="text-sm text-gray-600">{data.count} incidents</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{data.value.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{data.quantity} units</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stockReport?.topProducts?.map(([product, data], index) => (
                  <div key={product} className="flex justify-between items-center p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{product}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{data.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{data.sold} units sold</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedReporting;
