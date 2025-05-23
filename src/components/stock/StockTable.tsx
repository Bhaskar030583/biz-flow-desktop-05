
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSortChange("stock_date")}>
                Date
                {sortField === "stock_date" && (
                  <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
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
                  <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("sales_amount")}>
                Sales Amount
                {sortField === "sales_amount" && (
                  <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSortChange("profit")}>
                Profit/Loss
                {sortField === "profit" && (
                  <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "" : "rotate-180"}`} />
                )}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const sold = entry.opening_stock - entry.closing_stock;
            const salesAmount = sold * Number(entry.products?.price || 0);
            const profit = calculateProfit(entry);

            return (
              <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
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
                <TableCell className={`text-right ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
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
  );
};

export default StockTable;
