
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LossFilters, LossType } from "./loss-tracking/LossFilters";
import { LossSummaryCards } from "./loss-tracking/LossSummaryCards";
import { LossRecordsTable } from "./loss-tracking/LossRecordsTable";
import { LossFormModal } from "./loss-tracking/LossFormModal";
import { useLossTracking } from "./loss-tracking/useLossTracking";

const LossTracking = () => {
  const [isAddingLoss, setIsAddingLoss] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterShop, setFilterShop] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [filterLossType, setFilterLossType] = useState<LossType | "">("");

  const {
    stores,
    products,
    shifts,
    losses,
    isLoading,
    addLossMutation
  } = useLossTracking(selectedDate, filterShop, filterProduct, filterLossType);

  const handleAddLoss = (data: any) => {
    addLossMutation.mutate(data, {
      onSuccess: () => {
        setIsAddingLoss(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Loss Tracking</h2>
        <Button onClick={() => setIsAddingLoss(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Record Loss
        </Button>
      </div>

      <LossFilters
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        filterShop={filterShop}
        setFilterShop={setFilterShop}
        filterProduct={filterProduct}
        setFilterProduct={setFilterProduct}
        filterLossType={filterLossType}
        setFilterLossType={setFilterLossType}
        stores={stores}
        products={products}
      />

      <LossSummaryCards
        losses={losses}
        products={products}
        stores={stores}
      />

      <LossRecordsTable
        losses={losses}
        isLoading={isLoading}
        selectedDate={selectedDate}
      />

      <LossFormModal
        isOpen={isAddingLoss}
        onClose={() => setIsAddingLoss(false)}
        onSubmit={handleAddLoss}
        isSubmitting={addLossMutation.isPending}
        stores={stores}
        products={products}
        shifts={shifts}
      />
    </div>
  );
};

export default LossTracking;
