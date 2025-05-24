import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Expense, ExpenseCategory } from '@/hooks/useExpenseManagement';

interface Category {
  value: ExpenseCategory;
  label: string;
}

interface ExpenseEditDialogProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  shops: Array<{ id: string; name: string }>;
  categories?: Category[];
}

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'online', label: 'Online' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

const defaultCategories: Category[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'other', label: 'Other' },
];

const ExpenseEditDialog: React.FC<ExpenseEditDialogProps> = ({
  expense,
  isOpen,
  onClose,
  onSave,
  shops,
  categories = defaultCategories,
}) => {
  const [editedExpense, setEditedExpense] = React.useState<Expense | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  React.useEffect(() => {
    if (expense) {
      setEditedExpense(expense);
      setSelectedDate(new Date(expense.expense_date));
    }
  }, [expense]);

  const handleSave = () => {
    if (editedExpense && selectedDate) {
      const updatedExpense = {
        ...editedExpense,
        expense_date: format(selectedDate, 'yyyy-MM-dd'),
      };
      onSave(updatedExpense);
      onClose();
    }
  };

  if (!editedExpense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editedExpense.description}
              onChange={(e) => setEditedExpense({...editedExpense, description: e.target.value})}
              placeholder="Enter expense description"
            />
          </div>

          <div>
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              value={editedExpense.amount}
              onChange={(e) => setEditedExpense({...editedExpense, amount: parseFloat(e.target.value) || 0})}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="edit-category">Category</Label>
            <Select 
              value={editedExpense.category} 
              onValueChange={(value: ExpenseCategory) => setEditedExpense({...editedExpense, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-shop">Shop</Label>
            <Select 
              value={editedExpense.shop_id} 
              onValueChange={(value) => setEditedExpense({...editedExpense, shop_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Expense Date</Label>
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
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="edit-payment-method">Payment Method</Label>
            <Select 
              value={editedExpense.payment_method} 
              onValueChange={(value) => setEditedExpense({...editedExpense, payment_method: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseEditDialog;
