
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Store, Clock, User, MapPin, CheckCircle, AlertCircle } from "lucide-react";
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
  console.log('🔄 [StoreInfoModal] Component render, isOpen:', isOpen);
  
  const { user } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [salespersonName, setSalespersonName] = useState("");

  // Memoize the user profile query function to prevent re-renders
  const userProfileQueryFn = useMemo(() => {
    if (!user?.id) return () => Promise.resolve(null);
    
    return async () => {
      console.log('📋 [StoreInfoModal] Fetching user profile for:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('❌ [StoreInfoModal] Error fetching user profile:', error);
        return null;
      }
      
      console.log('✅ [StoreInfoModal] User profile fetched:', data);
      return data;
    };
  }, [user?.id]);

  // Memoize the stores query function
  const storesQueryFn = useMemo(() => {
    return async () => {
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
    };
  }, []);

  // Memoize the shifts query function
  const shiftsQueryFn = useMemo(() => {
    if (!selectedStoreId) return () => Promise.resolve([]);
    
    return async () => {
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
    };
  }, [selectedStoreId]);

  // Stable queries with memoized functions
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: userProfileQueryFn,
    enabled: !!user?.id,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const { data: hrStores, isLoading: storesLoading, error: storesError } = useQuery({
    queryKey: ['hrms-stores-modal'],
    queryFn: storesQueryFn,
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const { data: hrShifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['hrms-shifts', selectedStoreId],
    queryFn: shiftsQueryFn,
    enabled: !!selectedStoreId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  // Initialize salesperson name properly
  useEffect(() => {
    if (!salespersonName && user) {
      let displayName = "";
      
      // First priority: full_name from profile
      if (userProfile?.full_name) {
        displayName = userProfile.full_name;
        console.log('📝 [StoreInfoModal] Setting salesperson name from profile:', displayName);
      }
      // Second priority: extract name from email
      else if (user.email) {
        // For admin email, set to "Bhaskar" 
        if (user.email === "gumpubhaskar3000@gmail.com") {
          displayName = "Bhaskar";
        } else {
          // Extract name from email (before @)
          displayName = user.email.split('@')[0];
          // Capitalize first letter
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        }
        console.log('📝 [StoreInfoModal] Setting salesperson name from email:', displayName);
      }
      
      if (displayName) {
        setSalespersonName(displayName);
      }
    }
  }, [userProfile?.full_name, user?.email, salespersonName, user]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🧹 [StoreInfoModal] Resetting form state');
      setSelectedStoreId("");
      setSelectedShiftId("");
      // Keep salesperson name
    }
  }, [isOpen]);

  // Memoized handlers to prevent re-renders
  const handleStoreChange = useCallback((value: string) => {
    console.log('🏪 [StoreInfoModal] Store selection changed to:', value);
    setSelectedStoreId(value);
    setSelectedShiftId(""); // Reset shift when store changes
  }, []);

  const handleShiftChange = useCallback((value: string) => {
    console.log('🕐 [StoreInfoModal] Shift selection changed to:', value);
    setSelectedShiftId(value);
  }, []);

  const handleSubmit = useCallback(() => {
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
      selectedShiftId,
      salespersonName
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
  }, [selectedStoreId, selectedShiftId, salespersonName, hrStores, hrShifts, onComplete]);

  console.log('🔄 [StoreInfoModal] Current state:', {
    isOpen,
    selectedStoreId,
    selectedShiftId,
    salespersonName,
    storesLoading,
    shiftsLoading,
    hrStoresCount: hrStores?.length || 0,
    hrShiftsCount: hrShifts?.length || 0,
    userEmail: user?.email
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-gray-800 border border-gray-700 shadow-2xl">
        <DialogHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto flex items-center justify-center">
            <img 
              src="/lovable-uploads/7e552f66-f5e2-416f-af98-1a5f74c1bfed.png" 
              alt="ABC Cafe Logo" 
              className="h-32 w-auto object-contain rounded-lg shadow-lg"
            />
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Store Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Store Location
            </Label>
            {storesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-gray-700" />
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading stores...
                </div>
              </div>
            ) : storesError ? (
              <div className="p-3 border-2 border-red-600 rounded-lg bg-red-900/20">
                <div className="flex items-center gap-2 text-red-400 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold text-sm">Error loading stores</span>
                </div>
                <p className="text-red-300 text-sm">{storesError.message}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={selectedStoreId} onValueChange={handleStoreChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500">
                    <SelectValue placeholder="Choose store location" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {hrStores && hrStores.length > 0 ? (
                      hrStores.map((store: HRStore) => (
                        <SelectItem key={store.id} value={store.id} className="text-white hover:bg-gray-600">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-blue-400" />
                            <div>
                              <div className="font-medium">{store.store_name}</div>
                              <div className="text-sm text-gray-400">Code: {store.store_code}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-stores" disabled>No stores available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {selectedStoreId && (
                  <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 p-2 rounded">
                    <CheckCircle className="w-4 h-4" />
                    Store selected successfully
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shift Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Work Shift
            </Label>
            {shiftsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full bg-gray-700" />
                <div className="flex items-center gap-2 text-sm text-purple-400">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading shifts...
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={selectedShiftId} onValueChange={handleShiftChange} disabled={!selectedStoreId}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 disabled:opacity-50">
                    <SelectValue placeholder="Choose work shift" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {hrShifts && hrShifts.length > 0 ? (
                      hrShifts.map((shift: HRShift) => (
                        <SelectItem key={shift.id} value={shift.id} className="text-white hover:bg-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-400" />
                            <div>
                              <div className="font-medium">{shift.shift_name}</div>
                              <div className="text-sm text-gray-400">{shift.start_time} - {shift.end_time}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : selectedStoreId ? (
                      <SelectItem value="no-shifts" disabled>No shifts available</SelectItem>
                    ) : (
                      <SelectItem value="select-store" disabled>Select store first</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {!selectedStoreId && (
                  <div className="text-sm text-gray-400 bg-gray-700/50 p-2 rounded">
                    Please select a store first to view available shifts
                  </div>
                )}
                
                {selectedShiftId && (
                  <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 p-2 rounded">
                    <CheckCircle className="w-4 h-4" />
                    Shift selected successfully
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Salesperson Information */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <User className="h-4 w-4" />
              Salesperson
            </Label>
            <div className="bg-gray-700 border border-gray-600 px-4 py-3 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-400 mb-1">Logged in as:</div>
                <div className="text-base font-bold text-white break-words">
                  {salespersonName || "Loading..."}
                </div>
                {user?.email && (
                  <div className="text-xs text-gray-400 mt-1">
                    {user.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Start Session Button */}
        <div className="pt-4">
          <Button 
            onClick={handleSubmit}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
            disabled={!selectedStoreId || !selectedShiftId || storesLoading || shiftsLoading}
          >
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5" />
              <span>Start POS Session</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
