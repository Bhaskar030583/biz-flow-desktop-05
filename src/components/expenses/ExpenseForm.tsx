
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, IndianRupee, Store, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseCategory } from '@/hooks/useExpenseManagement';

interface ExpenseFormProps {
  description: string;
  setDescription: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  category: ExpenseCategory;
  setCategory: (value: ExpenseCategory) => void;
  expenseDate: Date;
  setExpenseDate: (value: Date) => void;
  shopId: string;
  setShopId: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  isSubmitting: boolean;
  shops: { id: string; name: string }[];
  handleAddExpense: () => Promise<void>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  description,
  setDescription,
  amount,
  setAmount,
  category,
  setCategory,
  expenseDate,
  setExpenseDate,
  shopId,
  setShopId,
  paymentMethod,
  setPaymentMethod,
  isSubmitting,
  shops,
  handleAddExpense,
}) => {
  const categoryOptions = [
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
    { value: 'other', label: 'Other' }
  ];

  const paymentOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'online', label: 'Online Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleAddExpense(); }} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="amount">Amount (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as ExpenseCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expenseDate ? format(expenseDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={expenseDate}
                    onSelect={(date) => date && setExpenseDate(date)}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="shop">Shop</Label>
              <div className="relative">
                <Store className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Select
                  value={shopId}
                  onValueChange={setShopId}
                >
                  <SelectTrigger id="shop" className="pl-9">
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.length > 0 ? (
                      shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no_shops">No shops available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="payment-method">Payment Method</Label>
              <div className="relative">
                <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger id="payment-method" className="pl-9">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter details about this expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-y"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            {isSubmitting ? 
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Adding Expense...
              </div> : 
              'Add Expense'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;
