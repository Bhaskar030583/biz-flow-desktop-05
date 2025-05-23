
import React from "react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Clock, User, ChevronDown } from "lucide-react";

interface StockEntry {
  id: string;
  stock_date: string;
  opening_stock: number;
  closing_stock: number;
  actual_stock: number;
  shift?: string;
  operator_name?: string;
  shops?: { id: string; name: string };
  products?: { id: string; name: string; price: number; cost_price: number | null };
}

interface StockTableProps {
  entries: StockEntry[];
  sortField: string;
  sortDirection: "asc" | "desc";
  handleSortChange: (field: string) => void;
  calculateProfit: (entry: StockEntry) => number;
}

const StockTable = ({ 
  entries, 
  sortField, 
  sortDirection, 
  handleSortChange,
  calculateProfit
}: StockTableProps) => {
  return (
    <div className="overflow-x-auto">
      {/* Desktop view */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSortChange("stock_date")}>
                  Date
                  {sortField === "stock_date" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Opening Stock</TableHead>
              <TableHead className="text-right">Closing Stock</TableHead>
              <TableHead className="text-right">Actual Stock</TableHead>
              <TableHead>Shift / Operator</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("units_sold")}>
                  Units Sold
                  {sortField === "units_sold" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("sales_amount")}>
                  Sales Amount
                  {sortField === "sales_amount" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("profit")}>
                  Profit/Loss
                  {sortField === "profit" && (
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => {
              const sold = entry.opening_stock - entry.closing_stock;
              const salesAmount = sold * Number(entry.products?.price || 0);
              const profit = calculateProfit(entry);

              return (
                <TableRow 
                  key={entry.id} 
                  className="hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    {format(new Date(entry.stock_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{entry.shops?.name}</TableCell>
                  <TableCell>{entry.products?.name}</TableCell>
                  <TableCell className="text-right">{entry.opening_stock}</TableCell>
                  <TableCell className="text-right">{entry.closing_stock}</TableCell>
                  <TableCell className="text-right">{entry.actual_stock}</TableCell>
                  <TableCell>
                    {entry.shift && (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          <Badge variant="outline" className="font-normal">
                            {entry.shift}
                          </Badge>
                        </div>
                        {entry.operator_name && (
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{entry.operator_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{sold}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 mr-1" />
                      {salesAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    <div className="flex items-center justify-end">
                      <IndianRupee className="h-3.5 w-3.5 mr-1" />
                      {profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden space-y-4">
        {entries.map((entry, index) => {
          const sold = entry.opening_stock - entry.closing_stock;
          const salesAmount = sold * Number(entry.products?.price || 0);
          const profit = calculateProfit(entry);

          return (
            <div 
              key={entry.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{entry.products?.name}</h3>
                  <p className="text-muted-foreground text-sm">{entry.shops?.name}</p>
                </div>
                <Badge variant="outline">
                  {format(new Date(entry.stock_date), "dd/MM/yyyy")}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="responsive-table-cell" data-label="Stock">
                  <span className="text-sm">
                    Opening: {entry.opening_stock} → Closing: {entry.closing_stock}
                  </span>
                </div>
                
                <div className="responsive-table-cell" data-label="Units Sold">
                  <span className="font-medium">{sold}</span>
                </div>

                <div className="responsive-table-cell" data-label="Sales Amount">
                  <div className="flex items-center">
                    <IndianRupee className="h-3.5 w-3.5 mr-1" />
                    <span>{salesAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="responsive-table-cell" data-label="Profit/Loss">
                  <div className={`flex items-center ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    <IndianRupee className="h-3.5 w-3.5 mr-1" />
                    <span>{profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {entry.shift && (
                  <div className="flex items-center text-sm mt-2">
                    <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span className="mr-2">{entry.shift}</span>
                    {entry.operator_name && (
                      <>
                        <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">{entry.operator_name}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockTable;
