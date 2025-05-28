
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Import our components
import ProductStockTable from "./ProductStockTable";
import StockFilters from "./StockFilters";
import StockSummaryCardsSkeleton from "./StockSummaryCardsSkeleton";
import StockTableSkeleton from "./StockTableSkeleton";

interface StockListProps {
  refreshTrigger: number;
}

interface AssignedProduct {
  assignment_id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  opening_stock?: number;
  stock_added?: number;
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
  shop_name?: string;
  shop_id?: string;
}

const StockList = ({ refreshTrigger }: StockListProps) => {
  const { user } = useAuth();
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shopFilter, setShopFilter] = useState("_all");
  const [productFilter, setProductFilter] = useState("_all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("_all");
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchAssignedProducts = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('=== FETCHING ASSIGNED PRODUCTS FOR STOCK LIST ===');
        
        // Get assigned products with their latest stock data
        const { data: assignedProductsData, error } = await supabase
          .from('product_shops')
          .select(`
            id,
            products!inner (
              id,
              name,
              category,
              price,
              cost_price
            ),
            hr_stores!inner (
              id,
              store_name
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching assigned products:', error);
          throw error;
        }

        console.log('Assigned products data:', assignedProductsData);

        if (!assignedProductsData || assignedProductsData.length === 0) {
          console.log('No assigned products found');
          setAssignedProducts([]);
          setShops([]);
          setProducts([]);
          toast.info('No products assigned to stores found');
          return;
        }

        // Get today's date for stock data
        const today = new Date().toISOString().split('T')[0];
        
        // Transform data and get stock information
        const transformedProducts: AssignedProduct[] = [];
        
        for (const assignment of assignedProductsData) {
          const product = assignment.products;
          const shop = assignment.hr_stores;
          
          // Get latest stock data for this product and shop
          const { data: stockData, error: stockError } = await supabase
            .from('stocks')
            .select('*')
            .eq('product_id', product.id)
            .eq('shop_id', shop.id)
            .eq('user_id', user.id)
            .order('stock_date', { ascending: false })
            .limit(1);

          if (stockError) {
            console.error('Error fetching stock data:', stockError);
          }

          const latestStock = stockData?.[0];
          const soldQuantity = latestStock ? 
            (latestStock.opening_stock + (latestStock.stock_added || 0)) - latestStock.actual_stock : 0;

          transformedProducts.push({
            assignment_id: assignment.id,
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            cost_price: product.cost_price,
            opening_stock: latestStock?.opening_stock || 0,
            stock_added: latestStock?.stock_added || 0,
            closing_stock: latestStock?.closing_stock || 0,
            actual_stock: latestStock?.actual_stock || 0,
            last_stock_date: latestStock?.stock_date || null,
            sold_quantity: Math.max(0, soldQuantity),
            shop_name: shop.store_name,
            shop_id: shop.id
          });
        }

        console.log('Transformed products:', transformedProducts);
        setAssignedProducts(transformedProducts);
        
        // Extract unique shops and products for filters
        const uniqueShops = Array.from(new Set(transformedProducts.map(p => p.shop_name)))
          .filter(Boolean)
          .map(name => ({
            name,
            id: transformedProducts.find(p => p.shop_name === name)?.shop_id
          }));
        
        const uniqueProducts = Array.from(new Set(transformedProducts.map(p => p.name)))
          .filter(Boolean)
          .map(name => ({
            name,
            id: transformedProducts.find(p => p.name === name)?.id
          }));
        
        setShops(uniqueShops);
        setProducts(uniqueProducts);

        toast.success(`Loaded ${transformedProducts.length} assigned products`);

      } catch (error: any) {
        console.error("Error fetching assigned products:", error.message);
        toast.error("Failed to load assigned products data");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    fetchAssignedProducts();
  }, [refreshTrigger, localRefreshTrigger, user?.id]);

  // Handle entry update
  const handleEntryUpdated = () => {
    setLocalRefreshTrigger(prev => prev + 1);
  };

  // Apply filters
  const filteredProducts = assignedProducts.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.shop_name && product.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesShop = shopFilter === "_all" || product.shop_name === shopFilter;
    const matchesProduct = productFilter === "_all" || product.name === productFilter;
    
    return matchesSearch && matchesShop && matchesProduct;
  });

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

  if (assignedProducts.length === 0) {
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
              No products have been assigned to stores. Please assign products to stores to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4">
          <CardTitle>Assigned Products Stock ({assignedProducts.length} products)</CardTitle>
          
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
          <ProductStockTable 
            filteredProducts={filteredProducts}
            isAdmin={false}
            addStockQuantities={{}}
            setAddStockQuantities={() => {}}
            updatingStock={{}}
            onAddStock={() => {}}
            onEditStock={() => {}}
            onRemoveProduct={() => {}}
            onDeleteStock={() => {}}
          />
          
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredProducts.length} of {assignedProducts.length} assigned products
            {(searchTerm || shopFilter !== "_all" || productFilter !== "_all") && " (filtered)"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockList;
