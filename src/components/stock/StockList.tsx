
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import { IndianRupee, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StockListProps {
  refreshTrigger: number;
}

const StockList = ({ refreshTrigger }: StockListProps) => {
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockEntries = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("stocks")
          .select(`
            id, 
            stock_date, 
            opening_stock, 
            closing_stock, 
            actual_stock,
            shift,
            operator_name,
            shops (id, name),
            products (id, name, price, cost_price)
          `)
          .order("stock_date", { ascending: false });

        if (error) throw error;

        setStockEntries(data || []);
      } catch (error: any) {
        console.error("Error fetching stock data:", error.message);
        toast.error("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchStockEntries();
  }, [refreshTrigger]);

  // Calculate profit for each stock entry
  const calculateProfit = (entry: any) => {
    const sold = entry.opening_stock - entry.closing_stock;
    const sales = sold * Number(entry.products?.price || 0);
    const cost = sold * Number(entry.products?.cost_price || 0);
    return sales - cost;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading stock data...</p>
        </CardContent>
      </Card>
    );
  }

  if (stockEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No stock entries found. Please add some stock data or import from Excel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Entries</CardTitle>
        <span className="text-sm text-muted-foreground">
          {stockEntries.length} entries
        </span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Opening Stock</TableHead>
                <TableHead className="text-right">Closing Stock</TableHead>
                <TableHead className="text-right">Actual Stock</TableHead>
                <TableHead>Shift / Operator</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Sales Amount</TableHead>
                <TableHead className="text-right">Profit/Loss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockEntries.map((entry) => {
                const sold = entry.opening_stock - entry.closing_stock;
                const salesAmount = sold * Number(entry.products?.price || 0);
                const profit = calculateProfit(entry);

                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {format(new Date(entry.stock_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{entry.shops?.name}</TableCell>
                    <TableCell>{entry.products?.name}</TableCell>
                    <TableCell className="text-right">{entry.opening_stock}</TableCell>
                    <TableCell className="text-right">{entry.closing_stock}</TableCell>
                    <TableCell className="text-right">{entry.actual_stock}</TableCell>
                    <TableCell>
                      {entry.shift && (
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <Badge variant="outline" className="font-normal">
                              {entry.shift}
                            </Badge>
                          </div>
                          {entry.operator_name && (
                            <div className="flex items-center">
                              <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{entry.operator_name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{sold}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <IndianRupee className="h-3.5 w-3.5 mr-1" />
                        {salesAmount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      <div className="flex items-center justify-end">
                        <IndianRupee className="h-3.5 w-3.5 mr-1" />
                        {profit.toFixed(2)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockList;
