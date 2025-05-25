
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BillEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  onBillUpdated: () => void;
}

export const BillEditModal: React.FC<BillEditModalProps> = ({
  isOpen,
  onClose,
  billId,
  onBillUpdated
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && billId) {
      fetchBillData();
    }
  }, [isOpen, billId]);

  const fetchBillData = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (error) throw error;

      setBillData(data);
      setPaymentMethod(data.payment_method);
      setPaymentStatus(data.payment_status);
    } catch (error) {
      console.error("Error fetching bill data:", error);
      toast.error("Failed to load bill data");
    }
  };

  const handleSave = async () => {
    if (!billData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bills')
        .update({
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', billId);

      if (error) throw error;

      toast.success("Bill updated successfully");
      onBillUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error("Failed to update bill");
    } finally {
      setLoading(false);
    }
  };

  if (!billData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Bill</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg">{billData.bill_number}</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ₹{Number(billData.total_amount).toFixed(2)}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
