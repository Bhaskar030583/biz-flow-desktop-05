
import React, { useState } from "react";
import { ProductForm } from "@/components/product/ProductForm";
import { ProductList } from "@/components/product/ProductList";
import { useAuth } from "@/context/AuthContext";
import { useDataSync } from "@/context/DataSyncContext";

const Products = () => {
  const { user } = useAuth();
  const { refreshTrigger } = useDataSync();
  const [refreshList, setRefreshList] = useState(0);

  if (!user) {
    return null;
  }

  const handleProductSuccess = () => {
    setRefreshList(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <ProductForm onSuccess={handleProductSuccess} />
        </div>
        <div className="lg:col-span-2">
          <ProductList key={`${refreshList}-${refreshTrigger}`} />
        </div>
      </div>
    </div>
  );
};

export default Products;
