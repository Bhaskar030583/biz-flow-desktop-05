
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AutoDebitManagement } from "@/components/auto-debit/AutoDebitManagement";

const AutoDebit = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Auto Debit Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage automatic payment collection using Razorpay
          </p>
        </div>
        <AutoDebitManagement />
      </div>
    </DashboardLayout>
  );
};

export default AutoDebit;
