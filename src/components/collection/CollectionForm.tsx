
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CollectionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CollectionForm = ({ onSuccess, onCancel }: CollectionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [onlineAmount, setOnlineAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shop, setShop] = useState<string>("");
  const [shops, setShops] = useState<any[]>([]);

  // Fetch shops when component mounts
  React.useEffect(() => {
    async function fetchShops() {
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("id, name")
          .order("name");

        if (error) throw error;
        setShops(data || []);
        // Set default shop if available
        if (data && data.length > 0) {
          setShop(data[0].id);
        }
      } catch (error: any) {
        console.error("Error fetching shops:", error);
        toast.error("Failed to load shops");
      }
    }

    fetchShops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shop) {
      toast.error("Please select a shop");
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to add collection data");
        return;
      }
      
      const formattedDate = date.toISOString().split('T')[0];
      
      // Insert new collection entry
      const { error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          shop_id: shop,
          collection_date: formattedDate,
          cash_amount: cashAmount || 0,
          card_amount: cardAmount || 0,
          online_amount: onlineAmount || 0,
          discount_amount: discountAmount || 0,
          total_amount: (Number(cashAmount) || 0) + (Number(cardAmount) || 0) + (Number(onlineAmount) || 0)
        });
      
      if (error) throw error;
      
      toast.success("Collection data added successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error adding collection:", error);
      toast.error(error.message || "Failed to add collection data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <DatePicker
            date={date}
            onDateChange={setDate}
            disabled={loading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="shop">Shop</Label>
          <Select value={shop} onValueChange={setShop} disabled={loading}>
            <SelectTrigger id="shop">
              <SelectValue placeholder="Select a shop" />
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
        
        <div className="space-y-2">
          <Label htmlFor="cashAmount">Cash Amount</Label>
          <Input
            id="cashAmount"
            type="number"
            min="0"
            step="0.01"
            value={cashAmount}
            onChange={(e) => setCashAmount(Number(e.target.value))}
            disabled={loading}
            placeholder="0.00"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cardAmount">Card Amount</Label>
          <Input
            id="cardAmount"
            type="number"
            min="0"
            step="0.01"
            value={cardAmount}
            onChange={(e) => setCardAmount(Number(e.target.value))}
            disabled={loading}
            placeholder="0.00"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="onlineAmount">Online Amount</Label>
          <Input
            id="onlineAmount"
            type="number"
            min="0"
            step="0.01"
            value={onlineAmount}
            onChange={(e) => setOnlineAmount(Number(e.target.value))}
            disabled={loading}
            placeholder="0.00"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="discountAmount">Discount Amount</Label>
          <Input
            id="discountAmount"
            type="number"
            min="0"
            step="0.01"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            disabled={loading}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input
            id="totalAmount"
            type="number"
            value={(Number(cashAmount) || 0) + (Number(cardAmount) || 0) + (Number(onlineAmount) || 0)}
            disabled={true}
            className="bg-gray-50"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Collection"}
        </Button>
      </div>
    </form>
  );
};

export default CollectionForm;
