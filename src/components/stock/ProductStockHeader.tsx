
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package2, Store, Search, Plus } from "lucide-react";

interface Shop {
  id: string;
  name: string;
}

interface ProductStockHeaderProps {
  assignedProductsCount: number;
  isAdmin: boolean;
  selectedShop: string;
  setSelectedShop: (shopId: string) => void;
  shops: Shop[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showAssignForm: boolean;
  setShowAssignForm: (show: boolean) => void;
}

const ProductStockHeader = ({
  assignedProductsCount,
  isAdmin,
  selectedShop,
  setSelectedShop,
  shops,
  searchTerm,
  setSearchTerm,
  showAssignForm,
  setShowAssignForm,
}: ProductStockHeaderProps) => {
  return (
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
        <Package2 className="h-5 w-5" />
        Store Product Management
        {selectedShop && assignedProductsCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {assignedProductsCount} assigned products
          </Badge>
        )}
        {isAdmin && (
          <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
            Admin
          </Badge>
        )}
      </CardTitle>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shop-filter" className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Store className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              Select Store
            </Label>
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-slate-100 shadow-sm hover:border-slate-500 dark:hover:border-slate-400">
                <SelectValue placeholder="Select a store to manage products" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-lg z-50">
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id} className="text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">
                    {shop.name}
                  </SelectItem>
                ))}
                {shops.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400">
                    No stores available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" />
              Search Products
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Search assigned products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {!selectedShop && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Store className="h-4 w-4" />
              <span className="text-sm font-medium">Please select a store first to manage products</span>
            </div>
          </div>
        )}

        {selectedShop && (
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">
              Products assigned to {shops.find(shop => shop.id === selectedShop)?.name}
            </h3>
            <Button
              onClick={() => setShowAssignForm(!showAssignForm)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Assign Product
            </Button>
          </div>
        )}
      </div>
    </CardHeader>
  );
};

export default ProductStockHeader;
