
import { useCallback } from 'react';
import { useDataSync } from '@/context/DataSyncContext';
import { toast } from 'sonner';

export const useDataSyncActions = () => {
  const { syncData } = useDataSync();

  const syncAfterProductChange = useCallback((operation: string, productData?: any) => {
    syncData(operation, 'product', productData);
    if (operation === 'create') {
      toast.success('Product added successfully');
    } else if (operation === 'update') {
      toast.success('Product updated successfully');
    } else if (operation === 'delete') {
      toast.success('Product deleted successfully');
    }
  }, [syncData]);

  const syncAfterShopChange = useCallback((operation: string, shopData?: any) => {
    syncData(operation, 'shop', shopData);
    if (operation === 'create') {
      toast.success('Shop added successfully');
    } else if (operation === 'update') {
      toast.success('Shop updated successfully');
    } else if (operation === 'delete') {
      toast.success('Shop deleted successfully');
    }
  }, [syncData]);

  const syncAfterStockChange = useCallback((operation: string, stockData?: any) => {
    syncData(operation, 'stock', stockData);
    if (operation === 'create') {
      toast.success('Stock entry added successfully');
    } else if (operation === 'update') {
      toast.success('Stock entry updated successfully');
    } else if (operation === 'delete') {
      toast.success('Stock entry deleted successfully');
    }
  }, [syncData]);

  const syncAfterCustomerChange = useCallback((operation: string, customerData?: any) => {
    syncData(operation, 'customer', customerData);
    if (operation === 'create') {
      toast.success('Customer added successfully');
    } else if (operation === 'update') {
      toast.success('Customer updated successfully');
    } else if (operation === 'delete') {
      toast.success('Customer deleted successfully');
    }
  }, [syncData]);

  const syncAfterBillChange = useCallback((operation: string, billData?: any) => {
    syncData(operation, 'bill', billData);
    if (operation === 'create') {
      toast.success('Bill created successfully');
    } else if (operation === 'update') {
      toast.success('Bill updated successfully');
    } else if (operation === 'delete') {
      toast.success('Bill deleted successfully');
    }
  }, [syncData]);

  const syncAfterCreditChange = useCallback((operation: string, creditData?: any) => {
    syncData(operation, 'credit', creditData);
    if (operation === 'create') {
      toast.success('Credit entry added successfully');
    } else if (operation === 'update') {
      toast.success('Credit entry updated successfully');
    } else if (operation === 'delete') {
      toast.success('Credit entry deleted successfully');
    }
  }, [syncData]);

  const syncAfterExpenseChange = useCallback((operation: string, expenseData?: any) => {
    syncData(operation, 'expense', expenseData);
    if (operation === 'create') {
      toast.success('Expense added successfully');
    } else if (operation === 'update') {
      toast.success('Expense updated successfully');
    } else if (operation === 'delete') {
      toast.success('Expense deleted successfully');
    }
  }, [syncData]);

  return {
    syncAfterProductChange,
    syncAfterShopChange,
    syncAfterStockChange,
    syncAfterCustomerChange,
    syncAfterBillChange,
    syncAfterCreditChange,
    syncAfterExpenseChange
  };
};
