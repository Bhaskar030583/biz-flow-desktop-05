
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface HRStore {
  id: string;
  store_name: string;
  store_code: string;
}

interface HRShift {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  store_id: string;
}

interface StoreInfoModalProps {
  isOpen: boolean;
  onComplete: (info: { storeName: string; salespersonName: string; shiftName: string }, shiftId: string, storeId: string) => void;
  onClose: () => void;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onComplete,
  onClose
}) => {
  const { user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [salespersonName, setSalespersonName] = useState("");

  // Query for user profile to get the full name
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Query for hr_stores - get stores from HRMS
  const { data: hrStores, isLoading: storesLoading, error: storesError } = useQuery({
    queryKey: ['hrms-stores-modal'],
    queryFn: async () => {
      console.log('🏪 [StoreInfoModal] FETCHING HR STORES');
      
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');
      
      if (error) {
        console.error('❌ [StoreInfoModal] Error fetching hr_stores:', error);
        toast.error('Failed to load HRMS stores: ' + error.message);
        throw error;
      }
      
      console.log('✅ [StoreInfoModal] Successfully fetched HR stores:', data);
      return data || [];
    },
    enabled: !!user?.id && isOpen
  });

  // Query for shifts from hr_shifts table based on selected store
  const { data: hrShifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['hrms-shifts', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) {
        console.log('🕐 [StoreInfoModal] No store selected for shifts query');
        return [];
      }
      
      console.log('🕐 [StoreInfoModal] Fetching HR shifts for store:', selectedStoreId);
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('id, shift_name, start_time, end_time, store_id')
        .eq('store_id', selectedStoreId)
        .eq('is_active', true)
        .order('start_time');
      
      if (error) {
        console.error('❌ [StoreInfoModal] Error fetching hr_shifts:', error);
        throw error;
      }
      
      console.log('✅ [StoreInfoModal] Fetched HR shifts:', data);
      return data || [];
    },
    enabled: !!selectedStoreId
  });

  // Set salesperson name when user profile is loaded
  useEffect(() => {
    if (userProfile?.full_name) {
      setSalespersonName(userProfile.full_name);
    } else if (user?.email) {
      // Fallback to email if full name is not available
      setSalespersonName(user.email.split('@')[0]);
    }
  }, [userProfile, user]);

  // Debug logging
  useEffect(() => {
    console.log('🔄 [StoreInfoModal] Component State:', {
      isOpen,
      selectedStoreId,
      selectedShiftId,
      salespersonName,
      hrStoresCount: hrStores?.length || 0,
      hrShiftsCount: hrShifts?.length || 0,
      storesLoading,
      shiftsLoading
    });
  }, [isOpen, selectedStoreId, selectedShiftId, salespersonName, hrStores, hrShifts, storesLoading, shiftsLoading]);

  const handleSubmit = () => {
    console.log('📝 [StoreInfoModal] Submit button clicked');
    
    if (!selectedStoreId) {
      console.log('❌ [StoreInfoModal] No store selected');
      toast.error("Please select a store");
      return;
    }
    
    if (!salespersonName.trim()) {
      console.log('❌ [StoreInfoModal] No salesperson name');
      toast.error("Salesperson name not found. Please check your profile.");
      return;
    }

    if (!selectedShiftId) {
      console.log('❌ [StoreInfoModal] No shift selected');
      toast.error("Please select a shift");
      return;
    }

    const selectedStore = hrStores?.find(store => store.id === selectedStoreId);
    const selectedShift = hrShifts?.find(shift => shift.id === selectedShiftId);
    const storeName = selectedStore?.store_name || "";
    const shiftName = selectedShift?.shift_name || "";

    console.log('✅ [StoreInfoModal] Submitting store info:', {
      selectedStore,
      selectedShift,
      storeName,
      shiftName,
      selectedStoreId,
      selectedShiftId
    });

    onComplete(
      { 
        storeName: storeName.trim(), 
        salespersonName: salespersonName.trim(),
        shiftName: shiftName
      }, 
      selectedShiftId,
      selectedStoreId
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
              <Label htmlFor="store-select" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Select HRMS Store
              </Label>
              
              {storesLoading ? (
                <div>
                  <Skeleton className="h-10 w-full" />
                  <p className="text-xs text-blue-600 mt-1">🔄 Loading HRMS stores...</p>
                </div>
              ) : storesError ? (
                <div className="text-red-500 text-sm space-y-2">
                  <div className="p-3 border border-red-200 rounded bg-red-50">
                    <p className="font-medium">❌ Error loading HRMS stores:</p>
                    <p>{storesError.message}</p>
                    <p className="text-xs mt-1">Please check if stores are created in HRMS module.</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Select 
                    value={selectedStoreId} 
                    onValueChange={(value) => {
                      console.log('🎯 [StoreInfoModal] HR Store selected:', value);
                      console.log('🎯 [StoreInfoModal] Available HR stores:', hrStores);
                      setSelectedStoreId(value);
                      setSelectedShiftId(""); // Reset shift when store changes
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Choose an HRMS store" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border shadow-lg">
                      {hrStores && hrStores.length > 0 ? (
                        hrStores.map((store: HRStore) => {
                          console.log('🏪 [StoreInfoModal] Rendering HR store option:', store);
                          return (
                            <SelectItem key={store.id} value={store.id} className="cursor-pointer hover:bg-gray-100">
                              {store.store_name} ({store.store_code})
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="no-stores" disabled>
                          No HRMS stores available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {hrStores && hrStores.length > 0 ? (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Found {hrStores.length} HRMS store(s)
                    </p>
                  ) : (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ No HRMS stores found
                    </p>
                  )}
                </div>
              )}
              
              {!storesLoading && !storesError && (!hrStores || hrStores.length === 0) && (
                <div className="p-3 border border-yellow-200 rounded bg-yellow-50">
                  <p className="text-xs text-yellow-800">
                    ⚠️ No stores found in HRMS. Please create stores first in the HRMS module.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-select" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select HRMS Shift
              </Label>
              {shiftsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select 
                  value={selectedShiftId} 
                  onValueChange={(value) => {
                    console.log('🕐 [StoreInfoModal] HR Shift selected:', value);
                    setSelectedShiftId(value);
                  }}
                  disabled={!selectedStoreId}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose an HRMS shift" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white border shadow-lg">
                    {hrShifts && hrShifts.length > 0 ? (
                      hrShifts.map((shift: HRShift) => (
                        <SelectItem key={shift.id} value={shift.id} className="cursor-pointer hover:bg-gray-100">
                          {shift.shift_name} ({shift.start_time} - {shift.end_time})
                        </SelectItem>
                      ))
                    ) : selectedStoreId ? (
                      <SelectItem value="no-shifts" disabled>
                        No HRMS shifts available for this store
                      </SelectItem>
                    ) : (
                      <SelectItem value="select-store" disabled>
                        Please select an HRMS store first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {!selectedStoreId && (
                <p className="text-xs text-muted-foreground">Please select an HRMS store first</p>
              )}
              {selectedStoreId && !shiftsLoading && (!hrShifts || hrShifts.length === 0) && (
                <p className="text-xs text-red-500">No HRMS shifts found for this store. Please create shifts in HRMS.</p>
              )}
            </div>
            
            {/* Display salesperson name as read-only */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                Salesperson
              </Label>
              <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-md text-sm text-gray-800">
                {salespersonName || "Loading..."}
              </div>
            </div>
            
            <Button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              disabled={!selectedStoreId || !selectedShiftId || storesLoading || shiftsLoading}
            >
              Start POS Session
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
