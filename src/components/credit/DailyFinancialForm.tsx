
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

interface DailyFinancialFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  credit_date: z.string().min(1, "Date is required"),
  shop_id: z.string().min(1, "Shop is required"),
  cash_amount: z.string().optional(),
  card_amount: z.string().optional(),
  online_amount: z.string().optional(),
  discount_amount: z.string().optional(),
});

const DailyFinancialForm: React.FC<DailyFinancialFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credit_date: format(new Date(), "yyyy-MM-dd"),
      shop_id: "",
      cash_amount: "0",
      card_amount: "0",
      online_amount: "0",
      discount_amount: "0",
    },
  });

  // Fetch shops for dropdown
  const { data: shops = [] } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("shops")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");
      
      if (error) {
        console.error("Error fetching shops:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!user
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // First check if entries already exist for this date and shop
      const { data: existingEntries, error: checkError } = await supabase
        .from("credits")
        .select("id, credit_type")
        .eq("user_id", user.id)
        .eq("credit_date", values.credit_date)
        .eq("shop_id", values.shop_id)
        .in("credit_type", ["cash", "card", "online", "discount"]);
      
      if (checkError) {
        toast.error("Failed to check existing entries");
        return;
      }
      
      // If entries exist, delete them first
      if (existingEntries && existingEntries.length > 0) {
        const { error: deleteError } = await supabase
          .from("credits")
          .delete()
          .eq("user_id", user.id)
          .eq("credit_date", values.credit_date)
          .eq("shop_id", values.shop_id)
          .in("credit_type", ["cash", "card", "online", "discount"]);
        
        if (deleteError) {
          toast.error("Failed to update existing entries");
          return;
        }
      }
      
      // Prepare data for insertion
      const financialEntries = [];
      
      // Only add entries with non-zero amounts
      if (parseFloat(values.cash_amount || "0") > 0) {
        financialEntries.push({
          user_id: user.id,
          shop_id: values.shop_id,
          credit_date: values.credit_date,
          credit_type: "cash",
          amount: parseFloat(values.cash_amount || "0"),
          description: "Daily cash collection"
        });
      }
      
      if (parseFloat(values.card_amount || "0") > 0) {
        financialEntries.push({
          user_id: user.id,
          shop_id: values.shop_id,
          credit_date: values.credit_date,
          credit_type: "card",
          amount: parseFloat(values.card_amount || "0"),
          description: "Daily card collection"
        });
      }
      
      if (parseFloat(values.online_amount || "0") > 0) {
        financialEntries.push({
          user_id: user.id,
          shop_id: values.shop_id,
          credit_date: values.credit_date,
          credit_type: "online",
          amount: parseFloat(values.online_amount || "0"),
          description: "Daily online collection"
        });
      }
      
      if (parseFloat(values.discount_amount || "0") > 0) {
        financialEntries.push({
          user_id: user.id,
          shop_id: values.shop_id,
          credit_date: values.credit_date,
          credit_type: "discount",
          amount: parseFloat(values.discount_amount || "0"),
          description: "Daily discount given"
        });
      }
      
      // Insert new entries
      if (financialEntries.length > 0) {
        const { error: insertError } = await supabase
          .from("credits")
          .insert(financialEntries);
        
        if (insertError) {
          console.error("Error inserting financial data:", insertError);
          toast.error("Failed to save financial data");
          return;
        }
        
        toast.success("Financial data saved successfully");
        onSuccess();
      } else {
        toast.error("At least one amount must be greater than zero");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = () => {
    const cash = parseFloat(form.watch("cash_amount") || "0");
    const card = parseFloat(form.watch("card_amount") || "0");
    const online = parseFloat(form.watch("online_amount") || "0");
    return cash + card + online;
  };

  // Format amount input to always show 2 decimal places
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value;
    if (value === '') {
      form.setValue(fieldName as any, '');
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Only format when user stops typing
      if (value.indexOf('.') === -1 || value.split('.')[1].length >= 2) {
        form.setValue(fieldName as any, numValue.toFixed(2));
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="credit_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shop_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shop</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shop" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shops.map((shop: any) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cash_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cash Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00"
                    disabled={isSubmitting}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleAmountChange(e, "cash_amount");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="card_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00"
                    disabled={isSubmitting}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleAmountChange(e, "card_amount");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="online_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UPI Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00"
                    disabled={isSubmitting}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleAmountChange(e, "online_amount");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00"
                    disabled={isSubmitting}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleAmountChange(e, "discount_amount");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-muted/20 rounded border border-dashed border-muted">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Collection Amount:</span>
              <span className="text-lg font-bold">₹{totalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Financial Data"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DailyFinancialForm;
