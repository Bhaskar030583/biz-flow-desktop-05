
import { useState, useEffect } from 'react';
import { ExpenseCategory } from '@/hooks/useExpenseManagement';

interface Category {
  value: ExpenseCategory;
  label: string;
}

const defaultCategories: Category[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'other', label: 'Other' }
];

export const useCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load categories from localStorage or use defaults
    const savedCategories = localStorage.getItem('expense_categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (error) {
        console.error('Error parsing saved categories:', error);
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }
  }, []);

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    localStorage.setItem('expense_categories', JSON.stringify(newCategories));
  };

  const addCategory = (category: Category) => {
    const newCategories = [...categories, category];
    saveCategories(newCategories);
  };

  const editCategory = (oldValue: string, newCategory: Category) => {
    const newCategories = categories.map(cat => 
      cat.value === oldValue ? newCategory : cat
    );
    saveCategories(newCategories);
  };

  const deleteCategory = (value: string) => {
    const newCategories = categories.filter(cat => cat.value !== value);
    saveCategories(newCategories);
  };

  return {
    categories,
    addCategory,
    editCategory,
    deleteCategory
  };
};
