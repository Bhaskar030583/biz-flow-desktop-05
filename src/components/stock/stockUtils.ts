
// Utility functions for stock calculations and data manipulation

/**
 * Calculates profit for a stock entry
 */
export const calculateStockProfit = (entry: {
  opening_stock: number;
  closing_stock: number;
  actual_stock?: number;
  products?: {
    price?: number | null;
    cost_price?: number | null;
  };
}) => {
  const sold = entry.opening_stock - entry.closing_stock;
  const sales = sold * Number(entry.products?.price || 0);
  const cost = sold * Number(entry.products?.cost_price || 0);
  return sales - cost;
};

/**
 * Calculates loss due to missing products
 */
export const calculateProductLoss = (entry: {
  closing_stock: number;
  actual_stock?: number | null;
  products?: {
    cost_price?: number | null;
  };
}) => {
  // If actual stock is not recorded, there's no way to calculate loss
  if (entry.actual_stock === undefined || entry.actual_stock === null) {
    return 0;
  }
  
  // Calculate missing units (difference between expected closing and actual)
  const missingUnits = entry.closing_stock - entry.actual_stock;
  
  // Only calculate loss if there are missing units (positive value means shortage)
  if (missingUnits <= 0) {
    return 0;
  }
  
  // Calculate financial loss based on cost price
  const costPrice = Number(entry.products?.cost_price || 0);
  return missingUnits * costPrice;
};

/**
 * Calculates summary metrics from stock entries
 */
export const calculateStockSummary = (entries: Array<{
  opening_stock: number;
  closing_stock: number;
  actual_stock?: number | null;
  products?: {
    price?: number | null;
    cost_price?: number | null;
  };
}>) => {
  if (!entries.length) return { 
    totalSold: 0, 
    totalSales: 0, 
    totalProfit: 0,
    totalProductLoss: 0 
  };
  
  return entries.reduce((acc, entry) => {
    const sold = entry.opening_stock - entry.closing_stock;
    const sales = sold * Number(entry.products?.price || 0);
    const profit = calculateStockProfit(entry);
    const productLoss = calculateProductLoss(entry);
    
    return {
      totalSold: acc.totalSold + sold,
      totalSales: acc.totalSales + sales,
      totalProfit: acc.totalProfit + profit,
      totalProductLoss: acc.totalProductLoss + productLoss
    };
  }, { totalSold: 0, totalSales: 0, totalProfit: 0, totalProductLoss: 0 });
};

/**
 * Sort stock entries based on specified field and direction
 */
export const sortStockEntries = (
  entries: any[],
  sortField: string,
  sortDirection: "asc" | "desc"
) => {
  return [...entries].sort((a, b) => {
    if (sortField === "stock_date") {
      return sortDirection === "asc" 
        ? new Date(a.stock_date).getTime() - new Date(b.stock_date).getTime()
        : new Date(b.stock_date).getTime() - new Date(a.stock_date).getTime();
    }
    
    if (sortField === "units_sold") {
      const soldA = a.opening_stock - a.closing_stock;
      const soldB = b.opening_stock - b.closing_stock;
      return sortDirection === "asc" ? soldA - soldB : soldB - soldA;
    }
    
    if (sortField === "sales_amount") {
      const salesA = (a.opening_stock - a.closing_stock) * Number(a.products?.price || 0);
      const salesB = (b.opening_stock - b.closing_stock) * Number(b.products?.price || 0);
      return sortDirection === "asc" ? salesA - salesB : salesB - salesA;
    }
    
    if (sortField === "profit") {
      const profitA = calculateStockProfit(a);
      const profitB = calculateStockProfit(b);
      return sortDirection === "asc" ? profitA - profitB : profitB - profitA;
    }
    
    if (sortField === "product_loss") {
      const lossA = calculateProductLoss(a);
      const lossB = calculateProductLoss(b);
      return sortDirection === "asc" ? lossA - lossB : lossB - lossA;
    }
    
    return 0;
  });
};

/**
 * Filter stock entries based on search term and filters
 */
export const filterStockEntries = (
  entries: any[],
  searchTerm: string,
  shopFilter: string,
  productFilter: string
) => {
  return entries.filter(entry => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      entry.products?.name?.toLowerCase().includes(searchLower) ||
      entry.shops?.name?.toLowerCase().includes(searchLower) ||
      entry.operator_name?.toLowerCase().includes(searchLower);
      
    // Shop filter
    const matchesShop = !shopFilter || shopFilter === "all" || entry.shops?.id === shopFilter;
    
    // Product filter
    const matchesProduct = !productFilter || productFilter === "all" || entry.products?.id === productFilter;
    
    return matchesSearch && matchesShop && matchesProduct;
  });
};
