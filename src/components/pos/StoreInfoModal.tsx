
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Shop {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  store_id: string;
}

interface StoreInfoModalProps {
  isOpen: boolean;
  onComplete: (info: { storeName: string; salespersonName: string; shiftName: string }, shopId: string, shiftId: string) => void;
  onClose: () => void;
  shops: Shop[];
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
  const [storeName, setStoreName] = useState("");
  const [salespersonName, setSalespersonName] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");

  // Query for shifts based on selected shop
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['hr-shifts', selectedShopId],
    queryFn: async () => {
      if (!selectedShopId) return [];
      
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('id, shift_name, start_time, end_time, store_id')
        .eq('store_id', selectedShopId)
        .eq('is_active', true)
        .order('start_time');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedShopId
  });

  const handleSubmit = () => {
    if (!storeName.trim()) {
      toast.error("Please enter store name");
      return;
    }
    
    if (!salespersonName.trim()) {
      toast.error("Please enter salesperson name");
      return;
    }
    
    if (!selectedShopId) {
      toast.error("Please select a shop");
      return;
    }

    if (!selectedShiftId) {
      toast.error("Please select a shift");
      return;
    }

    const selectedShift = shifts?.find(shift => shift.id === selectedShiftId);
    const shiftName = selectedShift?.shift_name || "";

    onComplete(
      { 
        storeName: storeName.trim(), 
        salespersonName: salespersonName.trim(),
        shiftName: shiftName
      }, 
      selectedShopId,
      selectedShiftId
    );
  };

  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    setSelectedShiftId(""); // Reset shift selection when shop changes
    
    // Auto-fill store name with selected shop name
    const selectedShop = shops.find(shop => shop.id === shopId);
    if (selectedShop) {
      setStoreName(selectedShop.name);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Store className="h-6 w-6 text-blue-600" />
            POS Session Setup
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-center">Enter Session Details</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-select" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Select Shop
              </Label>
              {shopsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedShopId} onValueChange={handleShopChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shop" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white">
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-select" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Shift
              </Label>
              {shiftsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select 
                  value={selectedShiftId} 
                  onValueChange={setSelectedShiftId}
                  disabled={!selectedShopId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedShopId ? "Select a shop first" : "Choose a shift"} />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white">
                    {shifts?.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.shift_name} ({shift.start_time} - {shift.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store-name" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Store Name
              </Label>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter store name"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salesperson-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Salesperson Name
              </Label>
              <Input
                id="salesperson-name"
                value={salespersonName}
                onChange={(e) => setSalespersonName(e.target.value)}
                placeholder="Enter your name"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
            
            <Button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Start POS Session
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
