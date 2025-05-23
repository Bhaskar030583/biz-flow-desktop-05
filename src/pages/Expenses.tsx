
import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useExpenseManagement } from "@/hooks/useExpenseManagement";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import { Receipt, PlusCircle } from "lucide-react";

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
  } = useExpenseManagement();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Expense Management
        </h1>
        
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
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
