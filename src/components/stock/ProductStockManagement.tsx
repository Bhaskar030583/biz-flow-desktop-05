
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package2, Search } from "lucide-react";

// Import the new components
import ProductStockHeader from "./ProductStockHeader";
import ProductAssignmentForm from "./ProductAssignmentForm";
import ProductStockTable from "./ProductStockTable";
import StockEditDialog from "./StockEditDialog";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number | null;
}

interface Shop {
  id: string;
  name: string;
}

interface AssignedProduct extends Product {
  assignment_id: string;
  opening_stock?: number;
  stock_added?: number;
  closing_stock?: number;
  actual_stock?: number;
  last_stock_date?: string;
  sold_quantity?: number;
}

interface ProductStockManagementProps {
  onStockUpdated: () => void;
}

const ProductStockManagement = ({ onStockUpdated }: ProductStockManagementProps) => {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedProductToAssign, setSelectedProductToAssign] = useState<string>("");
  const [initialStockQuantity, setInitialStockQuantity] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [addStockQuantities, setAddStockQuantities] = useState<Record<string, string>>({});
  const [updatingStock, setUpdatingStock] = useState<Record<string, boolean>>({});
  const [editingProduct, setEditingProduct] = useState<AssignedProduct | null>(null);
  const [editStockValues, setEditStockValues] = useState({
    stock_added: 0,
    actual_stock: 0
  });
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  console.log("ProductStockManagement component loaded - showing products list with store filter and assignment functionality");

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchShops();
      checkUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (selectedShop) {
      fetchAssignedProducts();
    }
  }, [selectedShop]);

  const checkUserRole = async () => {
    try {
      // Handle the specific user with hardcoded admin role
      if (user?.id === 'a364aeaa-69e6-46c7-b72b-4c84ff863ef2') {
        console.log('Setting admin role for protected user');
        setIsAdmin(true);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log("Fetching all products for user:", user?.id);
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, cost_price')
        .eq('user_id', user?.id)
        .order('category, name');
      
      if (error) throw error;
      
      console.log("Fetched products:", data?.length || 0, "products");
      setAllProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchShops = async () => {
    try {
      console.log("Fetching shops for user:", user?.id);
      
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      
      console.log("Fetched shops:", data?.length || 0, "shops");
      setShops(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
      setLoading(false);
    }
  };

  const fetchAssignedProducts = async () => {
    if (!selectedShop) return;

    try {
      console.log("Fetching assigned products for shop:", selectedShop);
      
      const { data: directData, error: directError } = await supabase
        .from('product_shops')
        .select(`
          id,
          products (
            id,
            name,
            category,
            price,
            cost_price
          )
        `)
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id);
      
      if (directError) throw directError;
      
      // Get latest stock data and sales data for each assigned product
      const assignedProductsWithStock = await Promise.all(
        (directData || []).map(async (item: any) => {
          // Get latest stock data
          const { data: stockData, error: stockError } = await supabase
            .from('stocks')
            .select('opening_stock, stock_added, closing_stock, actual_stock, stock_date')
            .eq('product_id', item.products.id)
            .eq('shop_id', selectedShop)
            .order('stock_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (stockError) {
            console.error('Error fetching stock data:', stockError);
          }

          // Get today's sales data for this product
          const today = new Date().toISOString().split('T')[0];
          const { data: billItems, error: billError } = await supabase
            .from('bill_items')
            .select(`
              quantity,
              bills!inner(
                bill_date,
                user_id
              )
            `)
            .eq('product_id', item.products.id)
            .eq('bills.user_id', user?.id)
            .gte('bills.bill_date', today + 'T00:00:00')
            .lte('bills.bill_date', today + 'T23:59:59');

          if (billError) {
            console.error('Error fetching sales data:', billError);
          }

          const soldQuantity = billItems?.reduce((sum, billItem) => sum + billItem.quantity, 0) || 0;
          
          // Calculate closing stock based on sales
          const openingStock = stockData?.opening_stock || 0;
          const calculatedClosingStock = openingStock - soldQuantity;

          return {
            assignment_id: item.id,
            id: item.products.id,
            name: item.products.name,
            category: item.products.category,
            price: item.products.price,
            cost_price: item.products.cost_price,
            opening_stock: openingStock,
            stock_added: stockData?.stock_added || 0,
            closing_stock: calculatedClosingStock,
            actual_stock: stockData?.actual_stock || 0,
            sold_quantity: soldQuantity,
            last_stock_date: stockData?.stock_date || null
          };
        })
      );
      
      console.log("Fetched assigned products with stock:", assignedProductsWithStock.length, "products");
      setAssignedProducts(assignedProductsWithStock);
    } catch (error) {
      console.error('Error fetching assigned products:', error);
      toast.error('Failed to fetch assigned products');
    }
  };

  const assignProductToShop = async () => {
    if (!selectedProductToAssign || !selectedShop || !initialStockQuantity) {
      toast.error('Please select a product, shop, and enter initial stock quantity');
      return;
    }

    const stockQuantity = parseInt(initialStockQuantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      console.log("Assigning product to shop with initial stock:", selectedProductToAssign, selectedShop, stockQuantity);
      
      // First, assign the product to the shop
      const { error: assignError } = await supabase
        .from('product_shops')
        .insert({
          product_id: selectedProductToAssign,
          shop_id: selectedShop,
          user_id: user?.id
        });
      
      if (assignError) {
        if (assignError.code === '23505') {
          toast.error('Product is already assigned to this shop');
        } else {
          throw assignError;
        }
        return;
      }

      // Then create the initial stock entry
      const { error: stockError } = await supabase
        .from('stocks')
        .insert({
          product_id: selectedProductToAssign,
          shop_id: selectedShop,
          stock_date: new Date().toISOString().split('T')[0],
          opening_stock: stockQuantity,
          closing_stock: stockQuantity,
          actual_stock: stockQuantity,
          stock_added: 0,
          user_id: user?.id
        });

      if (stockError) {
        console.error('Error creating initial stock entry:', stockError);
        // If stock creation fails, we should remove the product assignment
        await supabase
          .from('product_shops')
          .delete()
          .eq('product_id', selectedProductToAssign)
          .eq('shop_id', selectedShop)
          .eq('user_id', user?.id);
        throw stockError;
      }
      
      toast.success('Product assigned to shop with initial stock successfully');
      setSelectedProductToAssign("");
      setInitialStockQuantity("");
      setShowAssignForm(false);
      fetchAssignedProducts();
      onStockUpdated();
    } catch (error) {
      console.error('Error assigning product to shop:', error);
      toast.error('Failed to assign product to shop');
    }
  };

  const removeProductFromShop = async (assignmentId: string, productName: string) => {
    console.log("removeProductFromShop called with:", { assignmentId, productName });
    
    if (!assignmentId || !productName) {
      console.error("Missing required parameters:", { assignmentId, productName });
      toast.error('Invalid parameters for deassignment');
      return;
    }

    if (!confirm(`Are you sure you want to deassign "${productName}" from this store? This will remove all stock data for this product.`)) {
      console.log("User cancelled deassignment");
      return;
    }

    try {
      console.log("Starting deassignment process for:", assignmentId);
      
      // First, get the product assignment details with more detailed logging
      console.log("Fetching assignment details from product_shops table...");
      const { data: assignmentData, error: fetchError } = await supabase
        .from('product_shops')
        .select('product_id, shop_id')
        .eq('id', assignmentId)
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log("Assignment fetch result:", { assignmentData, fetchError });

      if (fetchError) {
        console.error('Error fetching assignment details:', fetchError);
        toast.error('Failed to find product assignment');
        return;
      }

      if (!assignmentData) {
        console.log("No assignment data found for ID:", assignmentId);
        toast.error('Product assignment not found');
        return;
      }

      console.log("Found assignment data:", assignmentData);

      // Delete all stock entries for this product-shop combination first
      console.log("Deleting stock entries for product:", assignmentData.product_id, "in shop:", assignmentData.shop_id);
      const { error: stockError } = await supabase
        .from('stocks')
        .delete()
        .eq('product_id', assignmentData.product_id)
        .eq('shop_id', assignmentData.shop_id)
        .eq('user_id', user?.id);

      if (stockError) {
        console.error('Error deleting stock entries:', stockError);
        toast.warning('Some stock entries could not be deleted, but proceeding with deassignment');
      } else {
        console.log("Successfully deleted stock entries");
      }

      // Then delete the product assignment
      console.log("Deleting product assignment with ID:", assignmentId);
      const { error: assignmentError } = await supabase
        .from('product_shops')
        .delete()
        .eq('id', assignmentId)
        .eq('user_id', user?.id);
      
      console.log("Assignment deletion result:", { assignmentError });

      if (assignmentError) {
        console.error('Error deleting product assignment:', assignmentError);
        toast.error('Failed to deassign product from store');
        return;
      }
      
      console.log("Successfully completed deassignment");
      toast.success(`${productName} deassigned from store successfully`);
      fetchAssignedProducts();
      onStockUpdated();
    } catch (error) {
      console.error('Unexpected error during deassignment:', error);
      toast.error('Failed to deassign product from store');
    }
  };

  const handleAddStock = async (productId: string) => {
    // This function is kept for non-admin users only
    if (isAdmin) {
      toast.error('Admins cannot add stock through this interface');
      return;
    }

    const quantity = addStockQuantities[productId];
    if (!quantity || parseInt(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setUpdatingStock(prev => ({ ...prev, [productId]: true }));

    try {
      const today = new Date().toISOString().split('T')[0];
      const stockToAdd = parseInt(quantity);

      // Get current stock data
      const { data: currentStock, error: fetchError } = await supabase
        .from('stocks')
        .select('*')
        .eq('product_id', productId)
        .eq('shop_id', selectedShop)
        .eq('stock_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (currentStock) {
        // Update existing stock entry
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            stock_added: (currentStock.stock_added || 0) + stockToAdd,
            closing_stock: currentStock.closing_stock + stockToAdd,
            actual_stock: currentStock.actual_stock + stockToAdd
          })
          .eq('id', currentStock.id);

        if (updateError) throw updateError;
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stocks')
          .insert({
            product_id: productId,
            shop_id: selectedShop,
            stock_date: today,
            opening_stock: 0,
            closing_stock: stockToAdd,
            actual_stock: stockToAdd,
            stock_added: stockToAdd,
            user_id: user?.id
          });

        if (insertError) throw insertError;
      }

      toast.success(`Added ${stockToAdd} units to stock`);
      setAddStockQuantities(prev => ({ ...prev, [productId]: "" }));
      fetchAssignedProducts();
      onStockUpdated();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    } finally {
      setUpdatingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleDeleteStock = async (productId: string, productName: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete stock entries');
      return;
    }

    if (!confirm(`Are you sure you want to delete all stock entries for "${productName}"? This will also remove the product assignment from this store.`)) {
      return;
    }

    try {
      console.log("=== STARTING DELETE STOCK PROCESS ===");
      console.log("Product ID:", productId);
      console.log("Product Name:", productName);
      console.log("Selected Shop:", selectedShop);
      console.log("User ID:", user?.id);
      
      // Step 1: Find the product assignment first
      console.log("Step 1: Finding product assignment...");
      const { data: assignmentData, error: assignmentFetchError } = await supabase
        .from('product_shops')
        .select('id, product_id, shop_id')
        .eq('product_id', productId)
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log("Assignment query result:", { assignmentData, assignmentFetchError });

      if (assignmentFetchError) {
        console.error('Error finding product assignment:', assignmentFetchError);
        toast.error('Failed to find product assignment');
        return;
      }

      if (!assignmentData) {
        console.log("No assignment found for this product-shop combination");
        toast.error('Product assignment not found');
        return;
      }

      console.log("Found assignment:", assignmentData);

      // Step 2: Delete all stock entries for this product-shop combination
      console.log("Step 2: Deleting stock entries...");
      const { error: stockError } = await supabase
        .from('stocks')
        .delete()
        .eq('product_id', productId)
        .eq('shop_id', selectedShop)
        .eq('user_id', user?.id);

      if (stockError) {
        console.error('Error deleting stock entries:', stockError);
        toast.error('Failed to delete stock entries');
        return;
      }

      console.log("Stock entries deleted successfully");

      // Step 3: Delete the product assignment
      console.log("Step 3: Deleting product assignment...");
      const { error: assignmentDeleteError } = await supabase
        .from('product_shops')
        .delete()
        .eq('id', assignmentData.id)
        .eq('user_id', user?.id);

      if (assignmentDeleteError) {
        console.error('Error deleting product assignment:', assignmentDeleteError);
        toast.error('Stock deleted but failed to remove product assignment');
        return;
      }

      console.log("Product assignment deleted successfully");
      console.log("=== DELETE STOCK PROCESS COMPLETED ===");

      toast.success(`"${productName}" removed from store completely`);
      
      // Step 4: Refresh the data to update the UI
      console.log("Step 4: Refreshing data...");
      await fetchAssignedProducts();
      onStockUpdated();
      console.log("Data refresh completed");
      
    } catch (error) {
      console.error('Unexpected error during delete process:', error);
      toast.error('Failed to delete stock entries');
    }
  };

  const handleEditStock = (product: AssignedProduct) => {
    setEditingProduct(product);
    setEditStockValues({
      stock_added: product.stock_added || 0,
      actual_stock: product.actual_stock || 0
    });
  };

  const handleUpdateStock = async () => {
    if (!editingProduct) return;

    setIsUpdatingStock(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get current stock data
      const { data: currentStock, error: fetchError } = await supabase
        .from('stocks')
        .select('*')
        .eq('product_id', editingProduct.id)
        .eq('shop_id', selectedShop)
        .eq('stock_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (currentStock) {
        // Update existing stock entry
        const { error: updateError } = await supabase
          .from('stocks')
          .update({
            stock_added: editStockValues.stock_added,
            actual_stock: editStockValues.actual_stock
          })
          .eq('id', currentStock.id);

        if (updateError) throw updateError;
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stocks')
          .insert({
            product_id: editingProduct.id,
            shop_id: selectedShop,
            stock_date: today,
            opening_stock: editingProduct.opening_stock || 0,
            closing_stock: editingProduct.closing_stock || 0,
            actual_stock: editStockValues.actual_stock,
            stock_added: editStockValues.stock_added,
            user_id: user?.id
          });

        if (insertError) throw insertError;
      }

      toast.success('Stock updated successfully');
      setEditingProduct(null);
      fetchAssignedProducts();
      onStockUpdated();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
    ];
    const index = category.length % colors.length;
    return colors[index];
  };

  const getUnassignedProducts = () => {
    if (!selectedShop) return allProducts;
    
    const assignedProductIds = assignedProducts.map(p => p.id);
    return allProducts.filter(product => !assignedProductIds.includes(product.id));
  };

  const filteredAssignedProducts = assignedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCancelAssignForm = () => {
    setShowAssignForm(false);
    setSelectedProductToAssign("");
    setInitialStockQuantity("");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200">
        <ProductStockHeader
          assignedProductsCount={assignedProducts.length}
          isAdmin={isAdmin}
          selectedShop={selectedShop}
          setSelectedShop={setSelectedShop}
          shops={shops}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showAssignForm={showAssignForm}
          setShowAssignForm={setShowAssignForm}
        />
        <CardContent className="space-y-4">
          <ProductAssignmentForm
            showAssignForm={showAssignForm}
            unassignedProducts={getUnassignedProducts()}
            selectedProductToAssign={selectedProductToAssign}
            setSelectedProductToAssign={setSelectedProductToAssign}
            initialStockQuantity={initialStockQuantity}
            setInitialStockQuantity={setInitialStockQuantity}
            onAssignProduct={assignProductToShop}
            onCancel={handleCancelAssignForm}
          />
        </CardContent>
      </Card>

      {selectedShop && filteredAssignedProducts.length > 0 ? (
        <Card>
          <CardContent>
            <ProductStockTable
              filteredProducts={filteredAssignedProducts}
              isAdmin={isAdmin}
              addStockQuantities={addStockQuantities}
              setAddStockQuantities={setAddStockQuantities}
              updatingStock={updatingStock}
              onAddStock={handleAddStock}
              onEditStock={handleEditStock}
              onRemoveProduct={removeProductFromShop}
              onDeleteStock={handleDeleteStock}
            />
          </CardContent>
        </Card>
      ) : selectedShop && filteredAssignedProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {searchTerm ? (
              <p className="text-gray-600">No assigned products found matching "{searchTerm}"</p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600">No products assigned to this store yet.</p>
                <p className="text-sm text-gray-500">Click "Assign Product" to add products to this store with initial stock.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <StockEditDialog
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        editStockValues={editStockValues}
        setEditStockValues={setEditStockValues}
        selectedShop={selectedShop}
        shops={shops}
        onUpdateStock={handleUpdateStock}
        isUpdatingStock={isUpdatingStock}
      />
    </div>
  );
};

export default ProductStockManagement;
