
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
import { PlusCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { exportStockData } from "../stock/StockExportService";
import StockExportProgress from "../stock/StockExportProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyFinancialForm from "./DailyFinancialForm";

// Define the Credit type
interface Credit {
  id: string;
  credit_date: string;
  credit_type: string;
  amount: number;
  description: string | null;
  hr_shop_id: string;
  shop_name?: string;
}

const CreditDetails = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("credit");
  const [showDailyFinanceForm, setShowDailyFinanceForm] = useState(false);

  // Fetch credits from Supabase
  const { data: credits = [], refetch, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      if (!user) return [];

      // Fetch credits with HR store details
      const { data: creditsData, error } = await supabase
        .from("credits")
        .select(`
          *,
          hr_stores:hr_shop_id (
            store_name
          )
        `)
        .eq("user_id", user.id)
        .not('credit_type', 'in', '(cash,card,online,discount)')
        .order("credit_date", { ascending: false });

      if (error) {
        console.error("Error fetching credits:", error);
        toast.error("Failed to load credit data");
        return [];
      }

      // Transform data to include shop_name
      return creditsData.map((credit: any) => ({
        ...credit,
        shop_name: credit.hr_stores?.store_name
      }));
    },
    enabled: !!user && activeTab === "credit"
  });

  // Fetch financial data from Supabase
  const { data: financialData = [], refetch: refetchFinancial, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ["financial-data"],
    queryFn: async () => {
      if (!user) return [];

      // Fetch financial entries grouped by date and shop
      const { data: financialEntries, error } = await supabase
        .from("credits")
        .select(`
          credit_date,
          hr_shop_id,
          hr_stores:hr_shop_id (store_name),
          credit_type,
          amount
        `)
        .eq("user_id", user.id)
        .in('credit_type', ['cash', 'card', 'online', 'discount'])
        .order("credit_date", { ascending: false });

      if (error) {
        console.error("Error fetching financial data:", error);
        toast.error("Failed to load financial data");
        return [];
      }

      // Group by date and shop
      const groupedData = financialEntries.reduce((acc: any[], entry: any) => {
        const dateKey = entry.credit_date;
        const shopKey = entry.hr_shop_id;
        
        // Find if we already have an entry for this date and shop
        const existingIndex = acc.findIndex(item => 
          item.credit_date === dateKey && item.hr_shop_id === shopKey
        );
        
        if (existingIndex >= 0) {
          // Update existing entry
          const creditType = entry.credit_type;
          acc[existingIndex][creditType + '_amount'] = (acc[existingIndex][creditType + '_amount'] || 0) + Number(entry.amount);
        } else {
          // Create new entry
          const newEntry = {
            credit_date: dateKey,
            hr_shop_id: shopKey,
            shop_name: entry.hr_stores?.store_name,
            cash_amount: 0,
            card_amount: 0,
            online_amount: 0,
            discount_amount: 0
          };
          
          // Add amount to the correct field
          const creditType = entry.credit_type;
          newEntry[creditType + '_amount'] = Number(entry.amount);
          
          acc.push(newEntry);
        }
        
        return acc;
      }, []);
      
      return groupedData;
    },
    enabled: !!user && activeTab === "financial"
  });

  const handleCreditAdded = () => {
    setShowForm(false);
    setSelectedCredit(null);
    refetch();
    toast.success("Credit details saved successfully!");
  };

  const handleFinanceAdded = () => {
    setShowDailyFinanceForm(false);
    refetchFinancial();
    toast.success("Financial data saved successfully!");
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

  const handleDeleteFinancialEntry = async (date: string, shopId: string) => {
    if (!user) return;

    if (confirm("Are you sure you want to delete this financial entry?")) {
      const { error } = await supabase
        .from("credits")
        .delete()
        .eq("credit_date", date)
        .eq("hr_shop_id", shopId)
        .eq("user_id", user.id)
        .in('credit_type', ['cash', 'card', 'online', 'discount']);

      if (error) {
        console.error("Error deleting financial entry:", error);
        toast.error("Failed to delete financial entry");
      } else {
        refetchFinancial();
        toast.success("Financial entry deleted successfully");
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-muted/50">
          <TabsTrigger value="credit" className="flex-1">Credit Management</TabsTrigger>
          <TabsTrigger value="financial" className="flex-1">Financial Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credit" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Daily Financial Data</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setExporting(true);
                  exportStockData(setExporting, setExportProgress);
                }}
                disabled={exporting}
              >
                <Download className="mr-2 h-4 w-4" /> Export Data
              </Button>
              <Button onClick={() => setShowDailyFinanceForm(!showDailyFinanceForm)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {showDailyFinanceForm ? "Cancel" : "Add Financial Data"}
              </Button>
            </div>
          </div>

          <StockExportProgress exporting={exporting} exportProgress={exportProgress} />
          
          {/* Financial Form */}
          {showDailyFinanceForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add Daily Financial Data</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyFinancialForm 
                  onSuccess={handleFinanceAdded} 
                  onCancel={() => setShowDailyFinanceForm(false)}
                />
              </CardContent>
            </Card>
          )}

          {/* Financial Data Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoadingFinancial ? (
                <div className="text-center py-4">Loading financial data...</div>
              ) : financialData.length === 0 ? (
                <div className="text-center py-4">No financial data found. Add your first entry to get started.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Cash</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead>UPI</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.map((entry: any, index: number) => {
                      const total = entry.cash_amount + entry.card_amount + entry.online_amount;
                      return (
                        <TableRow key={index}>
                          <TableCell>{new Date(entry.credit_date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.shop_name}</TableCell>
                          <TableCell>₹{entry.cash_amount.toFixed(2)}</TableCell>
                          <TableCell>₹{entry.card_amount.toFixed(2)}</TableCell>
                          <TableCell>₹{entry.online_amount.toFixed(2)}</TableCell>
                          <TableCell>₹{entry.discount_amount.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">₹{total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteFinancialEntry(entry.credit_date, entry.hr_shop_id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditDetails;
