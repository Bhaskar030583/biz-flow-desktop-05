
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, X } from "lucide-react";
import { CustomerSelector } from "@/components/shared/CustomerSelector";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
  credit_limit: number;
  total_credit?: number;
  available_credit?: number;
}

interface POSCustomerSelectorProps {
  selectedCustomer?: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
}

export const POSCustomerSelector: React.FC<POSCustomerSelectorProps> = ({
  selectedCustomer,
  onCustomerSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setIsOpen(false);
  };

  const handleClearCustomer = () => {
    onCustomerSelect(null);
  };

  return (
    <div className="flex items-center gap-2">
      {selectedCustomer ? (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <div className="flex-1">
            <p className="font-medium text-sm">{selectedCustomer.name}</p>
            <p className="text-xs text-gray-600">{selectedCustomer.phone}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearCustomer}
            className="h-6 w-6 p-0 hover:bg-red-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Select Customer</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto">
              <CustomerSelector
                onCustomerSelect={handleCustomerSelect}
                showTitle={false}
                compact={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
