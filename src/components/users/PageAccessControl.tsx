
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface PageAccessControlProps {
  selectedPages: string[];
  onPageToggle: (page: string) => void;
}

const availablePages = [
  { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard with overview' },
  { id: 'products', name: 'Products', description: 'Manage products catalog' },
  { id: 'stocks', name: 'Stocks', description: 'Stock management and tracking' },
  { id: 'pos', name: 'POS', description: 'Point of sale system' },
  { id: 'customers', name: 'Customers', description: 'Customer management' },
  { id: 'bills', name: 'Bills', description: 'Billing and invoices' },
  { id: 'expenses', name: 'Expenses', description: 'Expense tracking' },
  { id: 'credits', name: 'Credits', description: 'Credit management' },
  { id: 'shops', name: 'Shops', description: 'Shop/store management' },
  { id: 'users', name: 'Users', description: 'User management (Admin only)' },
  { id: 'settings', name: 'Settings', description: 'Application settings' },
  { id: 'stock-movements', name: 'Stock Movements', description: 'Stock transfer tracking' },
  { id: 'hrms', name: 'HRMS', description: 'Human resource management' },
];

export const PageAccessControl: React.FC<PageAccessControlProps> = ({
  selectedPages,
  onPageToggle,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-500" />
          Page Access Control
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availablePages.map((page) => (
            <div
              key={page.id}
              className={`p-3 border rounded-md transition-all ${
                selectedPages.includes(page.id)
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                  : 'hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`page-${page.id}`}
                  checked={selectedPages.includes(page.id)}
                  onCheckedChange={() => onPageToggle(page.id)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`page-${page.id}`}
                    className="font-medium cursor-pointer"
                  >
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
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Select the pages this user can access. Users will only see navigation items for pages they have access to.</p>
        </div>
      </CardContent>
    </Card>
  );
};
