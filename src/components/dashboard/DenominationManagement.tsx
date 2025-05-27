
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

interface Shop {
  id: string;
  name: string;
}

export const DenominationManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [shops, setShops] = useState<Shop[]>([]);
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
      fetchShops();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop) {
      fetchStoreDenominations();
    }
  }, [selectedShop]);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name")
        .eq("user_id", user?.id)
        .order("name");

      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to fetch shops");
    }
  };

  const fetchStoreDenominations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("store_denominations")
        .select("denominations")
        .eq("shop_id", selectedShop)
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
    if (!selectedShop) {
      toast.error("Please select a shop");
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("store_denominations")
        .upsert({
          shop_id: selectedShop,
          date: today,
          denominations: denominations,
          total_amount: calculateTotal(),
          user_id: user?.id
        }, {
          onConflict: 'shop_id,date,user_id'
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
          <Label htmlFor="shop-select">Select Shop</Label>
          <Select value={selectedShop} onValueChange={setSelectedShop}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a shop" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedShop && (
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
