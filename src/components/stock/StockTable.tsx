import React, { useState } from "react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Clock, User, ChevronDown, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StockEntry {
  id: string;
  stock_date: string;
  opening_stock: number;
  closing_stock: number;
  actual_stock: number;
  stock_added?: number;
  shift?: string;
  operator_name?: string;
  shops?: { id: string; name: string };
  products?: { id: string; name: string; price: number; cost_price: number | null };
}

interface StockTableProps {
  entries: StockEntry[];
  sortField: string;
  sortDirection: "asc" | "desc";
  handleSortChange: (field: string) => void;
  calculateProfit: (entry: StockEntry) => number;
  onEntryUpdated?: () => void;
}

const StockTable = ({ 
  entries, 
  sortField, 
  sortDirection, 
  handleSortChange,
  calculateProfit,
  onEntryUpdated
}: StockTableProps) => {
  const { user } = useAuth();
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [editedValues, setEditedValues] = useState({ 
    opening_stock: 0,
    closing_stock: 0, 
    actual_stock: 0,
    stock_added: 0 
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user is admin
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsAdmin(data.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const handleEditClick = (entry: StockEntry) => {
    console.log('Editing entry with stock_added:', entry.stock_added); // Debug log
    setEditingEntry(entry);
    setEditedValues({
      opening_stock: entry.opening_stock,
      closing_stock: entry.closing_stock,
      actual_stock: entry.actual_stock,
      stock_added: entry.stock_added || 0
    });
  };

  const handleEditedValueChange = (field: keyof typeof editedValues, value: number) => {
    setEditedValues(prev => {
      const newValues = { ...prev, [field]: Math.max(0, value) };
      
      // When stock is added, update the closing stock
      if (field === 'stock_added' && editingEntry) {
        const stockDifference = Math.max(0, value) - (editingEntry.stock_added || 0);
        newValues.closing_stock = Math.max(0, prev.closing_stock + stockDifference);
      }
      
      return newValues;
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    setIsProcessing(true);
    
    try {
      // Create an update object that only includes what we're allowed to update
      const updateData: any = {
        closing_stock: editedValues.closing_stock,
        actual_stock: editedValues.actual_stock,
        stock_added: editedValues.stock_added
      };
      
      // Only admins can update opening_stock
      if (isAdmin) {
        updateData.opening_stock = editedValues.opening_stock;
      }
      
      console.log('Updating stock with data:', updateData); // Debug log
      
      const { error } = await supabase
        .from('stocks')
        .update(updateData)
        .eq('id', editingEntry.id);
      
      if (error) throw error;
      
      toast.success('Stock entry updated successfully');
      setEditingEntry(null);
      
      // Refresh the data
      if (onEntryUpdated) onEntryUpdated();
      
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error(error.message || 'Failed to update stock entry');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    
    setIsProcessing(true);
    
    try {
      const { error } = await supabase
        .from('stocks')
        .delete()
        .eq('id', entryToDelete);
        
      if (error) throw error;
      
      toast.success('Stock entry deleted successfully');
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      
      // Refresh the data
      if (onEntryUpdated) onEntryUpdated();
      
    } catch (error: any) {
      console.error('Error deleting stock:', error);
      toast.error(error.message || 'Failed to delete stock entry');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Desktop view */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSortChange("stock_date")}>
                  Date
                  {sortField === "stock_date" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Opening Stock</TableHead>
              <TableHead className="text-right">Stock Added</TableHead>
              <TableHead className="text-right">Closing Stock</TableHead>
              <TableHead className="text-right">Actual Stock</TableHead>
              <TableHead>Shift / Operator</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("units_sold")}>
                  Units Sold
                  {sortField === "units_sold" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("sales_amount")}>
                  Sales Amount
                  {sortField === "sales_amount" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("profit")}>
                  Profit/Loss
                  {sortField === "profit" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => {
              const sold = entry.opening_stock - entry.closing_stock;
              const salesAmount = sold * Number(entry.products?.price || 0);
              const profit = calculateProfit(entry);
              
              console.log(`Entry ${entry.id} stock_added:`, entry.stock_added); // Debug log

              return (
                <TableRow 
                  key={entry.id} 
                  className="hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    {format(new Date(entry.stock_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{entry.shops?.name}</TableCell>
                  <TableCell>{entry.products?.name}</TableCell>
                  <TableCell className="text-right">{entry.opening_stock}</TableCell>
                  <TableCell className="text-right font-medium text-blue-600">
                    {entry.stock_added !== null && entry.stock_added !== undefined ? entry.stock_added : 0}
                  </TableCell>
                  <TableCell className="text-right">{entry.closing_stock}</TableCell>
                  <TableCell className="text-right">{entry.actual_stock}</TableCell>
                  <TableCell>
                    {entry.shift && (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <Badge variant="outline" className="font-normal">
                            {entry.shift}
                          </Badge>
                        </div>
                        {entry.operator_name && (
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{entry.operator_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{sold}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 mr-1" />
                      {salesAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 mr-1" />
                      {profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleEditClick(entry)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                          onClick={() => handleDeleteClick(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden space-y-4">
        {entries.map((entry, index) => {
          const sold = entry.opening_stock - entry.closing_stock;
          const salesAmount = sold * Number(entry.products?.price || 0);
          const profit = calculateProfit(entry);

          return (
            <div 
              key={entry.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{entry.products?.name}</h3>
                  <p className="text-muted-foreground text-sm">{entry.shops?.name}</p>
                </div>
                <Badge variant="outline">
                  {format(new Date(entry.stock_date), "dd/MM/yyyy")}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="responsive-table-cell" data-label="Stock">
                  <span className="text-sm">
                    Opening: {entry.opening_stock} 
                    {(entry.stock_added !== null && entry.stock_added !== undefined && entry.stock_added > 0) ? (
                      <span className="text-blue-600 font-medium"> (+{entry.stock_added} added)</span>
                    ) : ''} 
                    → Closing: {entry.closing_stock}
                  </span>
                </div>
                
                <div className="responsive-table-cell" data-label="Units Sold">
                  <span className="font-medium">{sold}</span>
                </div>

                <div className="responsive-table-cell" data-label="Sales Amount">
                  <div className="flex items-center">
                    <IndianRupee className="h-3.5 w-3.5 mr-1" />
                    <span>{salesAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="responsive-table-cell" data-label="Profit/Loss">
                  <div className={`flex items-center ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    <IndianRupee className="h-3.5 w-3.5 mr-1" />
                    <span>{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {entry.shift && (
                  <div className="flex items-center text-sm mt-2">
                    <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span className="mr-2">{entry.shift}</span>
                    {entry.operator_name && (
                      <>
                        <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">{entry.operator_name}</span>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-2 pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => handleEditClick(entry)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                      onClick={() => handleDeleteClick(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={editingEntry !== null} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stock Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <div className="font-medium">Product: {editingEntry.products?.name}</div>
                <div className="text-sm text-muted-foreground">Shop: {editingEntry.shops?.name}</div>
                <div className="text-sm text-muted-foreground">Date: {format(new Date(editingEntry.stock_date), "dd/MM/yyyy")}</div>
              </div>
              
              <div className="grid gap-4">
                {isAdmin && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Opening Stock</label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={editedValues.opening_stock} 
                      onChange={(e) => handleEditedValueChange('opening_stock', Number(e.target.value))}
                    />
                  </div>
                )}
                
                {!isAdmin && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Opening Stock</label>
                    <Input value={editingEntry.opening_stock} disabled={true} />
                  </div>
                )}
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Stock Added</label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={editedValues.stock_added} 
                    onChange={(e) => handleEditedValueChange('stock_added', Number(e.target.value))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Closing Stock</label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={editedValues.closing_stock} 
                    onChange={(e) => handleEditedValueChange('closing_stock', Number(e.target.value))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Actual Stock</label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={editedValues.actual_stock} 
                    onChange={(e) => handleEditedValueChange('actual_stock', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this stock entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockTable;
