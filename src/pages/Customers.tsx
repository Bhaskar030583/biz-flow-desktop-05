
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { CustomerManagement } from "@/components/pos/CustomerManagement";

const Customers = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <CustomerManagement />
      </div>
    </DashboardLayout>
  );
};

export default Customers;
