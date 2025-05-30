
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LossType } from "./LossFilters";

interface Store {
  id: string;
  store_name: string;
}

interface Product {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  shift_name: string;
}

interface LossFormData {
  product_id: string;
  hr_shop_id: string;
  shift_id: string;
  loss_type: LossType;
  quantity_lost: number;
  reason: string | null;
  operator_name: string | null;
}

interface LossFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LossFormData) => void;
  isSubmitting: boolean;
  stores?: Store[];
  products?: Product[];
  shifts?: Shift[];
}

export const LossFormModal: React.FC<LossFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  stores,
  products,
  shifts
}) => {
  const isValidLossType = (value: string): value is LossType => {
    const validLossTypes: LossType[] = ["theft", "damage", "expiry", "spillage", "breakage", "other"];
    return validLossTypes.includes(value as LossType);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const lossTypeValue = formData.get('loss_type') as string;
    
    if (!isValidLossType(lossTypeValue)) {
      return;
    }
    
    const data: LossFormData = {
      product_id: formData.get('product_id') as string,
      hr_shop_id: formData.get('hr_shop_id') as string,
      shift_id: formData.get('shift_id') as string,
      loss_type: lossTypeValue as LossType,
      quantity_lost: parseInt(formData.get('quantity_lost') as string),
      reason: formData.get('reason') as string || null,
      operator_name: formData.get('operator_name') as string || null,
    };

    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Record Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="product_id">Product *</Label>
              <Select name="product_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hr_shop_id">Store *</Label>
              <Select name="hr_shop_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shift_id">Shift</Label>
              <Select name="shift_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts?.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.shift_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="loss_type">Loss Type *</Label>
              <Select name="loss_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select loss type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="expiry">Expiry</SelectItem>
                  <SelectItem value="spillage">Spillage</SelectItem>
                  <SelectItem value="breakage">Breakage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity_lost">Quantity Lost *</Label>
              <Input
                id="quantity_lost"
                name="quantity_lost"
                type="number"
                min="1"
                required
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <Label htmlFor="operator_name">Operator Name</Label>
              <Input
                id="operator_name"
                name="operator_name"
                placeholder="Who reported this loss?"
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Describe the reason for the loss..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Recording..." : "Record Loss"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
