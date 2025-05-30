import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface LossFormData {
  product_id: string;
  hr_shop_id: string;
  shift_id: string;
  loss_type: LossType;
  quantity_lost: number;
  reason: string | null;
  operator_name: string | null;
}

type LossType = "theft" | "damage" | "expiry" | "spillage" | "breakage" | "other";

const LossTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingLoss, setIsAddingLoss] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterShop, setFilterShop] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [filterLossType, setFilterLossType] = useState<LossType | "">("");

  // Fetch HR stores
  const { data: stores } = useQuery({
    queryKey: ['hr-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name')
        .order('store_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch shifts
  const { data: shifts } = useQuery({
    queryKey: ['hr-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_shifts')
        .select('id, shift_name')
        .eq('is_active', true)
        .order('shift_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch losses with filters
  const { data: losses, isLoading } = useQuery({
    queryKey: ['losses', selectedDate, filterShop, filterProduct, filterLossType],
    queryFn: async () => {
      let query = supabase
        .from('losses')
        .select(`
          *,
          products (name),
          hr_stores!losses_hr_shop_id_fkey (store_name)
        `)
        .eq('user_id', user?.id)
        .eq('loss_date', format(selectedDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      if (filterShop) {
        query = query.eq('hr_shop_id', filterShop);
      }
      if (filterProduct) {
        query = query.eq('product_id', filterProduct);
      }
      if (filterLossType) {
        query = query.eq('loss_type', filterLossType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(loss => ({
        ...loss,
        product_name: loss.products?.name || 'Unknown Product',
        store_name: loss.hr_stores?.store_name || 'Unknown Store'
      }));
    },
  });

  // Add new loss mutation
  const addLossMutation = useMutation({
    mutationFn: async (lossData: LossFormData) => {
      const { data, error } = await supabase
        .from('losses')
        .insert({
          user_id: user?.id,
          product_id: lossData.product_id,
          hr_shop_id: lossData.hr_shop_id,
          shift_id: lossData.shift_id,
          loss_type: lossData.loss_type,
          quantity_lost: lossData.quantity_lost,
          reason: lossData.reason,
          operator_name: lossData.operator_name,
          loss_date: format(selectedDate, 'yyyy-MM-dd')
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Loss recorded successfully");
      queryClient.invalidateQueries({ queryKey: ['losses'] });
      setIsAddingLoss(false);
    },
    onError: (error) => {
      console.error('Error recording loss:', error);
      toast.error("Failed to record loss");
    },
  });

  // Calculate summary data
  const summaryData = React.useMemo(() => {
    if (!losses || !products || !stores) return null;

    const totalLosses = losses.length;
    const totalQuantity = losses.reduce((sum, loss) => sum + loss.quantity_lost, 0);
    
    const lossTypeBreakdown = losses.reduce((acc, loss) => {
      acc[loss.loss_type] = (acc[loss.loss_type] || 0) + loss.quantity_lost;
      return acc;
    }, {} as Record<string, number>);

    const productBreakdown = losses.reduce((acc, loss) => {
      const productName = products.find(p => p.id === loss.product_id)?.name || 'Unknown';
      acc[productName] = (acc[productName] || 0) + loss.quantity_lost;
      return acc;
    }, {} as Record<string, number>);

    const storeBreakdown = losses.reduce((acc, loss) => {
      const storeName = stores.find(s => s.id === loss.hr_shop_id)?.store_name || 'Unknown';
      acc[storeName] = (acc[storeName] || 0) + loss.quantity_lost;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLosses,
      totalQuantity,
      lossTypeBreakdown,
      productBreakdown,
      storeBreakdown
    };
  }, [losses, products, stores]);

  // Helper function to validate loss type with proper type guard
  const isValidLossType = (value: string): value is LossType => {
    const validLossTypes: LossType[] = ["theft", "damage", "expiry", "spillage", "breakage", "other"];
    return validLossTypes.includes(value as LossType);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const lossTypeValue = formData.get('loss_type') as string;
    
    // Validate that the loss type is one of the allowed values using type guard
    if (!isValidLossType(lossTypeValue)) {
      toast.error("Invalid loss type selected");
      return;
    }
    
    // Now TypeScript knows lossTypeValue is a valid LossType, but we need explicit assertion
    const lossData: LossFormData = {
      product_id: formData.get('product_id') as string,
      hr_shop_id: formData.get('hr_shop_id') as string,
      shift_id: formData.get('shift_id') as string,
      loss_type: lossTypeValue as LossType, // Explicit type assertion after validation
      quantity_lost: parseInt(formData.get('quantity_lost') as string),
      reason: formData.get('reason') as string || null,
      operator_name: formData.get('operator_name') as string || null,
    };

    addLossMutation.mutate(lossData);
  };

  const lossTypeColors: Record<LossType, string> = {
    theft: "bg-red-100 text-red-800",
    damage: "bg-orange-100 text-orange-800",
    expiry: "bg-yellow-100 text-yellow-800",
    spillage: "bg-blue-100 text-blue-800",
    breakage: "bg-purple-100 text-purple-800",
    other: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Loss Tracking</h2>
        <Button onClick={() => setIsAddingLoss(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Record Loss
        </Button>
      </div>

      {/* Date and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Store</Label>
              <Select value={filterShop} onValueChange={setFilterShop}>
                <SelectTrigger>
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All stores</SelectItem>
                  {stores?.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Product</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All products</SelectItem>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Loss Type</Label>
              <Select value={filterLossType} onValueChange={(value: LossType | "") => setFilterLossType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="expiry">Expiry</SelectItem>
                  <SelectItem value="spillage">Spillage</SelectItem>
                  <SelectItem value="breakage">Breakage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterShop("");
                  setFilterProduct("");
                  setFilterLossType("");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Losses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.totalLosses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity Lost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summaryData.totalQuantity}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Affected Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {Object.entries(summaryData.productBreakdown).length > 0 
                  ? Object.entries(summaryData.productBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
                  : 'None'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Loss Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium capitalize">
                {Object.entries(summaryData.lossTypeBreakdown).length > 0 
                  ? Object.entries(summaryData.lossTypeBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
                  : 'None'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loss Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loss Records - {format(selectedDate, "PPP")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading loss records...</div>
          ) : losses && losses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Loss Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {losses.map((loss) => (
                  <TableRow key={loss.id}>
                    <TableCell className="text-sm">
                      {format(new Date(loss.created_at), "HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{loss.product_name}</TableCell>
                    <TableCell>{loss.store_name}</TableCell>
                    <TableCell>
                      <Badge className={lossTypeColors[loss.loss_type]}>
                        {loss.loss_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">
                      -{loss.quantity_lost}
                    </TableCell>
                    <TableCell>{loss.operator_name || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{loss.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>No loss records found for {format(selectedDate, "PPP")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Loss Modal */}
      {isAddingLoss && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Record Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product_id">Product *</Label>
                  <Select name="product_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hr_shop_id">Store *</Label>
                  <Select name="hr_shop_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores?.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.store_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shift_id">Shift</Label>
                  <Select name="shift_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts?.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.shift_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="loss_type">Loss Type *</Label>
                  <Select name="loss_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loss type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="expiry">Expiry</SelectItem>
                      <SelectItem value="spillage">Spillage</SelectItem>
                      <SelectItem value="breakage">Breakage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity_lost">Quantity Lost *</Label>
                  <Input
                    id="quantity_lost"
                    name="quantity_lost"
                    type="number"
                    min="1"
                    required
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <Label htmlFor="operator_name">Operator Name</Label>
                  <Input
                    id="operator_name"
                    name="operator_name"
                    placeholder="Who reported this loss?"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Describe the reason for the loss..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={addLossMutation.isPending} className="flex-1">
                    {addLossMutation.isPending ? "Recording..." : "Record Loss"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingLoss(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LossTracking;
