
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type ExpenseCategory = 
  | 'rent'
  | 'utilities'
  | 'inventory'
  | 'salaries'
  | 'marketing'
  | 'equipment'
  | 'maintenance'
  | 'transportation'
  | 'taxes'
  | 'insurance'
  | 'office_supplies'
  | 'other';

export interface Expense {
  id: string;
  user_id: string;
  shop_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expense_date: string;
  payment_method: string;
  receipt_url?: string;
  created_at: string;
  shop_name?: string;
}

export const useExpenseManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [shopId, setShopId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch shops for the current user
  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching shops:', error);
        toast.error('Failed to load shops');
        return [];
      }
      
      return data;
    },
    enabled: !!user
  });

  // For now, let's handle expenses as if we're waiting for the migration to complete
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!user) return [];
      
      // This is placeholder logic until we have the expenses table
      // After the migration is complete, we'll implement proper fetching
      console.log("Attempting to fetch expenses, but table may not exist yet");
      
      // Return empty array for now
      return [] as Expense[];
    },
    enabled: !!user
  });

  // Mutation for adding expenses (placeholder until we have the table)
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: Omit<Expense, 'id' | 'created_at' | 'shop_name'>) => {
      // This is a placeholder. After migration, we'll implement actual API call
      console.log("Would add expense:", expenseData);
      toast.error("Expenses table doesn't exist yet. Please run the required database migration first.");
      throw new Error("Expenses table doesn't exist yet");
    },
    onSuccess: () => {
      // Reset form and refetch data
      setDescription('');
      setAmount('');
      setCategory('other');
      setShopId('');
      setExpenseDate(new Date());
      setPaymentMethod('cash');
      
      // Refresh expenses list
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      toast.success('Expense added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding expense:', error);
      toast.error(`Failed to add expense: ${error.message}`);
    }
  });

  // Delete expense function (placeholder until we have the table)
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      // This is a placeholder. After migration, we'll implement actual API call
      console.log("Would delete expense:", id);
      toast.error("Expenses table doesn't exist yet. Please run the required database migration first.");
      throw new Error("Expenses table doesn't exist yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting expense:', error);
      toast.error(`Failed to delete expense: ${error.message}`);
    }
  });

  // Handle add expense
  const handleAddExpense = async () => {
    if (!user || !amount || !shopId || !category || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format date to YYYY-MM-DD
      const formattedDate = expenseDate.toISOString().split('T')[0];
      
      await addExpenseMutation.mutateAsync({
        user_id: user.id,
        shop_id: shopId,
        amount: parseFloat(amount),
        category,
        description,
        expense_date: formattedDate,
        payment_method: paymentMethod,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (id: string) => {
    if (!user || !id) return;

    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpenseMutation.mutateAsync(id);
    }
  };

  return {
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
    expenses,
    isLoadingExpenses,
    handleAddExpense,
    handleDeleteExpense,
  };
};
