
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

export function AdvancedReporting() {
  const { user } = useAuth();
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Fetch stores
  const { data: stores } = useQuery({
    queryKey: ['hr-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name')
        .order('store_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch loss data with analytics
  const { data: lossAnalytics } = useQuery({
    queryKey: ['loss-analytics', selectedStore, startDate, endDate],
    queryFn: async () => {
      let lossQuery = supabase
        .from('losses')
        .select(`
          *,
          products!inner (
            id,
            name,
            price
          ),
          hr_stores!inner (
            id,
            store_name
          )
        `)
        .eq('user_id', user?.id)
        .gte('loss_date', startDate)
        .lte('loss_date', endDate);

      if (selectedStore !== "all") {
        lossQuery = lossQuery.eq('hr_shop_id', selectedStore);
      }

      const { data: lossData, error } = await lossQuery;
      if (error) throw error;

      // Process data for analytics
      const lossTypeAnalysis = lossData?.reduce((acc: any, loss: any) => {
        const type = loss.loss_type;
        if (!acc[type]) {
          acc[type] = { count: 0, value: 0 };
        }
        acc[type].count += loss.quantity_lost;
        acc[type].value += loss.quantity_lost * (loss.products?.price || 0);
        return acc;
      }, {});

      const storeAnalysis = lossData?.reduce((acc: any, loss: any) => {
        const storeId = loss.hr_shop_id;
        const storeName = loss.hr_stores?.store_name || 'Unknown Store';
        if (!acc[storeId]) {
          acc[storeId] = { name: storeName, count: 0, value: 0 };
        }
        acc[storeId].count += loss.quantity_lost;
        acc[storeId].value += loss.quantity_lost * (loss.products?.price || 0);
        return acc;
      }, {});

      return {
        totalLosses: lossData?.length || 0,
        totalValue: lossData?.reduce((sum: number, loss: any) => 
          sum + (loss.quantity_lost * (loss.products?.price || 0)), 0) || 0,
        lossTypeData: Object.entries(lossTypeAnalysis || {}).map(([type, data]: [string, any]) => ({
          type,
          count: data.count,
          value: data.value
        })),
        storeData: Object.values(storeAnalysis || {})
      };
    },
  });

  // Fetch stock movement analytics
  const { data: stockMovementAnalytics } = useQuery({
    queryKey: ['stock-movement-analytics', selectedStore, startDate, endDate],
    queryFn: async () => {
      let movementQuery = supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner (
            id,
            name
          ),
          hr_stores!hr_from_shop_id (
            id,
            store_name
          ),
          hr_stores!hr_to_shop_id (
            id,
            store_name
          )
        `)
        .gte('movement_date', startDate)
        .lte('movement_date', endDate);

      if (selectedStore !== "all") {
        movementQuery = movementQuery.or(`hr_from_shop_id.eq.${selectedStore},hr_to_shop_id.eq.${selectedStore}`);
      }

      const { data: movementData, error } = await movementQuery;
      if (error) throw error;

      return {
        totalMovements: movementData?.length || 0,
        totalQuantity: movementData?.reduce((sum: number, movement: any) => sum + movement.quantity, 0) || 0,
        statusBreakdown: movementData?.reduce((acc: any, movement: any) => {
          const status = movement.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      };
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="store-select">Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="losses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="losses">Loss Analytics</TabsTrigger>
          <TabsTrigger value="movements">Stock Movement Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="losses" className="space-y-6">
          {/* Loss Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Losses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lossAnalytics?.totalLosses || 0}</div>
                <p className="text-sm text-muted-foreground">Incidents reported</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Loss Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(lossAnalytics?.totalValue || 0).toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Monetary impact</p>
              </CardContent>
            </Card>
          </div>

          {/* Loss Type Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loss by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lossAnalytics?.lossTypeData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Quantity Lost" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loss Value by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={lossAnalytics?.lossTypeData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.type}: ₹${entry.value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(lossAnalytics?.lossTypeData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          {/* Movement Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stockMovementAnalytics?.totalMovements || 0}</div>
                <p className="text-sm text-muted-foreground">Stock transfers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Quantity Moved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stockMovementAnalytics?.totalQuantity || 0}</div>
                <p className="text-sm text-muted-foreground">Units transferred</p>
              </CardContent>
            </Card>
          </div>

          {/* Movement Status Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Movement Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(stockMovementAnalytics?.statusBreakdown || {}).map(([status, count]) => ({ 
                    status, 
                    count 
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
