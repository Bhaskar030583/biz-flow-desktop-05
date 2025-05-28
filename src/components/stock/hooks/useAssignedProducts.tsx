
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export interface AssignedProduct {
  assignment_id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
  opening_stock?: number;
  stock_added?: number;
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
  shop_name?: string;
  shop_id?: string;
}

export const useAssignedProducts = (refreshTrigger: number) => {
  const { user } = useAuth();
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssignedProducts = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('=== FETCHING ASSIGNED PRODUCTS FOR STOCK LIST ===');
        
        // First, get the product assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from('product_shops')
          .select('id, product_id, shop_id')
          .eq('user_id', user.id);

        if (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
          throw assignmentError;
        }

        console.log('Product assignments:', assignments);

        if (!assignments || assignments.length === 0) {
          console.log('No product assignments found');
          setAssignedProducts([]);
          setShops([]);
          setProducts([]);
          toast.info('No products assigned to stores found');
          return;
        }

        // Get unique product IDs and shop IDs
        const productIds = [...new Set(assignments.map(a => a.product_id))];
        const shopIds = [...new Set(assignments.map(a => a.shop_id))];

        // Fetch products data
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, category, price, cost_price')
          .in('id', productIds);

        if (productsError) {
          console.error('Error fetching products:', productsError);
          throw productsError;
        }

        // Fetch stores data
        const { data: storesData, error: storesError } = await supabase
          .from('hr_stores')
          .select('id, store_name')
          .in('id', shopIds);

        if (storesError) {
          console.error('Error fetching stores:', storesError);
          throw storesError;
        }

        console.log('Products data:', productsData);
        console.log('Stores data:', storesData);

        // Transform data and get stock information
        const transformedProducts: AssignedProduct[] = [];
        
        for (const assignment of assignments) {
          const product = productsData?.find(p => p.id === assignment.product_id);
          const store = storesData?.find(s => s.id === assignment.shop_id);
          
          if (!product || !store) {
            console.log('Missing product or store data for assignment:', assignment);
            continue;
          }

          // Get latest stock data for this product and shop
          const { data: stockData, error: stockError } = await supabase
            .from('stocks')
            .select('*')
            .eq('product_id', product.id)
            .eq('shop_id', store.id)
            .eq('user_id', user.id)
            .order('stock_date', { ascending: false })
            .limit(1);

          if (stockError) {
            console.error('Error fetching stock data:', stockError);
          }

          const latestStock = stockData?.[0];
          const soldQuantity = latestStock ? 
            (latestStock.opening_stock + (latestStock.stock_added || 0)) - latestStock.actual_stock : 0;

          transformedProducts.push({
            assignment_id: assignment.id,
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            cost_price: product.cost_price,
            opening_stock: latestStock?.opening_stock || 0,
            stock_added: latestStock?.stock_added || 0,
            closing_stock: latestStock?.closing_stock || 0,
            actual_stock: latestStock?.actual_stock || 0,
            last_stock_date: latestStock?.stock_date || null,
            sold_quantity: Math.max(0, soldQuantity),
            shop_name: store.store_name,
            shop_id: store.id
          });
        }

        console.log('Transformed products:', transformedProducts);
        setAssignedProducts(transformedProducts);
        
        // Extract unique shops and products for filters
        const uniqueShops = storesData?.map(store => ({
          name: store.store_name,
          id: store.id
        })) || [];
        
        const uniqueProducts = productsData?.map(product => ({
          name: product.name,
          id: product.id
        })) || [];
        
        setShops(uniqueShops);
        setProducts(uniqueProducts);

        toast.success(`Loaded ${transformedProducts.length} assigned products`);

      } catch (error: any) {
        console.error("Error fetching assigned products:", error.message);
        toast.error("Failed to load assigned products data");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    };

    fetchAssignedProducts();
  }, [refreshTrigger, user?.id]);

  return {
    assignedProducts,
    loading,
    shops,
    products
  };
};
