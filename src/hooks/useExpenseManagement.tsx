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

  // Fetch expenses with shop names
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          shops!inner(name)
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expenses');
        return [];
      }
      
      // Transform the data to include shop_name
      return data.map(expense => ({
        ...expense,
        shop_name: expense.shops.name
      })) as Expense[];
    },
    enabled: !!user
  });

  // Mutation for adding expenses
  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: Omit<Expense, 'id' | 'created_at' | 'shop_name'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        throw error;
      }

      return data;
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

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }
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

  // Edit expense mutation
  const editExpenseMutation = useMutation({
    mutationFn: async (expense: Expense) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          expense_date: expense.expense_date,
          payment_method: expense.payment_method,
          shop_id: expense.shop_id,
        })
        .eq('id', expense.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating expense:', error);
      toast.error(`Failed to update expense: ${error.message}`);
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
    await deleteExpenseMutation.mutateAsync(id);
  };

  // Handle edit expense
  const handleEditExpense = async (expense: Expense) => {
    if (!user) return;
    await editExpenseMutation.mutateAsync(expense);
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
    handleEditExpense,
  };
};
