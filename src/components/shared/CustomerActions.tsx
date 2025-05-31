
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CustomerDetailsSheet } from "./CustomerDetailsSheet";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
}

interface CustomerActionsProps {
  customer: Customer;
  onRefresh?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  compact?: boolean;
}

export const CustomerActions: React.FC<CustomerActionsProps> = ({
  customer,
  onRefresh,
  showEdit = true,
  showDelete = true,
  showView = true,
  compact = false
}) => {
  const { userRole } = useAuth();

  const handleDeleteCustomer = async () => {
    if (userRole !== "admin") {
      toast.error("Only administrators can delete customers");
      return;
    }

    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (error) throw error;

      toast.success("Customer deleted successfully");
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  return (
    <div className="flex gap-2">
      {showView && (
        <CustomerDetailsSheet 
          customerId={customer.id}
          customerName={customer.name}
        />
      )}
      
      {showEdit && (
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1 text-green-600 hover:bg-green-50"
          title="Edit customer"
        >
          <Edit className="h-4 w-4" />
          {!compact && <span className="hidden sm:inline">Edit</span>}
        </Button>
      )}
      
      {showDelete && userRole === "admin" && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleDeleteCustomer}
          className="flex items-center gap-1 text-red-600 hover:bg-red-50"
          title="Delete customer"
        >
          <Trash2 className="h-4 w-4" />
          {!compact && <span className="hidden sm:inline">Delete</span>}
        </Button>
      )}
    </div>
  );
};
