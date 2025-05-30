
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type LossType = "theft" | "damage" | "expiry" | "spillage" | "breakage" | "other";

interface Store {
  id: string;
  store_name: string;
}

interface Product {
  id: string;
  name: string;
}

interface LossFiltersProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  filterShop: string;
  setFilterShop: (shopId: string) => void;
  filterProduct: string;
  setFilterProduct: (productId: string) => void;
  filterLossType: LossType | "";
  setFilterLossType: (lossType: LossType | "") => void;
  stores?: Store[];
  products?: Product[];
}

export const LossFilters: React.FC<LossFiltersProps> = ({
  selectedDate,
  setSelectedDate,
  filterShop,
  setFilterShop,
  filterProduct,
  setFilterProduct,
  filterLossType,
  setFilterLossType,
  stores,
  products
}) => {
  const clearFilters = () => {
    setFilterShop("");
    setFilterProduct("");
    setFilterLossType("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Store</Label>
            <Select value={filterShop} onValueChange={setFilterShop}>
              <SelectTrigger>
                <SelectValue placeholder="All stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All stores</SelectItem>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Product</Label>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger>
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All products</SelectItem>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Loss Type</Label>
            <Select value={filterLossType} onValueChange={setFilterLossType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="theft">Theft</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="expiry">Expiry</SelectItem>
                <SelectItem value="spillage">Spillage</SelectItem>
                <SelectItem value="breakage">Breakage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
