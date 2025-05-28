
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StoreInfoModalProps {
  isOpen: boolean;
  onComplete: (storeInfo: { storeName: string; salespersonName: string }, shopId: string) => void;
  onClose?: () => void;
  shops: Array<{ id: string; name: string }>;
  shopsLoading: boolean;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onComplete,
  onClose,
  shops,
  shopsLoading
}) => {
  const { user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [salespersonName, setSalespersonName] = useState("");

  useEffect(() => {
    if (user && isOpen) {
      fetchUserProfile();
    }
  }, [user, isOpen]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      
      setSalespersonName(data?.full_name || user?.email || "");
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      // Fallback to email if profile fetch fails
      setSalespersonName(user?.email || "");
    }
  };

  const handleSubmit = () => {
    if (!selectedStoreId) {
      toast.error("Please select a store");
      return;
    }
    
    if (!salespersonName.trim()) {
      toast.error("Salesperson name is required");
      return;
    }

    const selectedStore = shops.find(store => store.id === selectedStoreId);
    if (!selectedStore) {
      toast.error("Invalid store selection");
      return;
    }

    onComplete({
      storeName: selectedStore.name,
      salespersonName: salespersonName.trim()
    }, selectedStoreId);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Enter Store Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-select" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store Name
            </Label>
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId} disabled={shopsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={shopsLoading ? "Loading stores..." : "Select a store"} />
              </SelectTrigger>
              <SelectContent>
                {shops.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!shopsLoading && shops.length === 0 && (
              <p className="text-sm text-muted-foreground">No stores found. Please create a store first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesperson-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Salesperson Name
            </Label>
            <div className="px-3 py-2 border rounded-md bg-muted text-sm">
              {salespersonName || "Loading..."}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!selectedStoreId || !salespersonName.trim() || shopsLoading}
          >
            Continue to POS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
