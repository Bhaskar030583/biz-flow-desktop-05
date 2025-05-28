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

interface Shift {
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
  const { data: stores, isLoading: storesLoading, error: storesError } = useQuery({
    queryKey: ['hrms-stores-modal'],
    queryFn: async () => {
      console.log('🔍 [StoreInfoModal] FETCHING STORES FROM HR_STORES');
      console.log('🔍 [StoreInfoModal] User ID:', user?.id);
      console.log('🔍 [StoreInfoModal] Modal is open:', isOpen);
      
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');
      
      console.log('🔍 [StoreInfoModal] Raw Supabase response:', { data, error });
      console.log('🔍 [StoreInfoModal] Data type:', typeof data);
      console.log('🔍 [StoreInfoModal] Data is Array?', Array.isArray(data));
      
      if (error) {
        console.error('❌ [StoreInfoModal] Error fetching hr_stores:', error);
        toast.error('Failed to load stores: ' + error.message);
        throw error;
      }
      
      console.log('✅ [StoreInfoModal] Successfully fetched stores:', data);
      console.log('✅ [StoreInfoModal] Number of stores:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('✅ [StoreInfoModal] First store details:', data[0]);
        toast.success(`Successfully loaded ${data.length} store(s) from HRMS`);
      } else {
        console.log('⚠️ [StoreInfoModal] No stores found in hr_stores table');
        toast.warning('No stores found in HRMS. Please create stores first.');
      }
      
      return data || [];
    },
    enabled: !!user?.id && isOpen
  });

  // Query for shifts from hr_shifts table based on selected store
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['hrms-shifts', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) {
        console.log('🔍 [StoreInfoModal] No store selected for shifts query');
        return [];
      }
      
      console.log('🔍 [StoreInfoModal] Fetching shifts for store:', selectedStoreId);
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
      
      console.log('✅ [StoreInfoModal] Fetched shifts:', data);
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

  // Debug effect to track component state changes
  useEffect(() => {
    console.log('🔄 [StoreInfoModal] State Update:', {
      isOpen,
      modalVisible: isOpen,
      userLoggedIn: !!user,
      storesLoading,
      storesError: storesError?.message,
      storesCount: stores?.length || 0,
      selectedStoreId,
      selectedShiftId,
      salespersonName
    });
  }, [isOpen, user, stores, storesLoading, storesError, selectedStoreId, selectedShiftId, salespersonName]);

  // Debug effect specifically for stores data
  useEffect(() => {
    if (stores) {
      console.log('📊 [StoreInfoModal] Stores data updated:', {
        storesArray: stores,
        length: stores.length,
        firstStore: stores[0],
        allStoreNames: stores.map(store => store.store_name)
      });
    }
  }, [stores]);

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

    const selectedStore = stores?.find(store => store.id === selectedStoreId);
    const selectedShift = shifts?.find(shift => shift.id === selectedShiftId);
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

  // Debug render info
  console.log('🎨 [StoreInfoModal] Rendering with:', {
    isOpen,
    storesLoading,
    storesError: !!storesError,
    storesCount: stores?.length || 0,
    hasStores: !!(stores && stores.length > 0)
  });

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
                Select Store
              </Label>
              
              {storesLoading ? (
                <div>
                  <Skeleton className="h-10 w-full" />
                  <p className="text-xs text-blue-600 mt-1">🔄 Loading stores from HRMS...</p>
                </div>
              ) : storesError ? (
                <div className="text-red-500 text-sm space-y-2">
                  <div className="p-3 border border-red-200 rounded bg-red-50">
                    <p className="font-medium">❌ Error loading stores:</p>
                    <p>{storesError.message}</p>
                    <p className="text-xs mt-1">Please check if stores are created in HRMS module.</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Select 
                    value={selectedStoreId} 
                    onValueChange={(value) => {
                      console.log('🎯 [StoreInfoModal] Store selected:', value);
                      console.log('🎯 [StoreInfoModal] Available stores for selection:', stores);
                      setSelectedStoreId(value);
                      setSelectedShiftId(""); // Reset shift when store changes
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Choose a store" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border shadow-lg">
                      {stores && stores.length > 0 ? (
                        stores.map((store) => {
                          console.log('🏪 [StoreInfoModal] Rendering store option:', store);
                          return (
                            <SelectItem key={store.id} value={store.id} className="cursor-pointer hover:bg-gray-100">
                              {store.store_name} ({store.store_code})
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem value="no-stores" disabled>
                          No stores available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {stores && stores.length > 0 ? (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Found {stores.length} store(s) from HRMS
                    </p>
                  ) : (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ No stores loaded yet
                    </p>
                  )}
                </div>
              )}
              
              {!storesLoading && !storesError && (!stores || stores.length === 0) && (
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
                Select Shift
              </Label>
              {shiftsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select 
                  value={selectedShiftId} 
                  onValueChange={(value) => {
                    console.log('Shift selected:', value);
                    setSelectedShiftId(value);
                  }}
                  disabled={!selectedStoreId}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose a shift" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white border shadow-lg">
                    {shifts && shifts.length > 0 ? (
                      shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id} className="cursor-pointer hover:bg-gray-100">
                          {shift.shift_name} ({shift.start_time} - {shift.end_time})
                        </SelectItem>
                      ))
                    ) : selectedStoreId ? (
                      <SelectItem value="no-shifts" disabled>
                        No shifts available for this store
                      </SelectItem>
                    ) : (
                      <SelectItem value="select-store" disabled>
                        Please select a store first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {!selectedStoreId && (
                <p className="text-xs text-muted-foreground">Please select a store first</p>
              )}
              {selectedStoreId && !shiftsLoading && (!shifts || shifts.length === 0) && (
                <p className="text-xs text-red-500">No shifts found for this store. Please create shifts in HRMS.</p>
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
