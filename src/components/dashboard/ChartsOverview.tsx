
import React from "react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import CollectionSummary from "@/components/dashboard/CollectionSummary";

interface ChartsOverviewProps {
  startDate: Date | null;
  endDate: Date | null;
  selectedShops: string[];
  selectedCategory: string | null;
  selectedProduct: string | null;
}

export const ChartsOverview: React.FC<ChartsOverviewProps> = ({
  startDate,
  endDate,
  selectedShops,
  selectedCategory,
  selectedProduct
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="lg:col-span-2">
        <SalesChart 
          startDate={startDate}
          endDate={endDate}
          shopIds={selectedShops}
          categoryId={selectedCategory}
          productId={selectedProduct}
        />
      </div>
      <div>
        <CollectionSummary
          startDate={startDate}
          endDate={endDate}
          shopIds={selectedShops}
        />
      </div>
    </div>
  );
};
