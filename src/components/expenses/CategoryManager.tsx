import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from 'sonner';

interface Category {
  value: string;
  label: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onEditCategory: (oldValue: string, newCategory: Category) => void;
  onDeleteCategory: (value: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryValue.trim() || !newCategoryLabel.trim()) {
      toast.error('Please fill in both category value and label');
      return;
    }

    if (categories.some(cat => cat.value === newCategoryValue)) {
      toast.error('Category value already exists');
      return;
    }

    onAddCategory({
      value: newCategoryValue.toLowerCase().replace(/\s+/g, '_'),
      label: newCategoryLabel
    });

    setNewCategoryValue('');
    setNewCategoryLabel('');
    toast.success('Category added successfully');
  };

  const handleEditCategory = () => {
    if (!editingCategory || !newCategoryLabel.trim()) {
      toast.error('Please fill in the category label');
      return;
    }

    onEditCategory(editingCategory.value, {
      value: editingCategory.value,
      label: newCategoryLabel
    });

    setEditingCategory(null);
    setNewCategoryLabel('');
    toast.success('Category updated successfully');
  };

  const handleDeleteCategory = (value: string) => {
    onDeleteCategory(value);
    toast.success('Category deleted successfully');
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryLabel(category.label);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryLabel('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings size={16} />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Expense Categories</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Category */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Plus size={16} />
              Add New Category
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category-value">Category Value</Label>
                <Input
                  id="category-value"
                  placeholder="e.g., office_supplies"
                  value={newCategoryValue}
                  onChange={(e) => setNewCategoryValue(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category-label">Display Label</Label>
                <Input
                  id="category-label"
                  placeholder="e.g., Office Supplies"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleAddCategory} className="w-full">
              Add Category
            </Button>
          </div>

          {/* Existing Categories */}
          <div className="space-y-4">
            <h3 className="font-medium">Existing Categories</h3>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.value} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{category.value}</Badge>
                    <span>{category.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(category)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{category.label}" category? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteCategory(category.value)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Category Dialog */}
        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={(open) => !open && cancelEdit()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-category-label">Display Label</Label>
                  <Input
                    id="edit-category-label"
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEditCategory} className="flex-1">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManager;
