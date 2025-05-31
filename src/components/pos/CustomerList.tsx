
import React, { useState } from "react";
import { CustomerSelector } from "@/components/shared/CustomerSelector";
import { CustomerActions } from "@/components/shared/CustomerActions";

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

interface CustomerListProps {
  refreshTrigger: number;
}

export const CustomerList: React.FC<CustomerListProps> = ({ refreshTrigger }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCustomerSelect = (customer: Customer) => {
    // For the customer management page, we might not need selection behavior
    // This could be used for highlighting or other UI feedback
    console.log("Customer selected:", customer.name);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <CustomerSelector
        onCustomerSelect={handleCustomerSelect}
        showTitle={true}
        compact={false}
        refreshTrigger={refreshTrigger + refreshKey}
      />
    </div>
  );
};
