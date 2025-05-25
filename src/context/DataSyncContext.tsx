
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DataSyncContextType {
  refreshTrigger: number;
  triggerRefresh: (modules?: string[]) => void;
  syncData: (operation: string, entityType: string, data?: any) => void;
  isLoading: boolean;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

interface DataSyncProviderProps {
  children: ReactNode;
}

export const DataSyncProvider: React.FC<DataSyncProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const triggerRefresh = useCallback((modules?: string[]) => {
    setRefreshTrigger(prev => prev + 1);
    
    // Invalidate specific query keys based on modules
    if (modules) {
      modules.forEach(module => {
        switch (module) {
          case 'dashboard':
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            break;
          case 'products':
            queryClient.invalidateQueries({ queryKey: ['products'] });
            break;
          case 'shops':
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            break;
          case 'stocks':
            queryClient.invalidateQueries({ queryKey: ['stocks'] });
            break;
          case 'pos':
            queryClient.invalidateQueries({ queryKey: ['pos-products'] });
            break;
          case 'customers':
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            break;
          case 'bills':
            queryClient.invalidateQueries({ queryKey: ['bills'] });
            break;
          case 'credits':
            queryClient.invalidateQueries({ queryKey: ['credits'] });
            break;
          case 'expenses':
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            break;
        }
      });
    } else {
      // Invalidate all queries
      queryClient.invalidateQueries();
    }
  }, [queryClient]);

  const syncData = useCallback(async (operation: string, entityType: string, data?: any) => {
    setIsLoading(true);
    
    try {
      // Determine which modules need to be refreshed based on the entity type
      const modulesToRefresh: string[] = [];
      
      switch (entityType) {
        case 'product':
          modulesToRefresh.push('products', 'dashboard', 'stocks', 'pos', 'bills');
          break;
        case 'shop':
          modulesToRefresh.push('shops', 'dashboard', 'stocks', 'expenses', 'credits');
          break;
        case 'stock':
          modulesToRefresh.push('stocks', 'dashboard', 'products');
          break;
        case 'customer':
          modulesToRefresh.push('customers', 'bills', 'credits');
          break;
        case 'bill':
          modulesToRefresh.push('bills', 'dashboard', 'customers', 'products');
          break;
        case 'credit':
          modulesToRefresh.push('credits', 'dashboard', 'customers');
          break;
        case 'expense':
          modulesToRefresh.push('expenses', 'dashboard');
          break;
        default:
          modulesToRefresh.push('dashboard');
      }
      
      // Add a small delay to ensure database operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      triggerRefresh(modulesToRefresh);
      
      console.log(`Data sync triggered for ${operation} on ${entityType}`, data);
    } catch (error) {
      console.error('Error during data sync:', error);
      toast.error('Failed to synchronize data');
    } finally {
      setIsLoading(false);
    }
  }, [triggerRefresh]);

  return (
    <DataSyncContext.Provider value={{
      refreshTrigger,
      triggerRefresh,
      syncData,
      isLoading
    }}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};
