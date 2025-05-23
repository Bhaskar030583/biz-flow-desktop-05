
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CollectionForm = ({ onSuccess, initialData }) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | null>(initialData?.credit_date ? new Date(initialData.credit_date) : new Date());
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [paymentType, setPaymentType] = useState(initialData?.credit_type || 'cash');
  const [description, setDescription] = useState(initialData?.description || '');
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(initialData?.shop_id || '');

  useEffect(() => {
    const fetchShops = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching shops:', error);
      } else {
        setShops(data || []);
      }
    };

    fetchShops();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('credits')  // Use 'credits' instead of 'collections'
        .upsert({
          id: initialData?.id || undefined,
          user_id: user.id,
          shop_id: selectedShop,
          credit_date: date ? format(date, 'yyyy-MM-dd') : null,  // Use credit_date instead of collection_date
          amount: parseFloat(amount),
          credit_type: paymentType,
          description: description
        });

      if (error) throw error;
      
      onSuccess();
      setAmount('');
      setDescription('');
      setDate(new Date());
      setSelectedShop('');
      setPaymentType('cash');
      alert('Collection saved successfully!');
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-4">
      
      <div className="grid gap-4 py-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={format(date || new Date(), "PPP")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date || new Date(), "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date()
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="paymentType">Payment Type</Label>
          <Select value={paymentType} onValueChange={setPaymentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="shop">Shop</Label>
          <Select value={selectedShop} onValueChange={setSelectedShop}>
            <SelectTrigger>
              <SelectValue placeholder="Select shop" />
            </SelectTrigger>
            <SelectContent>
              {shops.length > 0 ? (
                shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no_shops">No shops available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit">Save Collection</Button>
    </form>
  );
};

export default CollectionForm;
