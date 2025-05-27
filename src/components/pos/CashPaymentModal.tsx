
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Banknote, Calculator } from "lucide-react";
import { generateBill } from "@/services/billService";
import { toast } from "sonner";

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentComplete: () => void;
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  storeInfo?: {
    storeName: string;
    salespersonName: string;
  } | null;
}

interface Denominations {
  [key: number]: number;
}

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentComplete,
  cartItems,
  storeInfo
}) => {
  const [cashReceived, setCashReceived] = useState("");
  const [processing, setProcessing] = useState(false);
  const [useDenominations, setUseDenominations] = useState(false);
  const [denominations, setDenominations] = useState<Denominations>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0
  });

  const denominationValues = [500, 200, 100, 50, 20, 10, 5, 2, 1];

  const calculateTotalFromDenominations = () => {
    return denominationValues.reduce((total, value) => {
      return total + (value * (denominations[value] || 0));
    }, 0);
  };

  const calculateChangeDenominations = (changeAmount: number) => {
    const changeDenominations: Denominations = {
      500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
    };
    
    let remainingAmount = Math.round(changeAmount);
    
    for (const value of denominationValues) {
      if (remainingAmount >= value) {
        changeDenominations[value] = Math.floor(remainingAmount / value);
        remainingAmount = remainingAmount % value;
      }
    }
    
    return changeDenominations;
  };

  const handleDenominationChange = (value: number, count: string) => {
    const numCount = parseInt(count) || 0;
    setDenominations(prev => ({
      ...prev,
      [value]: numCount
    }));
    
    // Update total cash received
    const newDenominations = { ...denominations, [value]: numCount };
    const total = denominationValues.reduce((sum, val) => {
      return sum + (val * (newDenominations[val] || 0));
    }, 0);
    setCashReceived(total.toString());
  };

  const handleSwitchChange = (checked: boolean) => {
    setUseDenominations(checked);
    if (!checked) {
      // Reset denominations when switching off
      setDenominations({
        500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
      });
    } else {
      // Clear simple cash input when switching to denominations
      setCashReceived("");
    }
  };

  const cashAmount = useDenominations ? calculateTotalFromDenominations() : (parseFloat(cashReceived) || 0);
  const changeAmount = cashAmount - totalAmount;
  const changeDenominations = changeAmount > 0 ? calculateChangeDenominations(changeAmount) : {};

  const handlePayment = async () => {
    if (cashAmount < totalAmount) {
      toast.error("Cash received is less than total amount");
      return;
    }

    setProcessing(true);
    try {
      await generateBill({
        totalAmount,
        paymentMethod: 'cash',
        cartItems,
        storeName: storeInfo?.storeName,
        salespersonName: storeInfo?.salespersonName
      });

      let toastMessage = "Cash payment completed!";
      
      if (useDenominations) {
        // Create denomination summary for toast
        const denominationSummary = denominationValues
          .filter(value => denominations[value] > 0)
          .map(value => `₹${value} x ${denominations[value]}`)
          .join(', ');
        toastMessage += ` Denominations: ${denominationSummary}`;
      }

      toast.success(toastMessage);
      onPaymentComplete();
      setCashReceived("");
      setDenominations({
        500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
      });
    } catch (error) {
      console.error("Error processing cash payment:", error);
      toast.error("Failed to process cash payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCashReceived("");
    setDenominations({
      500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
    });
    setUseDenominations(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Cash Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount</Label>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>

          <Separator />

          {/* Denomination Toggle Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="denomination-mode"
              checked={useDenominations}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="denomination-mode" className="text-sm font-medium">
              Use denomination breakdown
            </Label>
          </div>

          <Separator />

          {useDenominations ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Received Section */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Cash Denominations Received</Label>
                <div className="grid grid-cols-3 gap-3">
                  {denominationValues.map(value => (
                    <div key={value} className="space-y-1">
                      <Label htmlFor={`denom-${value}`} className="text-sm font-medium">
                        ₹{value} notes
                      </Label>
                      <Input
                        id={`denom-${value}`}
                        type="number"
                        min="0"
                        value={denominations[value]}
                        onChange={(e) => handleDenominationChange(value, e.target.value)}
                        placeholder="0"
                        className="text-center"
                      />
                      <div className="text-xs text-gray-500 text-center">
                        = ₹{(value * (denominations[value] || 0)).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="total-cash">Total Cash Received</Label>
                  <div className="text-xl font-bold text-blue-600">
                    ₹{calculateTotalFromDenominations().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Change to Return Section */}
              {changeAmount > 0 && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Change to Return</Label>
                  <div className="text-xl font-bold text-blue-600 mb-3">
                    ₹{changeAmount.toFixed(2)}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Denomination Breakdown:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {denominationValues.map(value => {
                        const count = changeDenominations[value] || 0;
                        if (count === 0) return null;
                        
                        return (
                          <div key={value} className="bg-gray-50 p-2 rounded border text-center">
                            <div className="text-sm font-medium">₹{value}</div>
                            <div className="text-lg font-bold text-blue-600">{count}</div>
                            <div className="text-xs text-gray-500">
                              = ₹{(value * count).toFixed(0)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {changeAmount < 0 && cashAmount > 0 && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-red-600">Insufficient Cash</Label>
                  <div className="text-xl font-bold text-red-600">
                    Short by: ₹{Math.abs(changeAmount).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Simple Cash Input Mode */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cash-received">Cash Received</Label>
                <Input
                  id="cash-received"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Enter cash amount"
                  className="text-lg"
                />
              </div>

              {changeAmount > 0 && (
                <div className="space-y-2">
                  <Label>Change to Return</Label>
                  <div className="text-xl font-bold text-blue-600">
                    ₹{changeAmount.toFixed(2)}
                  </div>
                </div>
              )}

              {changeAmount < 0 && cashAmount > 0 && (
                <div className="space-y-2">
                  <Label className="text-red-600">Insufficient Cash</Label>
                  <div className="text-xl font-bold text-red-600">
                    Short by: ₹{Math.abs(changeAmount).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={cashAmount < totalAmount || processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {processing ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
