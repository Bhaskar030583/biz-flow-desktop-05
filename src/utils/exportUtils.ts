
/**
 * Utilities for exporting data in different formats
 */

import { utils, writeFile } from "xlsx";

/**
 * Export data to CSV format
 * @param data Array of objects to export
 * @param fileName Name of the file to save (without extension)
 */
export const exportToCSV = (data: Record<string, any>[], fileName: string) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }

  try {
    // Convert data to CSV string
    const headers = Object.keys(data[0]);
    const csvRows = [
      // Headers row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          // Handle values that need escaping
          const value = row[header];
          const cellValue = value === null || value === undefined ? '' : String(value);
          
          // Escape quotes and commas
          if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
            return `"${cellValue.replace(/"/g, '""')}"`;
          }
          return cellValue;
        }).join(',')
      )
    ];
    
    // Create blob and download
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      // Browser supports HTML5 download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw error;
  }
};

/**
 * Export data to Excel format using xlsx library
 * @param data Array of objects to export
 * @param fileName Name of the file to save (without extension)
 */
export const exportToExcel = (data: Record<string, any>[], fileName: string) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }
  
  try {
    // Create worksheet
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Data");
    
    // Generate file name with date
    const fullFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Write and download file
    writeFile(wb, fullFileName);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};
