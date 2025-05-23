
import React, { useState, useEffect, useMemo } from "react";
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
import { IndianRupee, User, Clock, Search, Filter, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface StockListProps {
  refreshTrigger: number;
}

const StockList = ({ refreshTrigger }: StockListProps) => {
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>("stock_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
        
        // Extract unique shops and products for filters
        const uniqueShops = Array.from(new Set(data?.map(entry => entry.shops?.name) || []))
          .filter(Boolean)
          .map(name => ({
            name,
            id: data?.find(entry => entry.shops?.name === name)?.shops?.id
          }));
        
        const uniqueProducts = Array.from(new Set(data?.map(entry => entry.products?.name) || []))
          .filter(Boolean)
          .map(name => ({
            name,
            id: data?.find(entry => entry.products?.name === name)?.products?.id
          }));
        
        setShops(uniqueShops);
        setProducts(uniqueProducts);

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
  
  // Handle sorting change
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Calculate summary metrics
  const summary = useMemo(() => {
    if (!stockEntries.length) return { totalSold: 0, totalSales: 0, totalProfit: 0 };
    
    return stockEntries.reduce((acc, entry) => {
      const sold = entry.opening_stock - entry.closing_stock;
      const sales = sold * Number(entry.products?.price || 0);
      const profit = calculateProfit(entry);
      
      return {
        totalSold: acc.totalSold + sold,
        totalSales: acc.totalSales + sales,
        totalProfit: acc.totalProfit + profit
      };
    }, { totalSold: 0, totalSales: 0, totalProfit: 0 });
  }, [stockEntries]);
  
  // Apply filters and search to stock entries
  const filteredEntries = useMemo(() => {
    return stockEntries
      .filter(entry => {
        // Search term filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
          entry.products?.name?.toLowerCase().includes(searchLower) ||
          entry.shops?.name?.toLowerCase().includes(searchLower) ||
          entry.operator_name?.toLowerCase().includes(searchLower);
          
        // Shop filter
        const matchesShop = !shopFilter || entry.shops?.id === shopFilter;
        
        // Product filter
        const matchesProduct = !productFilter || entry.products?.id === productFilter;
        
        return matchesSearch && matchesShop && matchesProduct;
      })
      .sort((a, b) => {
        // Handle sorting
        if (sortField === "stock_date") {
          return sortDirection === "asc" 
            ? new Date(a.stock_date).getTime() - new Date(b.stock_date).getTime()
            : new Date(b.stock_date).getTime() - new Date(a.stock_date).getTime();
        }
        
        if (sortField === "units_sold") {
          const soldA = a.opening_stock - a.closing_stock;
          const soldB = b.opening_stock - b.closing_stock;
          return sortDirection === "asc" ? soldA - soldB : soldB - soldA;
        }
        
        if (sortField === "sales_amount") {
          const salesA = (a.opening_stock - a.closing_stock) * Number(a.products?.price || 0);
          const salesB = (b.opening_stock - b.closing_stock) * Number(b.products?.price || 0);
          return sortDirection === "asc" ? salesA - salesB : salesB - salesA;
        }
        
        if (sortField === "profit") {
          const profitA = calculateProfit(a);
          const profitB = calculateProfit(b);
          return sortDirection === "asc" ? profitA - profitB : profitB - profitA;
        }
        
        return 0;
      });
  }, [stockEntries, searchTerm, shopFilter, productFilter, sortField, sortDirection]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Entries</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            <p className="text-muted-foreground">Loading stock data...</p>
          </div>
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
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <div className="text-center max-w-md mx-auto py-12">
            <div className="rounded-full bg-muted flex items-center justify-center w-12 h-12 mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Stock Entries Found</h3>
            <p className="text-muted-foreground mb-6">
              Please add some stock data or import from Excel to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Units Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSold.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-2xl font-bold">
              <IndianRupee className="h-5 w-5 mr-1" />
              {summary.totalSales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${summary.totalProfit >= 0 ? 'from-green-50' : 'from-red-50'} to-white`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <IndianRupee className="h-5 w-5 mr-1" />
              {Math.abs(summary.totalProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4">
          <CardTitle>Stock Entries</CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stocks..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <div className="p-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Shop</p>
                    <Select value={shopFilter} onValueChange={setShopFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Shops" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Shops</SelectItem>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Product</p>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Products</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center cursor-pointer" onClick={() => handleSortChange("stock_date")}>
                      Date
                      {sortField === "stock_date" && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Opening Stock</TableHead>
                  <TableHead className="text-right">Closing Stock</TableHead>
                  <TableHead className="text-right">Actual Stock</TableHead>
                  <TableHead>Shift / Operator</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("units_sold")}>
                      Units Sold
                      {sortField === "units_sold" && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("sales_amount")}>
                      Sales Amount
                      {sortField === "sales_amount" && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("profit")}>
                      Profit/Loss
                      {sortField === "profit" && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const sold = entry.opening_stock - entry.closing_stock;
                  const salesAmount = sold * Number(entry.products?.price || 0);
                  const profit = calculateProfit(entry);

                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
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
                      <TableCell className="text-right font-medium">{sold}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <IndianRupee className="h-3.5 w-3.5 mr-1" />
                          {salesAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <div className="flex items-center justify-end">
                          <IndianRupee className="h-3.5 w-3.5 mr-1" />
                          {profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredEntries.length} of {stockEntries.length} entries
            {(searchTerm || shopFilter || productFilter) && " (filtered)"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockList;
