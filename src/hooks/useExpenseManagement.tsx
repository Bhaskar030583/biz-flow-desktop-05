
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Fetch expenses
  const { data: expenses = [], refetch: refetchExpenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          shops:shop_id (name)
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expenses');
        return [];
      }
      
      // Transform data to include shop_name
      return data.map((expense: any) => ({
        ...expense,
        shop_name: expense.shops?.name
      }));
    },
    enabled: !!user
  });

  // Add expense function
  const handleAddExpense = async () => {
    if (!user || !amount || !shopId || !category || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format date to YYYY-MM-DD
      const formattedDate = expenseDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          shop_id: shopId,
          amount: parseFloat(amount),
          category,
          description,
          expense_date: formattedDate,
          payment_method: paymentMethod,
        })
        .select();

      if (error) throw error;
      
      // Reset form
      setDescription('');
      setAmount('');
      setCategory('other');
      setShopId('');
      setExpenseDate(new Date());
      setPaymentMethod('cash');
      
      // Refresh expenses list
      refetchExpenses();
      
      toast.success('Expense added successfully');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete expense function
  const handleDeleteExpense = async (id: string) => {
    if (!user || !id) return;

    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        refetchExpenses();
        toast.success('Expense deleted successfully');
      } catch (error: any) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense: ' + error.message);
      }
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
