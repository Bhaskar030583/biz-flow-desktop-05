
import React, { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

interface CreditFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  creditToEdit?: {
    id: string;
    credit_date: string;
    credit_type: string;
    amount: number;
    description: string;
    hr_shop_id: string;
  } | null;
}

const formSchema = z.object({
  credit_date: z.string().min(1, "Date is required"),
  credit_type: z.string().min(1, "Credit type is required"),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  description: z.string().optional(),
  hr_shop_id: z.string().min(1, "Store is required"),
});

const CreditForm: React.FC<CreditFormProps> = ({ onSuccess, onCancel, creditToEdit }) => {
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credit_date: creditToEdit ? format(new Date(creditToEdit.credit_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      credit_type: creditToEdit?.credit_type || "received",
      amount: creditToEdit ? Number(creditToEdit.amount).toFixed(2) : "",
      description: creditToEdit?.description || "",
      hr_shop_id: creditToEdit?.hr_shop_id || "",
    },
  });

  // Fetch HR stores for dropdown
  const { data: hrStores = [] } = useQuery({
    queryKey: ["hr_stores"],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("hr_stores")
        .select("id, store_name")
        .order("store_name");
      
      if (error) {
        console.error("Error fetching HR stores:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (creditToEdit) {
      form.reset({
        credit_date: format(new Date(creditToEdit.credit_date), "yyyy-MM-dd"),
        credit_type: creditToEdit.credit_type,
        amount: Number(creditToEdit.amount).toFixed(2),
        description: creditToEdit.description || "",
        hr_shop_id: creditToEdit.hr_shop_id,
      });
    }
  }, [creditToEdit, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    try {
      const creditData = {
        credit_date: values.credit_date,
        credit_type: values.credit_type,
        amount: Number(values.amount),
        description: values.description,
        hr_shop_id: values.hr_shop_id,
        user_id: user.id,
      };

      let error;

      if (creditToEdit) {
        // Update existing credit
        const { error: updateError } = await supabase
          .from("credits")
          .update(creditData)
          .eq("id", creditToEdit.id)
          .eq("user_id", user.id);
        
        error = updateError;
      } else {
        // Insert new credit
        const { error: insertError } = await supabase
          .from("credits")
          .insert([creditData]);
        
        error = insertError;
      }

      if (error) {
        console.error("Error saving credit:", error);
        toast.error("Failed to save credit details");
        return;
      }

      onSuccess();
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error("An unexpected error occurred");
    }
  };

  // Format amount input to always show 2 decimal places
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      form.setValue('amount', '');
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Only format when user stops typing
      if (value.indexOf('.') === -1 || value.split('.')[1].length >= 2) {
        form.setValue('amount', numValue.toFixed(2));
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
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="credit_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="received">Credit Received</SelectItem>
                    <SelectItem value="given">Credit Given</SelectItem>
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
            name="hr_shop_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hrStores.map((store: any) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleAmountChange(e);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add details about this credit entry"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {creditToEdit ? "Update" : "Save"} Credit Entry
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreditForm;
