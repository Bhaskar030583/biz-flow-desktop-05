
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
        
        // First, get the product assignments - checking both shops and hr_stores
        let assignments = [];
        let storesData = [];
        
        // Try to get assignments from product_shops table first
        const { data: productShopAssignments, error: shopAssignmentError } = await supabase
          .from('product_shops')
          .select('id, product_id, shop_id')
          .eq('user_id', user.id);

        if (productShopAssignments && productShopAssignments.length > 0) {
          assignments = productShopAssignments;
          
          // Get unique shop IDs
          const shopIds = [...new Set(assignments.map(a => a.shop_id))];
          
          // Try to fetch from shops table first
          const { data: shopsTableData, error: shopsError } = await supabase
            .from('shops')
            .select('id, name, store_code')
            .in('id', shopIds);

          if (shopsTableData && shopsTableData.length > 0) {
            storesData = shopsTableData.map(shop => ({
              id: shop.id,
              store_name: shop.name,
              store_code: shop.store_code
            }));
          } else {
            // If no data in shops table, try hr_stores
            const { data: hrStoresData, error: hrStoresError } = await supabase
              .from('hr_stores')
              .select('id, store_name, store_code')
              .in('id', shopIds);

            if (hrStoresData) {
              storesData = hrStoresData;
            }
          }
        } else {
          // If no product_shops assignments, check if we should create them from hr_stores
          console.log('No product_shops assignments found, checking hr_stores');
          
          // Get all hr_stores
          const { data: hrStoresData, error: hrStoresError } = await supabase
            .from('hr_stores')
            .select('id, store_name, store_code');

          if (hrStoresData && hrStoresData.length > 0) {
            storesData = hrStoresData;
            // For now, we'll show empty assignments but available stores
            assignments = [];
          }
        }

        console.log('Product assignments:', assignments);
        console.log('Stores data:', storesData);

        if (assignments.length === 0) {
          console.log('No product assignments found');
          setAssignedProducts([]);
          setShops(storesData.map(store => ({
            name: store.store_name,
            id: store.id
          })));
          setProducts([]);
          return;
        }

        // Get unique product IDs
        const productIds = [...new Set(assignments.map(a => a.product_id))];

        // Fetch products data
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, category, price, cost_price')
          .in('id', productIds);

        if (productsError) {
          console.error('Error fetching products:', productsError);
          throw productsError;
        }

        console.log('Products data:', productsData);

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

        if (transformedProducts.length > 0) {
          toast.success(`Loaded ${transformedProducts.length} assigned products`);
        }

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
