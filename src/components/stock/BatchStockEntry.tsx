import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Calendar,
  Package,
  Edit,
  Calculator,
  Filter,
  Search
} from "lucide-react";
import { BatchStockEntryModal } from "./BatchStockEntryModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDataSyncActions } from "@/context/DataSyncContext";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Shop {
  id: string;
  name: string;
}

interface StockEntry {
  id: string;
  product_id: string;
  product_name: string;
  shop_id: string;
  opening_stock: number;
  actual_stock: number;
  closing_stock: number;
  stock_added: number;
  price: number;
  category: string;
}

interface BatchStockEntryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BatchStockEntry: React.FC<BatchStockEntryProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { syncAfterStockChange } = useDataSyncActions();
  const [stockDate, setStockDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [shift, setShift] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchShops();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    }
  };

  const handleEditEntry = (entry: StockEntry) => {
    setSelectedEntry(entry);
    setModalOpen(true);
  };

  const handleSaveEntry = (updatedEntry: StockEntry) => {
    setStockEntries(prev => 
      prev.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
    toast.success('Entry updated successfully');
  };

  const addProductToEntry = (product: Product) => {
    if (!selectedShop) {
      toast.error('Please select a shop first');
      return;
    }

    const exists = stockEntries.find(entry => entry.product_id === product.id);
    if (exists) {
      toast.error('Product already added to batch');
      return;
    }

    const newEntry: StockEntry = {
      id: `temp-${Date.now()}-${product.id}`,
      product_id: product.id,
      product_name: product.name,
      shop_id: selectedShop,
      opening_stock: 0,
      actual_stock: 0,
      closing_stock: 0,
      stock_added: 0,
      price: product.price,
      category: product.category
    };

    setStockEntries(prev => [...prev, newEntry]);
  };

  const removeEntry = (id: string) => {
    setStockEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const calculateTotalValue = () => {
    return stockEntries.reduce((sum, entry) => sum + (entry.actual_stock * entry.price), 0);
  };

  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
    return categories;
  };

  const handleSubmit = async () => {
    if (!selectedShop) {
      toast.error('Please select a shop');
      return;
    }

    if (stockEntries.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
      const stockData = stockEntries.map(entry => ({
        stock_date: stockDate,
        product_id: entry.product_id,
        shop_id: selectedShop,
        opening_stock: entry.opening_stock,
        actual_stock: entry.actual_stock,
        closing_stock: entry.closing_stock,
        stock_added: entry.stock_added || 0,
        shift: shift || null,
        operator_name: operatorName || null,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('stocks')
        .insert(stockData);

      if (error) throw error;

      // Trigger data synchronization
      await syncAfterStockChange('create', { count: stockEntries.length });
      onSuccess();
    } catch (error) {
      console.error('Error saving stock entries:', error);
      toast.error('Failed to save stock entries');
    } finally {
      setLoading(false);
    }
  };

  // Filter out shops and products with empty or invalid IDs
  const validShops = shops.filter(shop => {
    const hasValidId = shop.id && shop.id.trim() !== "";
    const hasValidName = shop.name && shop.name.trim() !== "";
    return hasValidId && hasValidName;
  });

  const validCategories = getCategories();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedEntries = stockEntries.reduce((groups, entry) => {
    const category = entry.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(entry);
    return groups;
  }, {} as Record<string, StockEntry[]>);

  // Show login message if user is not authenticated
  if (!user) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Please log in to access batch stock entry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Package className="h-5 w-5" />
            Batch Stock Entry
            {stockEntries.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stockEntries.length} items • ₹{calculateTotalValue().toFixed(2)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
            <div>
              <Label htmlFor="date">Stock Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={stockDate}
                  onChange={(e) => setStockDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shop">Shop</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shop" />
                </SelectTrigger>
                <SelectContent>
                  {validShops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shift">Shift (Optional)</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="operator">Operator Name (Optional)</Label>
              <Input
                id="operator"
                placeholder="Enter operator name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Products
            </CardTitle>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {validCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.map(product => (
                <Button
                  key={product.id}
                  variant="outline"
                  className="w-full justify-between h-auto p-3"
                  onClick={() => addProductToEntry(product)}
                  disabled={stockEntries.some(entry => entry.product_id === product.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.category}</div>
                  </div>
                  <Badge variant="secondary">₹{product.price}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Stock Entries ({stockEntries.length})
              </span>
              {stockEntries.length > 0 && (
                <Badge className="bg-green-100 text-green-800">
                  Total: ₹{calculateTotalValue().toFixed(2)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedEntries).map(([category, entries]) => (
                <div key={category}>
                  <Badge variant="outline" className="mb-2">
                    {category} ({entries.length})
                  </Badge>
                  <div className="space-y-2">
                    {entries.map(entry => (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium">{entry.product_name}</div>
                            <div className="text-sm text-gray-500">
                              ₹{entry.price} • Value: ₹{(entry.actual_stock * entry.price).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEntry(entry)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeEntry(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Opening: {entry.opening_stock}</div>
                          <div>Added: {entry.stock_added}</div>
                          <div className="font-bold text-green-600">
                            Actual: {entry.actual_stock}
                          </div>
                          <div className="font-bold text-orange-600">
                            Closing: {entry.closing_stock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {category !== Object.keys(groupedEntries)[Object.keys(groupedEntries).length - 1] && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row justify-end'}`}>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || stockEntries.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save {stockEntries.length} Entries
        </Button>
      </div>

      {/* Modal for editing entries */}
      <BatchStockEntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        entry={selectedEntry}
        onSave={handleSaveEntry}
      />
    </div>
  );
};

export default BatchStockEntry;
