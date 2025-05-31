
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import ProductStockTable from "./ProductStockTable";
import StockFilters from "./StockFilters";
import { AssignedProduct } from "./hooks/useAssignedProducts";

interface StockListContentProps {
  assignedProducts: AssignedProduct[];
  filteredProducts: AssignedProduct[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  shopFilter: string;
  setShopFilter: (filter: string) => void;
  productFilter: string;
  setProductFilter: (filter: string) => void;
  paymentModeFilter: string;
  setPaymentModeFilter: (filter: string) => void;
  shops: any[];
  products: any[];
}

const StockListContent = ({
  assignedProducts,
  filteredProducts,
  searchTerm,
  setSearchTerm,
  shopFilter,
  setShopFilter,
  productFilter,
  setProductFilter,
  paymentModeFilter,
  setPaymentModeFilter,
  shops,
  products
}: StockListContentProps) => {
  // Debug logging for product assignments
  React.useEffect(() => {
    if (assignedProducts.length > 0) {
      console.log('📊 [StockListContent] Product assignments debug:', {
        totalProducts: assignedProducts.length,
        sampleProducts: assignedProducts.slice(0, 3).map(p => ({
          name: p.name,
          actualStock: p.actual_stock,
          actualStockType: typeof p.actual_stock,
          openingStock: p.opening_stock,
          stockAdded: p.stock_added
        })),
        productsByStore: assignedProducts.reduce((acc, product) => {
          const storeName = product.shop_name || 'Unknown Store';
          if (!acc[storeName]) {
            acc[storeName] = [];
          }
          acc[storeName].push({
            name: product.name,
            productId: product.id,
            assignmentId: product.assignment_id,
            shopId: product.shop_id,
            actualStock: product.actual_stock
          });
          return acc;
        }, {} as Record<string, any[]>)
      });
    }
  }, [assignedProducts]);

  // Debug logging for filtered products
  React.useEffect(() => {
    if (filteredProducts.length > 0) {
      console.log('🔍 [StockListContent] Filtered products debug:', {
        totalFiltered: filteredProducts.length,
        sampleFiltered: filteredProducts.slice(0, 3).map(p => ({
          name: p.name,
          actualStock: p.actual_stock,
          actualStockType: typeof p.actual_stock
        }))
      });
    }
  }, [filteredProducts]);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-4">
        <CardTitle>
          Assigned Products Stock 
          {assignedProducts.length > 0 && ` (${assignedProducts.length} products)`}
        </CardTitle>
        
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
        {assignedProducts.length === 0 ? (
          <div className="text-center max-w-md mx-auto py-12">
            <div className="rounded-full bg-muted flex items-center justify-center w-12 h-12 mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Assigned Products Found</h3>
            <p className="text-muted-foreground mb-6">
              No products have been assigned to stores. Please assign products to stores to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Debug Information Panel */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📊 Assignment Debug Info
              </h4>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <div>Total Products Found: {assignedProducts.length}</div>
                <div>Filtered Products: {filteredProducts.length}</div>
                <div>Stores with Products: {[...new Set(assignedProducts.map(p => p.shop_name))].join(', ')}</div>
                {assignedProducts.length > 0 && (
                  <div>Sample Actual Stock Values: {assignedProducts.slice(0, 3).map(p => `${p.name}: ${p.actual_stock}`).join(', ')}</div>
                )}
                {shopFilter !== "_all" && (
                  <div>Filtered by Store: {shops.find(s => s.id === shopFilter)?.name || shopFilter}</div>
                )}
                {productFilter !== "_all" && (
                  <div>Filtered by Product: {products.find(p => p.id === productFilter)?.name || productFilter}</div>
                )}
              </div>
            </div>

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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StockListContent;
