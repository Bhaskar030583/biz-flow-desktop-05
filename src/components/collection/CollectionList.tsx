
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Edit, Trash } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CollectionForm from "./CollectionForm";

interface CollectionListProps {
  refreshTrigger: number;
}

const CollectionList = ({ refreshTrigger }: CollectionListProps) => {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  
  useEffect(() => {
    fetchCollections();
  }, [refreshTrigger]);
  
  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("collections")
        .select(`
          id,
          collection_date,
          cash_amount,
          card_amount,
          online_amount,
          discount_amount,
          total_amount,
          shops (id, name)
        `)
        .order("collection_date", { ascending: false });
      
      if (error) throw error;
      
      setCollections(data || []);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections data");
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (collection: any) => {
    setSelectedCollection(collection);
    setShowEditDialog(true);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this collection record?")) {
      try {
        const { error } = await supabase
          .from("collections")
          .delete()
          .eq("id", id);
        
        if (error) throw error;
        
        toast.success("Collection record deleted successfully");
        fetchCollections();
      } catch (error: any) {
        console.error("Error deleting collection:", error);
        toast.error("Failed to delete collection record");
      }
    }
  };
  
  const filteredCollections = collections.filter((collection) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    return (
      collection.shops.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      collection.collection_date.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            Loading collection data...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (collections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted flex items-center justify-center w-12 h-12 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Collections Found</h3>
            <p className="text-muted-foreground text-center mb-6">
              No collection records have been added yet. Add your first collection record to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search collections..."
            className="w-full rounded-md border border-input bg-background pl-8 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6 px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead className="text-right">Cash Amount</TableHead>
                  <TableHead className="text-right">Card Amount</TableHead>
                  <TableHead className="text-right">Online Amount</TableHead>
                  <TableHead className="text-right">Discount Amount</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      {format(new Date(collection.collection_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{collection.shops?.name}</TableCell>
                    <TableCell className="text-right">₹{collection.cash_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{collection.card_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{collection.online_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{collection.discount_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{collection.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(collection)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(collection.id)}
                      >
                        <Trash className="h-4 w-4" />
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
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          {selectedCollection && (
            <CollectionForm
              onSuccess={() => {
                setShowEditDialog(false);
                fetchCollections();
              }}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionList;
