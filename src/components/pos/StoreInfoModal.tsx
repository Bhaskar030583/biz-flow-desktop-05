
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
        <DialogHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto flex items-center justify-center gap-4">
            <img 
              src="/lovable-uploads/7e552f66-f5e2-416f-af98-1a5f74c1bfed.png" 
              alt="ABC Cafe Logo" 
              className="h-16 w-16 object-contain"
            />
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              ABC CAFE
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store Selection */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                Store Location
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {storesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading stores...
                  </div>
                </div>
              ) : storesError ? (
                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Error loading stores</span>
                  </div>
                  <p className="text-red-600 text-sm">{storesError.message}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedStoreId} onValueChange={(value) => {
                    setSelectedStoreId(value);
                    setSelectedShiftId("");
                  }}>
                    <SelectTrigger className="h-12 bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-base font-medium">
                      <SelectValue placeholder="Choose store location" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border-2 shadow-xl">
                      {hrStores && hrStores.length > 0 ? (
                        hrStores.map((store: HRStore) => (
                          <SelectItem key={store.id} value={store.id} className="cursor-pointer hover:bg-blue-50 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Store className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold">{store.store_name}</div>
                                <div className="text-sm text-gray-500">Code: {store.store_code}</div>
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
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      Store selected successfully
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shift Selection */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                Work Shift
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {shiftsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading shifts...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedShiftId} onValueChange={setSelectedShiftId} disabled={!selectedStoreId}>
                    <SelectTrigger className="h-12 bg-white border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 text-base font-medium disabled:opacity-50">
                      <SelectValue placeholder="Choose work shift" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border-2 shadow-xl">
                      {hrShifts && hrShifts.length > 0 ? (
                        hrShifts.map((shift: HRShift) => (
                          <SelectItem key={shift.id} value={shift.id} className="cursor-pointer hover:bg-purple-50 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Clock className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-semibold">{shift.shift_name}</div>
                                <div className="text-sm text-gray-500">{shift.start_time} - {shift.end_time}</div>
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
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      Please select a store first to view available shifts
                    </div>
                  )}
                  
                  {selectedShiftId && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      Shift selected successfully
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salesperson Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                Salesperson
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 px-4 py-6 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-green-700 mb-1">Logged in as:</div>
                    <div className="text-lg font-bold text-green-800 break-words">
                      {salespersonName || "Loading..."}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Start Session Button */}
        <div className="pt-6">
          <Button 
            onClick={handleSubmit}
            className="w-full h-16 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:via-orange-700 hover:to-amber-800 text-white text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
            size="lg"
            disabled={!selectedStoreId || !selectedShiftId || storesLoading || shiftsLoading}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <span>Start POS Session</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
