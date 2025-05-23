
import React, { useState } from "react";
import { UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, UserPlus, ShieldCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface AddUserFormProps {
  handleAddUser: (e: React.FormEvent) => Promise<void>;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  role: UserRole;
  setRole: (value: UserRole) => void;
  isSubmitting: boolean;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({
  handleAddUser,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  role,
  setRole,
  isSubmitting,
}) => {
  return (
    <form onSubmit={handleAddUser} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            User Role
          </Label>
          
          <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div 
                className={`p-4 border rounded-md cursor-pointer transition-all ${role === 'admin' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-indigo-200'}`}
                onClick={() => setRole('admin')}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="font-medium cursor-pointer">Administrator</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6">Full control over all aspects of the system</p>
              </div>
              
              <div 
                className={`p-4 border rounded-md cursor-pointer transition-all ${role === 'lead' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-indigo-200'}`}
                onClick={() => setRole('lead')}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="lead" id="lead" />
                  <Label htmlFor="lead" className="font-medium cursor-pointer">Lead</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6">Can manage shops, products and credits</p>
              </div>
              
              <div 
                className={`p-4 border rounded-md cursor-pointer transition-all ${role === 'sales' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-indigo-200'}`}
                onClick={() => setRole('sales')}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sales" id="sales" />
                  <Label htmlFor="sales" className="font-medium cursor-pointer">Sales</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6">Can manage stocks and view sales data</p>
              </div>
              
              <div 
                className={`p-4 border rounded-md cursor-pointer transition-all ${role === 'user' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'hover:border-indigo-200'}`}
                onClick={() => setRole('user')}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user" className="font-medium cursor-pointer">User</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6">Limited access to view dashboard only</p>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating User...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User with {role.charAt(0).toUpperCase() + role.slice(1)} Role
          </>
        )}
      </Button>
    </form>
  );
};
