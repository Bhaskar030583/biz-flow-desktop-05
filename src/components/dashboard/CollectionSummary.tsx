
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CollectionSummaryProps {
  startDate: Date | null;
  endDate: Date | null;
  shopIds: string[];
}

const CollectionSummary = ({ startDate, endDate, shopIds }: CollectionSummaryProps) => {
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCollectionData();
  }, [startDate, endDate, shopIds]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from("credits").select(`
        credit_type,
        amount,
        credit_date,
        shop_id
      `)
      .in('credit_type', ['cash', 'card', 'online']);
      
      // Apply filters
      if (startDate) {
        const formattedStartDate = startDate.toISOString().split('T')[0];
        query = query.gte("credit_date", formattedStartDate);
      }
      
      if (endDate) {
        const formattedEndDate = endDate.toISOString().split('T')[0];
        query = query.lte("credit_date", formattedEndDate);
      }
      
      if (shopIds && shopIds.length > 0) {
        query = query.in("shop_id", shopIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate payment mode totals
      let cashTotal = 0;
      let cardTotal = 0;
      let onlineTotal = 0;
      
      data?.forEach(item => {
        if (item.credit_type === 'cash') {
          cashTotal += Number(item.amount) || 0;
        } else if (item.credit_type === 'card') {
          cardTotal += Number(item.amount) || 0;
        } else if (item.credit_type === 'online') {
          onlineTotal += Number(item.amount) || 0;
        }
      });
      
      const totalAmount = cashTotal + cardTotal + onlineTotal;
      setTotal(totalAmount);
      
      // Create data for pie chart
      const chartData = [
        { name: "Cash", value: cashTotal },
        { name: "Card", value: cardTotal },
        { name: "Online", value: onlineTotal }
      ].filter(item => item.value > 0);
      
      setPaymentData(chartData);
    } catch (error: any) {
      console.error("Error fetching collection data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#4f46e5", "#22c55e", "#f97316", "#ef4444"];
  
  const formatIndianRupee = (value: number) => {
    return `₹${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p>Loading collection data...</p>
        </CardContent>
      </Card>
    );
  }

  if (paymentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No collection data available for the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatIndianRupee(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {paymentData.map((item, index) => (
            <div key={index} className="text-center">
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-lg font-bold">{formatIndianRupee(item.value)}</p>
              <p className="text-xs text-muted-foreground">
                {((item.value / total) * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CollectionSummary;
