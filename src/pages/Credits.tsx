
import React from "react";
import CreditDetails from "@/components/credit/CreditDetails";

const Credits = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Credit Management</h1>
      </div>
      <CreditDetails />
    </div>
  );
};

export default Credits;
