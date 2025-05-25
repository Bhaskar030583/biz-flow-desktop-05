
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
  name: z.string().min(2, { message: "Store name must be at least 2 characters" }),
  address: z.string().optional(),
  phone: z.string().optional(),
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
      name: "",
      address: "",
      phone: "",
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
      console.log("Creating store with data:", { ...data, user_id: user.id });
      
      const { data: insertedData, error } = await supabase
        .from("shops")
        .insert({
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          user_id: user.id,
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Store created successfully:", insertedData);
      
      toast({
        title: "Store created",
        description: "Your store has been created successfully",
      });
      
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating store:", error);
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
        <CardTitle>Add New Store</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm mb-4">
                {errorMessage}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="name"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter store address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
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
