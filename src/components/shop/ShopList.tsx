
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Store } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  store_code: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export function ShopList() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    async function fetchShops() {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        setShops(data || []);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to fetch stores",
          description: error.message || "Something went wrong",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchShops();
  }, [user]);

  async function checkRelatedData(shopId: string, shopName: string) {
    try {
      // Check for credits
      const { data: credits, error: creditsError } = await supabase
        .from("credits")
        .select("id")
        .eq("shop_id", shopId)
        .limit(1);

      if (creditsError) throw creditsError;

      // Check for expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("id")
        .eq("shop_id", shopId)
        .limit(1);

      if (expensesError) throw expensesError;

      // Check for stock entries
      const { data: stocks, error: stocksError } = await supabase
        .from("stocks")
        .select("id")
        .eq("shop_id", shopId)
        .limit(1);

      if (stocksError) throw stocksError;

      const relatedItems = [];
      if (credits && credits.length > 0) relatedItems.push("credits");
      if (expenses && expenses.length > 0) relatedItems.push("expenses");
      if (stocks && stocks.length > 0) relatedItems.push("stock entries");

      return relatedItems;
    } catch (error) {
      console.error("Error checking related data:", error);
      return [];
    }
  }

  async function handleDelete(id: string, shopName: string) {
    try {
      console.log(`Attempting to delete shop: ${shopName} (${id})`);
      
      // First check what related data exists
      const relatedItems = await checkRelatedData(id, shopName);
      
      if (relatedItems.length > 0) {
        const itemsList = relatedItems.join(", ");
        toast({
          variant: "destructive",
          title: "Cannot Delete Store",
          description: `The store "${shopName}" cannot be deleted because it has ${relatedItems.length} type(s) of related data: ${itemsList}. Please remove all ${itemsList} for this store first, then try deleting again.`,
        });
        return;
      }
      
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("id", id);
      
      if (error) {
        console.error("Delete error:", error);
        
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          toast({
            variant: "destructive",
            title: "Cannot Delete Store",
            description: `The store "${shopName}" cannot be deleted because it has related data. This could include credits, expenses, sales, or stock entries. Please remove all related records first and try again.`,
          });
          return;
        }
        
        // Handle other specific error codes
        if (error.code === '42501') {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: `You don't have permission to delete the store "${shopName}". Please contact your administrator.`,
          });
          return;
        }
        
        throw error;
      }
      
      console.log("Shop deleted successfully");
      setShops(shops.filter(shop => shop.id !== id));
      
      toast({
        title: "Store Deleted Successfully",
        description: `The store "${shopName}" has been permanently deleted from your account.`,
      });
    } catch (error: any) {
      console.error("Error deleting store:", error);
      toast({
        variant: "destructive",
        title: "Failed to Delete Store",
        description: `Unable to delete "${shopName}". Error: ${error.message || "An unexpected error occurred. Please try again or contact support."}`,
      });
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading stores...</div>;
  }

  if (shops.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-muted-foreground">
            No stores found. Please add a store to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Stores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Store Code</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Store className="mr-2 h-4 w-4" />
                      {shop.name}
                    </div>
                  </TableCell>
                  <TableCell>{shop.store_code || "—"}</TableCell>
                  <TableCell>{shop.address || "—"}</TableCell>
                  <TableCell>{shop.phone || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(shop.id, shop.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
