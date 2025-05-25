
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BillHistory } from "@/components/pos/BillHistory";

const Bills = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <BillHistory />
      </div>
    </DashboardLayout>
  );
};

export default Bills;
