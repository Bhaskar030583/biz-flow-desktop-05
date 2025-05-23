
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, UserPlus } from "lucide-react";
import { UserTable } from "@/components/users/UserTable";
import { AddUserForm } from "@/components/users/AddUserForm";
import { AccessDenied } from "@/components/users/AccessDenied";
import { useUserManagement } from "@/hooks/useUserManagement";

const Users = () => {
  const { userRole } = useAuth();
  const {
    users,
    isLoading,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    role,
    setRole,
    isSubmitting,
    handleAddUser,
    updateUserRole
  } = useUserManagement();

  // Only admin can access this page
  if (userRole !== "admin") {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <AccessDenied />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          User Management
        </h1>
        
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User size={16} /> Users List
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus size={16} /> Add User
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable 
                  users={users} 
                  isLoading={isLoading} 
                  updateUserRole={updateUserRole} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
                <CardDescription>Create a new user account with specific role</CardDescription>
              </CardHeader>
              <CardContent>
                <AddUserForm 
                  handleAddUser={handleAddUser}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  fullName={fullName}
                  setFullName={setFullName}
                  role={role}
                  setRole={setRole}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Users;
