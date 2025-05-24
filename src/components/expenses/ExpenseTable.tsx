import React, { useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Expense, ExpenseCategory } from '@/hooks/useExpenseManagement';
import { formatCurrency } from '@/utils/formatters';
import { Trash2, Edit, FileText, Calendar, Store } from "lucide-react";
import ExpenseEditDialog from './ExpenseEditDialog';

interface Category {
  value: ExpenseCategory;
  label: string;
}

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onEdit: (expense: Expense) => Promise<void>;
  shops: Array<{ id: string; name: string }>;
  categories?: Category[];
}

// Map category values to display labels
const defaultCategoryLabels: Record<string, string> = {
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
  cash: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  card: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  online: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  check: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

// Map category to icon
const categoryIcons: Record<string, React.ReactNode> = {
  rent: <Store className="h-4 w-4 mr-1" />,
  utilities: <FileText className="h-4 w-4 mr-1" />
  // Add more icons as needed
};

const EmptyState = () => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
      <FileText className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-2">No expenses found</h3>
    <p className="text-muted-foreground max-w-sm mx-auto mb-6">Add your first expense to get started tracking business expenses.</p>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
    <p className="text-muted-foreground">Loading expenses...</p>
  </div>
);

const ExpenseTable: React.FC<ExpenseTableProps> = ({ 
  expenses, 
  isLoading, 
  onDelete, 
  onEdit, 
  shops,
  categories 
}) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Create category labels map from categories prop or use defaults
  const categoryLabels = categories?.reduce((acc, cat) => {
    acc[cat.value] = cat.label;
    return acc;
  }, {} as Record<string, string>) || defaultCategoryLabels;

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async (updatedExpense: Expense) => {
    await onEdit(updatedExpense);
    setEditingExpense(null);
    setIsEditDialogOpen(false);
  };

  const handleEditCancel = () => {
    setEditingExpense(null);
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (expenses.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
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
              <TableRow key={expense.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {new Date(expense.expense_date).toLocaleDateString()}
                </TableCell>
                
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Store className="h-4 w-4 mr-2 text-indigo-500" />
                    {expense.shop_name}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="font-normal">
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
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(expense)}
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this expense? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDelete(expense.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExpenseEditDialog
        expense={editingExpense}
        isOpen={isEditDialogOpen}
        onClose={handleEditCancel}
        onSave={handleEditSave}
        shops={shops}
        categories={categories}
      />
    </>
  );
};

export default ExpenseTable;
