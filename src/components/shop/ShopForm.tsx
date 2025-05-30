
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const shopSchema = z.object({
  store_name: z.string().min(2, { message: "Store name must be at least 2 characters" }),
  store_code: z.string().min(2, { message: "Store code must be at least 2 characters" }),
  address: z.string().min(1, { message: "Address is required" }),
});

type ShopFormValues = z.infer<typeof shopSchema>;

interface ShopFormProps {
  onSuccess?: () => void;
}

export function ShopForm({ onSuccess }: ShopFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      store_name: "",
      store_code: "",
      address: "",
    },
  });

  async function onSubmit(data: ShopFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a store",
      });
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      console.log("Creating HR store with data:", data);
      
      const { data: insertedData, error } = await supabase
        .from("hr_stores")
        .insert({
          store_name: data.store_name,
          store_code: data.store_code,
          address: data.address,
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        if (error.code === '23505' && error.message.includes('store_code')) {
          throw new Error("Store code already exists. Please choose a different code.");
        }
        throw error;
      }
      
      console.log("HR store created successfully:", insertedData);
      
      toast({
        title: "Store created",
        description: "Your store has been created successfully in the HR system",
      });
      
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating HR store:", error);
      setErrorMessage(error.message || "Something went wrong");
      toast({
        variant: "destructive",
        title: "Failed to create store",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Store (HR System)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Store management has been moved to the HRMS section. 
            Please use the HRMS → Stores section for full store management features.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm mb-4">
                {errorMessage}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="store_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter store name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="store_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter unique store code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter store address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Store"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
