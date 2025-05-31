
import React, { useState } from "react";
import { ProductForm } from "@/components/product/ProductForm";
import { ProductList } from "@/components/product/ProductList";
import ProductCleanup from "@/components/product/ProductCleanup";
import ProductCleanupTool from "@/components/product/ProductCleanupTool";
import { useAuth } from "@/context/AuthContext";
import { useDataSync } from "@/context/DataSyncContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage">Manage Products</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup Tool</TabsTrigger>
          <TabsTrigger value="delete">Delete Tool</TabsTrigger>
          <TabsTrigger value="add">Add Product</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-6">
          <ProductList key={`${refreshList}-${refreshTrigger}`} />
        </TabsContent>
        
        <TabsContent value="cleanup" className="space-y-6">
          <ProductCleanup />
        </TabsContent>
        
        <TabsContent value="delete" className="space-y-6">
          <ProductCleanupTool />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-6">
          <div className="max-w-md">
            <ProductForm onSuccess={handleProductSuccess} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Products;
