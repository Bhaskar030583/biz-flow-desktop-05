
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  created_at: string;
}

export function ProductList() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        setProducts(data || []);
        
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

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setProducts(products.filter(product => product.id !== id));
      
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete product",
        description: error.message || "Something went wrong",
      });
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
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
