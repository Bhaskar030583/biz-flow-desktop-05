
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Denominations {
  [key: number]: number;
}

interface HRStore {
  id: string;
  store_name: string;
}

export const DenominationManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedHRStore, setSelectedHRStore] = useState<string>("");
  const [hrStores, setHRStores] = useState<HRStore[]>([]);
  const [denominations, setDenominations] = useState<Denominations>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0
  });
  const [saving, setSaving] = useState(false);

  const denominationValues = [500, 200, 100, 50, 20, 10, 5, 2, 1];

  useEffect(() => {
    if (user) {
      fetchHRStores();
    }
  }, [user]);

  useEffect(() => {
    if (selectedHRStore) {
      fetchStoreDenominations();
    }
  }, [selectedHRStore]);

  const fetchHRStores = async () => {
    try {
      const { data, error } = await supabase
        .from("hr_stores")
        .select("id, store_name")
        .order("store_name");

      if (error) throw error;
      setHRStores(data || []);
    } catch (error) {
      console.error("Error fetching HR stores:", error);
      toast.error("Failed to fetch stores");
    }
  };

  const fetchStoreDenominations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("store_denominations")
        .select("denominations")
        .eq("hr_shop_id", selectedHRStore)
        .eq("date", today)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching store denominations:", error);
        setDenominations({
          500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
        });
        return;
      }

      if (data && data.denominations) {
        setDenominations(data.denominations as Denominations);
      } else {
        setDenominations({
          500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
        });
      }
    } catch (error) {
      console.error("Error fetching store denominations:", error);
      setDenominations({
        500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
      });
    }
  };

  const handleDenominationChange = (value: number, count: string) => {
    const numCount = parseInt(count) || 0;
    setDenominations(prev => ({
      ...prev,
      [value]: numCount
    }));
  };

  const calculateTotal = () => {
    return denominationValues.reduce((total, value) => {
      return total + (value * (denominations[value] || 0));
    }, 0);
  };

  const handleSave = async () => {
    if (!selectedHRStore) {
      toast.error("Please select a store");
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("store_denominations")
        .upsert({
          hr_shop_id: selectedHRStore,
          date: today,
          denominations: denominations as any, // Cast to any to satisfy Json type
          total_amount: calculateTotal(),
          user_id: user?.id
        }, {
          onConflict: 'hr_shop_id,date,user_id'
        });

      if (error) throw error;

      toast.success("Store denominations saved successfully!");
    } catch (error) {
      console.error("Error saving denominations:", error);
      toast.error("Failed to save denominations");
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = calculateTotal();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Morning Denomination Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hr-store-select">Select Store</Label>
          <Select value={selectedHRStore} onValueChange={setSelectedHRStore}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a store" />
            </SelectTrigger>
            <SelectContent>
              {hrStores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedHRStore && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {denominationValues.map(value => (
                <div key={value} className="space-y-1">
                  <Label htmlFor={`denom-${value}`} className="text-sm font-medium">
                    ₹{value} notes
                  </Label>
                  <Input
                    id={`denom-${value}`}
                    type="number"
                    min="0"
                    value={denominations[value]}
                    onChange={(e) => handleDenominationChange(value, e.target.value)}
                    placeholder="0"
                    className="text-center"
                  />
                  <div className="text-xs text-gray-500 text-center">
                    = ₹{(value * (denominations[value] || 0)).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Total Amount</Label>
              <div className="text-2xl font-bold text-green-600">
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || totalAmount === 0}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Denominations"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
