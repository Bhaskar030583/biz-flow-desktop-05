
import { utils, writeFile } from "xlsx";

// Function to generate and download an Excel template for stock imports
export const generateStockTemplate = () => {
  // Create a worksheet with headers
  const headers = [
    "Date",
    "Shop",
    "Product",
    "Opening Stock",
    "Closing Stock",
    "Actual Stock",
    "Shift",
    "Operator",
    "Cash Received",
    "Online Received"
  ];
  
  // Create example data for better understanding
  const exampleData = [
    {
      "Date": new Date().toISOString().split('T')[0],
      "Shop": "Example Shop",
      "Product": "Example Product",
      "Opening Stock": 100,
      "Closing Stock": 85,
      "Actual Stock": 85,
      "Shift": "Morning",
      "Operator": "John Doe",
      "Cash Received": 1000,
      "Online Received": 500
    },
    {
      "Date": new Date().toISOString().split('T')[0],
      "Shop": "Shop Name",
      "Product": "Product Name",
      "Opening Stock": 50,
      "Closing Stock": 30,
      "Actual Stock": 30,
      "Shift": "Evening",
      "Operator": "Jane Smith",
      "Cash Received": 800,
      "Online Received": 400
    }
  ];
  
  // Create workbook and worksheet
  const wb = utils.book_new();
  const ws = utils.json_to_sheet(exampleData);
  
  // Set column widths for better readability
  const wscols = headers.map(() => ({ wch: 15 }));
  ws['!cols'] = wscols;
  
  utils.book_append_sheet(wb, ws, "Stock Template");
  
  // Generate the file name
  const fileName = `stock_import_template.xlsx`;
  
  // Write and download the file
  writeFile(wb, fileName);
};
