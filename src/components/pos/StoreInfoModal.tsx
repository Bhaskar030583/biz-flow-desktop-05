
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

interface Shift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  store_id: string;
}

interface StoreInfoModalProps {
  isOpen: boolean;
  onComplete: (info: { storeName: string; salespersonName: string; shiftName: string }, shiftId: string) => void;
  onClose: () => void;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onComplete,
  onClose
}) => {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [salespersonName, setSalespersonName] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");

  // Query for all shifts from hr_shifts table
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['hr-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('id, shift_name, start_time, end_time, store_id')
        .eq('is_active', true)
        .order('start_time');
      
      if (error) throw error;
      return data || [];
    }
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
      selectedShiftId
    );
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a shift" />
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
