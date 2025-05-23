
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { read, utils } from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUp, Download } from "lucide-react";
import { generateStockTemplate } from "@/utils/templateUtils";

interface StockImportProps {
  onComplete: () => void;
}

const StockImport = ({ onComplete }: StockImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      setPreview([]);
      return;
    }

    try {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Read the Excel file
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data);
      
      // Get the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON
      const jsonData = utils.sheet_to_json(worksheet);
      
      // Show preview (first 5 rows)
      setPreview(jsonData.slice(0, 5));
      setError("");
    } catch (error) {
      console.error("Error reading file:", error);
      setError("Could not read the file. Please ensure it's a valid Excel file.");
      setPreview([]);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      generateStockTemplate();
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error generating template:", error);
      toast.error("Failed to download template");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    try {
      setLoading(true);
      
      // Read the file
      const data = await file.arrayBuffer();
      const workbook = read(data);
      
      // Get the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON
      const jsonData = utils.sheet_to_json(worksheet);
      
      // Map data to database format
      const stockEntries = await processImportData(jsonData);
      
      // Batch insert
      if (stockEntries.length > 0) {
        const { error } = await supabase.from("stocks").insert(stockEntries);
        
        if (error) {
          console.error("Import error:", error);
          throw new Error("Failed to import data");
        }
        
        onComplete();
      } else {
        setError("No valid data to import");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      setError(error.message || "Failed to import data");
      toast.error("Import failed. Please check the file format.");
    } finally {
      setLoading(false);
    }
  };

  const processImportData = async (data: any[]) => {
    try {
      // Get shops and products for mapping
      const { data: shops } = await supabase.from("shops").select("id, name");
      const { data: products } = await supabase.from("products").select("id, name");
      
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const shopMap = new Map(shops?.map(shop => [shop.name.toLowerCase(), shop.id]) || []);
      const productMap = new Map(products?.map(product => [product.name.toLowerCase(), product.id]) || []);
      
      // Process data
      return data
        .filter(row => {
          // Validate required fields
          const shopName = row.Shop || row.shop || row.SHOP;
          const productName = row.Product || row.product || row.PRODUCT;
          const openingStock = row["Opening Stock"] || row.opening_stock;
          const closingStock = row["Closing Stock"] || row.closing_stock;
          const actualStock = row["Actual Stock"] || row.actual_stock;
          const date = row.Date || row.date || row.DATE;
          
          return shopName && productName && 
                 openingStock !== undefined && closingStock !== undefined && 
                 actualStock !== undefined && date;
        })
        .map(row => {
          // Map fields to database columns
          const shopName = row.Shop || row.shop || row.SHOP;
          const productName = row.Product || row.product || row.PRODUCT;
          
          // Find shop and product IDs
          const shopId = shopMap.get(shopName.toLowerCase());
          const productId = productMap.get(productName.toLowerCase());
          
          if (!shopId || !productId) {
            console.warn("Shop or product not found:", { shopName, productName });
            return null;
          }
          
          // Format date (expecting format like YYYY-MM-DD or MM/DD/YYYY)
          let stockDate;
          const dateField = row.Date || row.date || row.DATE;
          
          try {
            if (typeof dateField === 'string' || dateField instanceof Date) {
              stockDate = new Date(dateField).toISOString().split('T')[0];
            } else {
              // Excel numeric date
              stockDate = new Date(Math.floor((dateField - 25569) * 86400 * 1000)).toISOString().split('T')[0];
            }
          } catch (error) {
            console.error("Invalid date format:", dateField);
            return null;
          }
          
          return {
            shop_id: shopId,
            product_id: productId,
            user_id: user.id,
            opening_stock: row["Opening Stock"] || row.opening_stock,
            closing_stock: row["Closing Stock"] || row.closing_stock,
            actual_stock: row["Actual Stock"] || row.actual_stock,
            stock_date: stockDate
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error processing import data:", error);
      throw new Error("Failed to process the import data");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-medium text-sm">Import from Excel</h3>
          <p className="text-xs text-muted-foreground">Upload your Excel file with stock data</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <FileUp className="h-10 w-10 text-indigo-500 mb-2" />
          <span className="text-sm text-gray-600">
            {file ? file.name : "Choose an Excel file"}
          </span>
          <span className="mt-2 text-xs text-gray-400">
            Must include Shop, Product, Date, Opening Stock, Closing Stock, and Actual Stock columns
          </span>
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {preview.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Preview (first 5 rows):</h3>
          <div className="overflow-x-auto max-h-40 border rounded">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map((key) => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-gray-500">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="px-3 py-2 whitespace-nowrap text-gray-500">
                        {value?.toString() || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => onComplete()} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleImport}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          disabled={!file || loading}
        >
          {loading ? "Importing..." : "Import Data"}
        </Button>
      </div>
    </div>
  );
};

export default StockImport;
