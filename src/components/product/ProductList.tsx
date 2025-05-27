
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Package, IndianRupee, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  quantity: number;
  created_at: string;
}

export function ProductList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteError, setShowDeleteError] = useState(false);

  const productSchema = z.object({
    name: z.string().min(2, "Name is required"),
    category: z.string().min(1, "Category is required"),
    quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
    price: z.coerce.number().min(0, "Price must be a positive number"),
    cost_price: z.coerce.number().min(0, "Cost price must be a positive number").optional(),
  });

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      quantity: 0,
      price: 0,
      cost_price: 0,
    },
  });

  useEffect(() => {
    if (!user) return;
    
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        // Make sure to handle products with missing cost_price and quantity
        const productsWithDefaults = (data || []).map(product => ({
          ...product,
          cost_price: product.cost_price !== undefined ? product.cost_price : null,
          quantity: product.quantity !== undefined ? product.quantity : 0
        })) as Product[];
        
        setProducts(productsWithDefaults);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((data || []).map(product => product.category))
        );
        setCategories(uniqueCategories);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to fetch products",
          description: error.message || "Something went wrong",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, [user]);

  async function handleDelete(id: string, productName: string) {
    try {
      console.log("Attempting to delete product:", id, productName);
      
      // First, check if product is assigned to any shops
      const { data: assignments, error: assignmentError } = await supabase
        .from("product_shops")
        .select("id")
        .eq("product_id", id);
      
      if (assignmentError) {
        console.error("Error checking product assignments:", assignmentError);
        throw new Error("Failed to check product assignments");
      }

      if (assignments && assignments.length > 0) {
        setDeleteError(`Cannot delete "${productName}" because it is assigned to one or more stores. Please remove it from all stores first.`);
        setShowDeleteError(true);
        return;
      }

      // Check if product has any stock entries
      const { data: stockEntries, error: stockError } = await supabase
        .from("stocks")
        .select("id")
        .eq("product_id", id);
      
      if (stockError) {
        console.error("Error checking product stock:", stockError);
        throw new Error("Failed to check product stock entries");
      }

      if (stockEntries && stockEntries.length > 0) {
        setDeleteError(`Cannot delete "${productName}" because it has stock entries. Please remove all stock entries first.`);
        setShowDeleteError(true);
        return;
      }

      // Check if product is in any bills
      const { data: billItems, error: billError } = await supabase
        .from("bill_items")
        .select("id")
        .eq("product_id", id);
      
      if (billError) {
        console.error("Error checking product bills:", billError);
        throw new Error("Failed to check product sales history");
      }

      if (billItems && billItems.length > 0) {
        setDeleteError(`Cannot delete "${productName}" because it has sales history. Products with sales records cannot be deleted.`);
        setShowDeleteError(true);
        return;
      }

      // If all checks pass, proceed with deletion
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setProducts(products.filter(product => product.id !== id));
      
      toast({
        title: "Product deleted",
        description: `"${productName}" has been deleted successfully`,
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      setDeleteError(error.message || "Failed to delete product. Please try again.");
      setShowDeleteError(true);
    }
  }
  
  function handleEdit(product: Product) {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      cost_price: product.cost_price || undefined,
    });
  }
  
  async function handleSaveEdit() {
    try {
      setIsProcessing(true);
      const values = form.getValues();
      
      const { error } = await supabase
        .from("products")
        .update({
          name: values.name,
          category: values.category,
          quantity: values.quantity,
          price: values.price,
          cost_price: values.cost_price || null,
        })
        .eq("id", editingProduct?.id as string);
      
      if (error) throw error;
      
      // Update local state
      setProducts(products.map(product => 
        product.id === editingProduct?.id 
          ? { ...product, ...values } 
          : product
      ));
      
      setEditingProduct(null);
      toast({
        title: "Product updated",
        description: "The product has been updated successfully",
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update product",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsProcessing(false);
    }
  }
  
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  if (loading) {
    return <div className="text-center py-4">Loading products...</div>;
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-muted-foreground">
            No products found. Please add a product to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Products</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              <Package className="mr-1 h-4 w-4" />
              {category}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      {product.quantity}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      {product.cost_price !== null ? product.cost_price.toFixed(2) : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      {product.price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="h-8 px-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id, product.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Error Dialog */}
      <Dialog open={showDeleteError} onOpenChange={setShowDeleteError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{deleteError}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDeleteError(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
