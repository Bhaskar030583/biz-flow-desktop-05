
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreditForm from "./CreditForm";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

// Define the Credit type
interface Credit {
  id: string;
  credit_date: string;
  credit_type: string;
  amount: number;
  description: string;
  shop_id: string;
  shop_name?: string;
}

const CreditDetails = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  // Fetch credits from Supabase
  const { data: credits = [], refetch, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      if (!user) return [];

      // Fetch credits with shop details
      const { data: creditsData, error } = await supabase
        .from("credits")
        .select(`
          *,
          shops:shop_id (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("credit_date", { ascending: false });

      if (error) {
        console.error("Error fetching credits:", error);
        toast.error("Failed to load credit data");
        return [];
      }

      // Transform data to include shop_name
      return creditsData.map((credit: any) => ({
        ...credit,
        shop_name: credit.shops?.name
      }));
    },
    enabled: !!user
  });

  const handleCreditAdded = () => {
    setShowForm(false);
    setSelectedCredit(null);
    refetch();
    toast.success("Credit details saved successfully!");
  };

  const handleEditCredit = (credit: Credit) => {
    setSelectedCredit(credit);
    setShowForm(true);
  };

  const handleDeleteCredit = async (id: string) => {
    if (!user) return;

    if (confirm("Are you sure you want to delete this credit entry?")) {
      const { error } = await supabase
        .from("credits")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting credit:", error);
        toast.error("Failed to delete credit entry");
      } else {
        refetch();
        toast.success("Credit entry deleted successfully");
      }
    }
  };

  // Calculate totals
  const creditGiven = credits
    .filter((credit: Credit) => credit.credit_type === "given")
    .reduce((sum: number, credit: Credit) => sum + Number(credit.amount), 0);

  const creditReceived = credits
    .filter((credit: Credit) => credit.credit_type === "received")
    .reduce((sum: number, credit: Credit) => sum + Number(credit.amount), 0);

  const creditBalance = creditReceived - creditGiven;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Credit Management</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {showForm ? "Cancel" : "Add New Credit Entry"}
        </Button>
      </div>

      {/* Credit Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{selectedCredit ? "Edit Credit" : "Add New Credit"}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreditForm 
              onSuccess={handleCreditAdded} 
              onCancel={() => {
                setShowForm(false);
                setSelectedCredit(null);
              }}
              creditToEdit={selectedCredit}
            />
          </CardContent>
        </Card>
      )}

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credit Given</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">₹{creditGiven.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credit Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">₹{creditReceived.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${creditBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ₹{creditBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-4">Loading credit data...</div>
          ) : credits.length === 0 ? (
            <div className="text-center py-4">No credit entries found. Add your first credit entry to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.map((credit: Credit) => (
                  <TableRow key={credit.id}>
                    <TableCell>{new Date(credit.credit_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span 
                        className={`inline-block px-2 py-1 rounded text-xs font-medium 
                        ${credit.credit_type === "given" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                      >
                        {credit.credit_type === "given" ? "Given" : "Received"}
                      </span>
                    </TableCell>
                    <TableCell>{credit.shop_name}</TableCell>
                    <TableCell>₹{Number(credit.amount).toFixed(2)}</TableCell>
                    <TableCell>{credit.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mr-2"
                        onClick={() => handleEditCredit(credit)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteCredit(credit.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditDetails;
