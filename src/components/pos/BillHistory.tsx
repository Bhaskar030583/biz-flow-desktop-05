import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Receipt, 
  Search, 
  Calendar,
  User,
  CreditCard,
  Eye,
  Download,
  Filter,
  Edit,
  X,
  Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { BillViewModal } from "./BillViewModal";
import { BillEditModal } from "./BillEditModal";
import { getBillDetails } from "@/services/billService";
import { downloadBillAsPDF } from "@/utils/billDownloadUtils";

interface Bill {
  id: string;
  bill_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  bill_date: string;
  customer: {
    name: string;
  } | null;
}

export const BillHistory: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string>("");
  const [selectedBillDetails, setSelectedBillDetails] = useState<any>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const fetchBills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          id,
          bill_number,
          total_amount,
          payment_method,
          payment_status,
          bill_date,
          customers (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('bill_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedBills = (data || []).map(bill => ({
        ...bill,
        customer: bill.customers ? { name: bill.customers.name } : null
      }));
      
      setBills(transformedBills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to load bill history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [user]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'credit': return '📋';
      default: return '💰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewBill = async (billId: string) => {
    try {
      console.log("View bill:", billId);
      const billDetails = await getBillDetails(billId);
      setSelectedBillDetails(billDetails);
      setViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching bill details:", error);
      toast.error("Failed to load bill details");
    }
  };

  const handleEditBill = async (billId: string) => {
    try {
      console.log("Edit bill clicked for ID:", billId);
      
      if (!billId) {
        console.error("No bill ID provided");
        toast.error("Invalid bill ID");
        return;
      }

      // Set the selected bill ID and open the modal
      setSelectedBillId(billId);
      setEditModalOpen(true);
      console.log("Edit modal should be opening with bill ID:", billId);
    } catch (error) {
      console.error("Error opening edit modal:", error);
      toast.error("Failed to open edit modal");
    }
  };

  const handleDownloadBill = async (billId: string) => {
    try {
      console.log("Download bill:", billId);
      await downloadBillAsPDF(billId);
      toast.success("Bill downloaded successfully");
    } catch (error) {
      console.error("Error downloading bill:", error);
      toast.error("Failed to download bill");
    }
  };

  const handleCancelBill = async (billId: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ payment_status: 'cancelled' })
        .eq('id', billId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setBills(bills.map(bill => 
        bill.id === billId 
          ? { ...bill, payment_status: 'cancelled' }
          : bill
      ));

      toast.success("Bill cancelled successfully");
    } catch (error) {
      console.error("Error cancelling bill:", error);
      toast.error("Failed to cancel bill");
    }
  };

  const handleClearAllBills = async () => {
    if (!user) return;

    const confirmClear = window.confirm(
      "Are you sure you want to delete ALL bills? This action cannot be undone."
    );

    if (!confirmClear) return;

    setIsClearingAll(true);

    try {
      console.log("Starting to clear all bills for user:", user.id);

      // Clear local state immediately to provide instant feedback
      setBills([]);

      // Step 1: Delete all bill items for this user
      console.log("Deleting all bill items for user...");
      const { error: itemsError } = await supabase
        .from('bill_items')
        .delete()
        .in('bill_id', 
          supabase
            .from('bills')
            .select('id')
            .eq('user_id', user.id)
        );

      if (itemsError) {
        console.error("Error deleting bill items:", itemsError);
        // Continue with deletion even if this fails
      }

      // Step 2: Delete credit transactions for this user
      console.log("Deleting credit transactions...");
      const { error: creditError } = await supabase
        .from('credit_transactions')
        .delete()
        .eq('user_id', user.id);

      if (creditError) {
        console.error("Error deleting credit transactions:", creditError);
        // Continue with deletion even if this fails
      }

      // Step 3: Delete all bills for this user
      console.log("Deleting all bills...");
      const { error: billsError } = await supabase
        .from('bills')
        .delete()
        .eq('user_id', user.id);

      if (billsError) {
        console.error("Error deleting bills:", billsError);
        throw billsError;
      }

      console.log("Successfully cleared all bills");
      toast.success("All bills have been cleared successfully");
      
      // Force a fresh fetch to ensure state is correct
      await fetchBills();
      
    } catch (error) {
      console.error("Error clearing bills:", error);
      toast.error("Failed to clear bills. Please try again.");
      
      // Refresh bills list to show current state
      await fetchBills();
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleBillUpdated = () => {
    console.log("Bill updated callback called");
    fetchBills(); // Refresh the bills list
    setEditModalOpen(false); // Close the edit modal
    setSelectedBillId(""); // Clear selected bill ID
  };

  const handleEditModalClose = () => {
    console.log("Edit modal closing");
    setEditModalOpen(false);
    setSelectedBillId("");
  };

  const handleDownloadFromModal = async () => {
    if (selectedBillDetails) {
      await handleDownloadBill(selectedBillDetails.id);
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.customer?.name && bill.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || bill.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading bill history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill History ({bills.length})
            </CardTitle>
            
            {bills.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAllBills}
                disabled={isClearingAll}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isClearingAll ? "Clearing..." : "Clear All"}
              </Button>
            )}
          </div>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by bill number or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            {filteredBills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{searchTerm || statusFilter !== "all" ? "No bills found matching your filters" : "No bills generated yet"}</p>
                <p className="text-sm">Bills will appear here after completing sales</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBills.map(bill => (
                  <div
                    key={bill.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-lg">{bill.bill_number}</h3>
                          <Badge className={getStatusColor(bill.payment_status)}>
                            {bill.payment_status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(bill.bill_date), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          
                          {bill.customer && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{bill.customer.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span>{getPaymentMethodIcon(bill.payment_method)}</span>
                            <span className="capitalize">{bill.payment_method}</span>
                          </div>

                          <div className="flex items-center gap-2 font-semibold text-green-600">
                            <span>₹{Number(bill.total_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          title="View bill details"
                          onClick={() => handleViewBill(bill.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          title="Edit bill"
                          onClick={() => {
                            console.log("Edit button clicked for bill:", bill.id, bill.bill_number);
                            handleEditBill(bill.id);
                          }}
                          disabled={bill.payment_status === 'cancelled'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          title="Download bill"
                          onClick={() => handleDownloadBill(bill.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {bill.payment_status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            title="Cancel bill"
                            onClick={() => handleCancelBill(bill.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BillViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        bill={selectedBillDetails}
        onDownload={handleDownloadFromModal}
      />

      <BillEditModal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        billId={selectedBillId}
        onBillUpdated={handleBillUpdated}
      />
    </>
  );
};
