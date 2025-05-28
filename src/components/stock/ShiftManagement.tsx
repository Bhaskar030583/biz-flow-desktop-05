
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  store_id: string;
  is_active: boolean;
}

const ShiftManagement = () => {
  const { user } = useAuth();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [newShift, setNewShift] = useState({
    name: "",
    start_time: "",
    end_time: ""
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: shifts, refetch: refetchShifts } = useQuery({
    queryKey: ['shifts', selectedStore],
    queryFn: async () => {
      if (!selectedStore) return [];
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('*')
        .eq('store_id', selectedStore)
        .order('start_time');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore
  });

  const handleCreateShift = async () => {
    if (!selectedStore || !newShift.name || !newShift.start_time || !newShift.end_time) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('hr_shifts')
        .insert({
          shift_name: newShift.name,
          start_time: newShift.start_time,
          end_time: newShift.end_time,
          store_id: selectedStore,
          shift_type: 'regular'
        });

      if (error) throw error;

      toast.success("Shift created successfully");
      setNewShift({ name: "", start_time: "", end_time: "" });
      refetchShifts();
    } catch (error) {
      console.error("Error creating shift:", error);
      toast.error("Failed to create shift");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStore && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Shift Name</Label>
                  <Input
                    value={newShift.name}
                    onChange={(e) => setNewShift(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Morning, Evening, Night"
                  />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newShift.start_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newShift.end_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateShift} className="w-full">
                    Create Shift
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Current Shifts</h4>
                {shifts?.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{shift.shift_name}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        {shift.start_time} - {shift.end_time}
                      </span>
                    </div>
                    <Badge variant={shift.is_active ? "default" : "secondary"}>
                      {shift.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftManagement;
