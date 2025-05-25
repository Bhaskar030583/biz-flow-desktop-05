
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Download, Calendar, User, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface BillItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface BillDetails {
  id: string;
  bill_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  bill_date: string;
  customers?: {
    name: string;
    phone?: string;
    email?: string;
  } | null;
  bill_items: BillItem[];
}

interface BillViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillDetails | null;
  onDownload: () => void;
}

export const BillViewModal: React.FC<BillViewModalProps> = ({
  isOpen,
  onClose,
  bill,
  onDownload
}) => {
  if (!bill) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'credit': return '📋';
      default: return '💰';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bill Details</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bill Header */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {bill.bill_number}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(bill.bill_date), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <Badge className={getStatusColor(bill.payment_status)}>
                {bill.payment_status}
              </Badge>
            </div>

            {/* Customer Info */}
            {bill.customers && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{bill.customers.name}</p>
                    {bill.customers.phone && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {bill.customers.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>{getPaymentMethodIcon(bill.payment_method)}</span>
                <span className="text-sm capitalize">{bill.payment_method}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ₹{Number(bill.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Bill Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Items</h3>
            <div className="space-y-2">
              {bill.bill_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ₹{Number(item.unit_price).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{Number(item.total_price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-green-600">
                ₹{Number(bill.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
