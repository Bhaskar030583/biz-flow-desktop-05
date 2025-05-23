
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleAddExpense(); }} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as ExpenseCategory)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rent">Rent</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="salaries">Salaries</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="taxes">Taxes</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="office_supplies">Office Supplies</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
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
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={expenseDate}
              onSelect={(date) => date && setExpenseDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="shop">Shop</Label>
        <Select
          value={shopId}
          onValueChange={setShopId}
        >
          <SelectTrigger id="shop">
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

      <div>
        <Label htmlFor="payment-method">Payment Method</Label>
        <Select
          value={paymentMethod}
          onValueChange={setPaymentMethod}
        >
          <SelectTrigger id="payment-method">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter details about this expense..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Adding Expense..." : "Add Expense"}
      </Button>
    </form>
  );
};

export default ExpenseForm;
