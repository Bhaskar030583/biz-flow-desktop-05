
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle2, Circle } from "lucide-react";

interface PageAccessControlProps {
  selectedPages: string[];
  onPageToggle: (page: string) => void;
  showAllPages?: boolean;
}

const availablePages = [
  { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard with overview', category: 'Core' },
  { id: 'products', name: 'Products', description: 'Manage products catalog', category: 'Inventory' },
  { id: 'stocks', name: 'Stocks', description: 'Stock management and tracking', category: 'Inventory' },
  { id: 'pos', name: 'POS', description: 'Point of sale system', category: 'Sales' },
  { id: 'customers', name: 'Customers', description: 'Customer management', category: 'Sales' },
  { id: 'bills', name: 'Bills', description: 'Billing and invoices', category: 'Sales' },
  { id: 'expenses', name: 'Expenses', description: 'Expense tracking', category: 'Finance' },
  { id: 'credits', name: 'Credits', description: 'Credit management', category: 'Finance' },
  { id: 'shops', name: 'Shops', description: 'Shop/store management', category: 'Management' },
  { id: 'users', name: 'Users', description: 'User management (Admin only)', category: 'Admin' },
  { id: 'settings', name: 'Settings', description: 'Application settings', category: 'Admin' },
  { id: 'stock-movements', name: 'Stock Movements', description: 'Stock transfer tracking', category: 'Inventory' },
  { id: 'hrms', name: 'HRMS', description: 'Human resource management', category: 'HR' },
];

const categories = ['Core', 'Inventory', 'Sales', 'Finance', 'Management', 'HR', 'Admin'];

export const PageAccessControl: React.FC<PageAccessControlProps> = ({
  selectedPages,
  onPageToggle,
  showAllPages = false,
}) => {
  const handleSelectAll = () => {
    const allPageIds = availablePages.map(page => page.id);
    allPageIds.forEach(pageId => {
      if (!selectedPages.includes(pageId)) {
        onPageToggle(pageId);
      }
    });
  };

  const handleDeselectAll = () => {
    selectedPages.forEach(pageId => {
      onPageToggle(pageId);
    });
  };

  const selectedCount = selectedPages.length;
  const totalCount = availablePages.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            Page Access Control
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount}/{totalCount} pages selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.map(category => {
          const categoryPages = availablePages.filter(page => page.category === category);
          const categorySelectedCount = categoryPages.filter(page => selectedPages.includes(page.id)).length;
          
          return (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">{category}</h4>
                <span className="text-xs text-muted-foreground">
                  ({categorySelectedCount}/{categoryPages.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryPages.map((page) => (
                  <div
                    key={page.id}
                    className={`p-3 border rounded-md transition-all cursor-pointer ${
                      selectedPages.includes(page.id)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                        : 'hover:border-indigo-200 border-gray-200'
                    }`}
                    onClick={() => onPageToggle(page.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {selectedPages.includes(page.id) ? (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Label className="font-medium cursor-pointer">
                          {page.name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {page.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Select the pages this user can access. Users will only see navigation items for pages they have access to.</p>
        </div>
      </CardContent>
    </Card>
  );
};
