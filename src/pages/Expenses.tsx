
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useExpenseManagement } from "@/hooks/useExpenseManagement";
import { useCategoryManagement } from "@/hooks/useCategoryManagement";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import CategoryManager from "@/components/expenses/CategoryManager";
import { Receipt, PlusCircle, Settings } from "lucide-react";

const Expenses = () => {
  const [activeTab, setActiveTab] = useState("list");
  const {
    description,
    setDescription,
    amount,
    setAmount,
    category,
    setCategory,
    expenseDate,
    setExpenseDate,
    shopId,
    setShopId,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    shops,
    expenses,
    isLoadingExpenses,
    handleAddExpense,
    handleDeleteExpense,
    handleEditExpense,
  } = useExpenseManagement();

  const {
    categories,
    addCategory,
    editCategory,
    deleteCategory
  } = useCategoryManagement();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Expense Management
        </h1>
        <CategoryManager
          categories={categories}
          onAddCategory={addCategory}
          onEditCategory={editCategory}
          onDeleteCategory={deleteCategory}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Receipt size={16} /> Expenses List
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusCircle size={16} /> Add New Expense
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>
                Track and manage all your business expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseTable 
                expenses={expenses} 
                isLoading={isLoadingExpenses} 
                onDelete={handleDeleteExpense}
                onEdit={handleEditExpense}
                shops={shops}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>
                Record a new expense with detailed notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseForm 
                description={description}
                setDescription={setDescription}
                amount={amount}
                setAmount={setAmount}
                category={category}
                setCategory={setCategory}
                expenseDate={expenseDate}
                setExpenseDate={setExpenseDate}
                shopId={shopId}
                setShopId={setShopId}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                isSubmitting={isSubmitting}
                shops={shops}
                handleAddExpense={handleAddExpense}
                categories={categories}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;
