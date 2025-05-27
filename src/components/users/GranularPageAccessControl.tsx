
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle2, Circle } from "lucide-react";

interface PagePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

interface GranularPageAccessControlProps {
  selectedPermissions: Record<string, PagePermission>;
  onPermissionToggle: (pageId: string, action: keyof PagePermission) => void;
  showAllPages?: boolean;
}

const availablePages = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    description: 'Main dashboard with overview', 
    category: 'Core',
    actions: ['view']
  },
  { 
    id: 'products', 
    name: 'Products', 
    description: 'Manage products catalog', 
    category: 'Inventory',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'stocks', 
    name: 'Stocks', 
    description: 'Stock management and tracking', 
    category: 'Inventory',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'pos', 
    name: 'POS', 
    description: 'Point of sale system', 
    category: 'Sales',
    actions: ['view', 'edit']
  },
  { 
    id: 'customers', 
    name: 'Customers', 
    description: 'Customer management', 
    category: 'Sales',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'bills', 
    name: 'Bills', 
    description: 'Billing and invoices', 
    category: 'Sales',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'expenses', 
    name: 'Expenses', 
    description: 'Expense tracking', 
    category: 'Finance',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'credits', 
    name: 'Credits', 
    description: 'Credit management', 
    category: 'Finance',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'shops', 
    name: 'Shops', 
    description: 'Shop/store management', 
    category: 'Management',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'users', 
    name: 'Users', 
    description: 'User management (Admin only)', 
    category: 'Admin',
    actions: ['view', 'edit', 'delete']
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    description: 'Application settings', 
    category: 'Admin',
    actions: ['view', 'edit']
  },
  { 
    id: 'stock-movements', 
    name: 'Stock Movements', 
    description: 'Stock transfer tracking', 
    category: 'Inventory',
    actions: ['view', 'edit']
  },
  { 
    id: 'hrms', 
    name: 'HRMS', 
    description: 'Human resource management', 
    category: 'HR',
    actions: ['view', 'edit', 'delete']
  },
];

const categories = ['Core', 'Inventory', 'Sales', 'Finance', 'Management', 'HR', 'Admin'];

export const GranularPageAccessControl: React.FC<GranularPageAccessControlProps> = ({
  selectedPermissions,
  onPermissionToggle,
  showAllPages = false,
}) => {
  const handleSelectAllPages = () => {
    availablePages.forEach(page => {
      page.actions.forEach(action => {
        if (!selectedPermissions[page.id]?.[action as keyof PagePermission]) {
          onPermissionToggle(page.id, action as keyof PagePermission);
        }
      });
    });
  };

  const handleDeselectAllPages = () => {
    Object.keys(selectedPermissions).forEach(pageId => {
      ['view', 'edit', 'delete'].forEach(action => {
        if (selectedPermissions[pageId]?.[action as keyof PagePermission]) {
          onPermissionToggle(pageId, action as keyof PagePermission);
        }
      });
    });
  };

  const getTotalPermissions = () => {
    return Object.values(selectedPermissions).reduce((total, permissions) => {
      return total + Object.values(permissions).filter(Boolean).length;
    }, 0);
  };

  const getTotalPossiblePermissions = () => {
    return availablePages.reduce((total, page) => total + page.actions.length, 0);
  };

  const selectedCount = getTotalPermissions();
  const totalCount = getTotalPossiblePermissions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            Granular Page Access Control
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount}/{totalCount} permissions selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAllPages}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAllPages}
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
          const categorySelectedCount = categoryPages.reduce((total, page) => {
            return total + Object.values(selectedPermissions[page.id] || {}).filter(Boolean).length;
          }, 0);
          const categoryTotalCount = categoryPages.reduce((total, page) => total + page.actions.length, 0);
          
          return (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">{category}</h4>
                <span className="text-xs text-muted-foreground">
                  ({categorySelectedCount}/{categoryTotalCount} permissions)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {categoryPages.map((page) => (
                  <div
                    key={page.id}
                    className="p-4 border rounded-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <Label className="font-medium">
                          {page.name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">
                          {page.description}
                        </p>
                        <div className="flex gap-4">
                          {page.actions.map((action) => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${page.id}-${action}`}
                                checked={selectedPermissions[page.id]?.[action as keyof PagePermission] || false}
                                onCheckedChange={() => onPermissionToggle(page.id, action as keyof PagePermission)}
                              />
                              <Label 
                                htmlFor={`${page.id}-${action}`}
                                className="text-sm capitalize cursor-pointer"
                              >
                                {action}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Select specific permissions for each page. Users will only be able to perform actions they have permissions for.</p>
        </div>
      </CardContent>
    </Card>
  );
};
