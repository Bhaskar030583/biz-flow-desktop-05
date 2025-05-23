
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search } from "lucide-react";

// Import our components
import StockSummaryCards from "./StockSummaryCards";
import StockFilters from "./StockFilters";
import StockTable from "./StockTable";
import StockSummaryCardsSkeleton from "./StockSummaryCardsSkeleton";
import StockTableSkeleton from "./StockTableSkeleton";
import { calculateStockProfit, calculateStockSummary, sortStockEntries, filterStockEntries } from "./stockUtils";

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
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

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
        // Add a small delay to show the skeleton for better UX
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    fetchStockEntries();
  }, [refreshTrigger, localRefreshTrigger]);
  
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

  // Handle entry update
  const handleEntryUpdated = () => {
    setLocalRefreshTrigger(prev => prev + 1);
  };
  
  // Apply filters and sorting
  const filteredEntries = filterStockEntries(stockEntries, searchTerm, shopFilter, productFilter);
  const sortedFilteredEntries = sortStockEntries(filteredEntries, sortField, sortDirection);
  
  // Calculate summary metrics
  const summary = calculateStockSummary(filteredEntries);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <StockSummaryCardsSkeleton />
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4">
            <CardTitle>Stock Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <StockTableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stockEntries.length === 0) {
    return (
      <Card className="animate-fade-in">
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
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <StockSummaryCards summary={summary} />
      
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4">
          <CardTitle>Stock Entries</CardTitle>
          
          <StockFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            shopFilter={shopFilter}
            setShopFilter={setShopFilter}
            productFilter={productFilter}
            setProductFilter={setProductFilter}
            shops={shops}
            products={products}
          />
        </CardHeader>
        <CardContent>
          <StockTable 
            entries={sortedFilteredEntries}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSortChange={handleSortChange}
            calculateProfit={calculateStockProfit}
            onEntryUpdated={handleEntryUpdated}
          />
          
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {sortedFilteredEntries.length} of {stockEntries.length} entries
            {(searchTerm || shopFilter || productFilter) && " (filtered)"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockList;
