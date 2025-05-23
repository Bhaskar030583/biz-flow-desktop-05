
// Utility functions for stock calculations and data manipulation

/**
 * Calculates profit for a stock entry
 */
export const calculateStockProfit = (entry: {
  opening_stock: number;
  closing_stock: number;
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
 * Calculates summary metrics from stock entries
 */
export const calculateStockSummary = (entries: Array<{
  opening_stock: number;
  closing_stock: number;
  products?: {
    price?: number | null;
    cost_price?: number | null;
  };
}>) => {
  if (!entries.length) return { totalSold: 0, totalSales: 0, totalProfit: 0 };
  
  return entries.reduce((acc, entry) => {
    const sold = entry.opening_stock - entry.closing_stock;
    const sales = sold * Number(entry.products?.price || 0);
    const profit = calculateStockProfit(entry);
    
    return {
      totalSold: acc.totalSold + sold,
      totalSales: acc.totalSales + sales,
      totalProfit: acc.totalProfit + profit
    };
  }, { totalSold: 0, totalSales: 0, totalProfit: 0 });
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
    const matchesShop = !shopFilter || entry.shops?.id === shopFilter;
    
    // Product filter
    const matchesProduct = !productFilter || entry.products?.id === productFilter;
    
    return matchesSearch && matchesShop && matchesProduct;
  });
};
