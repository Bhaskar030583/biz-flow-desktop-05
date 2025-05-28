
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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

interface AssignedProductStock {
  id: string;
  stock_date: string;
  opening_stock: number;
  closing_stock: number;
  actual_stock: number;
  stock_added?: number;
  shift?: string;
  operator_name?: string;
  cash_received?: number;
  online_received?: number;
  shops: { id: string; name: string };
  products: { id: string; name: string; price: number; cost_price: number | null };
}

const StockList = ({ refreshTrigger }: StockListProps) => {
  const { user } = useAuth();
  const [stockEntries, setStockEntries] = useState<AssignedProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shopFilter, setShopFilter] = useState("_all");
  const [productFilter, setProductFilter] = useState("_all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("_all");
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>("stock_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchAssignedProductsStock = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('=== FETCHING ASSIGNED PRODUCTS STOCK ===');
        
        // First, get all HR stores for the shops filter
        const { data: hrStores, error: hrStoresError } = await supabase
          .from('hr_stores')
          .select('id, store_name, store_code')
          .order('store_name');

        if (hrStoresError) {
          console.error('Error fetching HR stores:', hrStoresError);
        }

        // Get user's shops for fallback
        const { data: userShops, error: userShopsError } = await supabase
          .from('shops')
          .select('id, name')
          .eq('user_id', user.id);

        if (userShopsError) {
          console.error('Error fetching user shops:', userShopsError);
        }

        // Try to get assigned products with their latest stock data
        // First approach: Use HR stores directly
        let stockData: AssignedProductStock[] = [];
        
        if (hrStores && hrStores.length > 0) {
          for (const hrStore of hrStores) {
            const { data: storeStockData, error: stockError } = await supabase
              .from('stocks')
              .select(`
                id,
                stock_date,
                opening_stock,
                closing_stock,
                actual_stock,
                stock_added,
                shift,
                operator_name,
                cash_received,
                online_received,
                products!inner (id, name, price, cost_price)
              `)
              .eq('shop_id', hrStore.id)
              .eq('user_id', user.id)
              .order('stock_date', { ascending: false });

            if (!stockError && storeStockData && storeStockData.length > 0) {
              const transformedData = storeStockData.map(stock => ({
                ...stock,
                shops: { id: hrStore.id, name: hrStore.store_name }
              }));
              stockData.push(...transformedData);
            }
          }
        }

        // Fallback: Use user shops if no HR store data found
        if (stockData.length === 0 && userShops && userShops.length > 0) {
          console.log('No HR store data found, trying user shops...');
          
          for (const userShop of userShops) {
            const { data: storeStockData, error: stockError } = await supabase
              .from('stocks')
              .select(`
                id,
                stock_date,
                opening_stock,
                closing_stock,
                actual_stock,
                stock_added,
                shift,
                operator_name,
                cash_received,
                online_received,
                products!inner (id, name, price, cost_price)
              `)
              .eq('shop_id', userShop.id)
              .eq('user_id', user.id)
              .order('stock_date', { ascending: false });

            if (!stockError && storeStockData && storeStockData.length > 0) {
              const transformedData = storeStockData.map(stock => ({
                ...stock,
                shops: { id: userShop.id, name: userShop.name }
              }));
              stockData.push(...transformedData);
            }
          }
        }

        console.log('Final stock data:', stockData);
        setStockEntries(stockData);
        
        // Extract unique shops and products for filters
        const uniqueShops = Array.from(new Set(stockData.map(entry => entry.shops?.name)))
          .filter(Boolean)
          .map(name => ({
            name,
            id: stockData.find(entry => entry.shops?.name === name)?.shops?.id
          }));
        
        const uniqueProducts = Array.from(new Set(stockData.map(entry => entry.products?.name)))
          .filter(Boolean)
          .map(name => ({
            name,
            id: stockData.find(entry => entry.products?.name === name)?.products?.id
          }));
        
        setShops(uniqueShops);
        setProducts(uniqueProducts);

        if (stockData.length === 0) {
          toast.info('No assigned products with stock data found');
        } else {
          toast.success(`Loaded ${stockData.length} stock entries for assigned products`);
        }

      } catch (error: any) {
        console.error("Error fetching assigned products stock:", error.message);
        toast.error("Failed to load assigned products stock data");
      } finally {
        // Add a small delay to show the skeleton for better UX
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    fetchAssignedProductsStock();
  }, [refreshTrigger, localRefreshTrigger, user?.id]);
  
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
  const filteredEntries = filterStockEntries(stockEntries, searchTerm, shopFilter === "_all" ? "" : shopFilter, productFilter === "_all" ? "" : productFilter).filter(entry => {
    if (paymentModeFilter === "" || paymentModeFilter === "_all") return true;
    if (paymentModeFilter === "cash") return (entry.cash_received || 0) > 0;
    if (paymentModeFilter === "online") return (entry.online_received || 0) > 0;
    return true;
  });
  
  const sortedFilteredEntries = sortStockEntries(filteredEntries, sortField, sortDirection);
  
  // Calculate summary metrics
  const summary = calculateStockSummary(filteredEntries);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <StockSummaryCardsSkeleton />
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4">
            <CardTitle>Assigned Products Stock</CardTitle>
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
          <CardTitle>Assigned Products Stock</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <div className="text-center max-w-md mx-auto py-12">
            <div className="rounded-full bg-muted flex items-center justify-center w-12 h-12 mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Assigned Products Found</h3>
            <p className="text-muted-foreground mb-6">
              No products have been assigned to stores or no stock data exists. Please assign products to stores and add stock data to get started.
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
          <CardTitle>Assigned Products Stock</CardTitle>
          
          <StockFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            shopFilter={shopFilter || "_all"}
            setShopFilter={setShopFilter}
            productFilter={productFilter || "_all"}
            setProductFilter={setProductFilter}
            shops={shops}
            products={products}
            paymentModeFilter={paymentModeFilter || "_all"}
            setPaymentModeFilter={setPaymentModeFilter}
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
            Showing {sortedFilteredEntries.length} of {stockEntries.length} assigned product stock entries
            {(searchTerm || shopFilter !== "" && shopFilter !== "_all" || productFilter !== "" && productFilter !== "_all" || (paymentModeFilter && paymentModeFilter !== "" && paymentModeFilter !== "_all")) && " (filtered)"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockList;
