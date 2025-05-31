
import React from "react";
import { AutoDebitManagement } from "@/components/auto-debit/AutoDebitManagement";

const AutoDebit = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Auto Debit Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage automatic payment collection using Razorpay
        </p>
      </div>
      <AutoDebitManagement />
    </div>
  );
};

export default AutoDebit;
