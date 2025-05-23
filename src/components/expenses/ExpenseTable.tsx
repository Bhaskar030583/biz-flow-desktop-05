
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expense } from '@/hooks/useExpenseManagement';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
}

// Map category values to display labels
const categoryLabels: Record<string, string> = {
  rent: "Rent",
  utilities: "Utilities",
  inventory: "Inventory",
  salaries: "Salaries",
  marketing: "Marketing",
  equipment: "Equipment",
  maintenance: "Maintenance",
  transportation: "Transportation",
  taxes: "Taxes",
  insurance: "Insurance",
  office_supplies: "Office Supplies",
  other: "Other"
};

// Map payment methods to their respective color variants
const paymentMethodColors: Record<string, string> = {
  cash: "bg-green-100 text-green-800",
  card: "bg-blue-100 text-blue-800",
  online: "bg-purple-100 text-purple-800",
  check: "bg-amber-100 text-amber-800",
  other: "bg-gray-100 text-gray-800"
};

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, isLoading, onDelete }) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  if (expenses.length === 0) {
    return <div className="text-center py-8">No expenses found. Add your first expense to get started.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Shop</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
              <TableCell>{expense.shop_name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {categoryLabels[expense.category] || expense.category}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={expense.description}>
                  {expense.description}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${paymentMethodColors[expense.payment_method] || paymentMethodColors.other}`}>
                  {expense.payment_method.charAt(0).toUpperCase() + expense.payment_method.slice(1)}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(expense.amount))}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(expense.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpenseTable;
