
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ShopForm } from "@/components/shop/ShopForm";
import { ShopList } from "@/components/shop/ShopList";
import { useAuth } from "@/context/AuthContext";
import { useDataSync } from "@/context/DataSyncContext";

const Shops = () => {
  const { user } = useAuth();
  const { refreshTrigger } = useDataSync();
  const [refreshList, setRefreshList] = useState(0);

  if (!user) {
    return null;
  }

  const handleShopSuccess = () => {
    setRefreshList(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Shops</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <ShopForm onSuccess={handleShopSuccess} />
          </div>
          <div className="lg:col-span-2">
            <ShopList key={`${refreshList}-${refreshTrigger}`} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Shops;
