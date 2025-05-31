
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { CustomerDetails } from "../pos/CustomerDetails";

interface CustomerDetailsSheetProps {
  customerId: string;
  customerName: string;
}

export const CustomerDetailsSheet: React.FC<CustomerDetailsSheetProps> = ({ 
  customerId, 
  customerName 
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1 text-blue-600 hover:bg-blue-50"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">View</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Customer Details</SheetTitle>
          <SheetDescription>
            View details for {customerName}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          <CustomerDetails 
            customerId={customerId} 
            onBack={() => {}} 
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
