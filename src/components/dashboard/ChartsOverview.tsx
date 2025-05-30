
import React from "react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CollectionSummary } from "@/components/dashboard/CollectionSummary";

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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
      <div className="xl:col-span-3">
        <SalesChart 
          startDate={startDate}
          endDate={endDate}
          shopIds={selectedShops}
          categoryId={selectedCategory}
          productId={selectedProduct}
        />
      </div>
      <div className="xl:col-span-3 2xl:hidden">
        <CollectionSummary
          startDate={startDate}
          endDate={endDate}
          selectedShops={selectedShops}
        />
      </div>
    </div>
  );
};
