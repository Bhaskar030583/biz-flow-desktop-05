
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
