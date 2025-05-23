
import React from "react";
import { UserRole } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, UserX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string | null;
}

interface UserTableProps {
  users: UserData[];
  isLoading: boolean;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
}

export const UserTable: React.FC<UserTableProps> = ({ users, isLoading, updateUserRole }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Helper function to get badge style based on role
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      case 'lead':
        return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
      case 'sales':
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || "N/A"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.email === "gumpubhaskar3000@gmail.com" ? (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Admin (Protected)
                    </Badge>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(value: string) => 
                        updateUserRole(user.id, value as UserRole)
                      }
                      disabled={user.email === "gumpubhaskar3000@gmail.com"} 
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRoleBadgeStyle("admin")}>
                              Admin
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="lead">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRoleBadgeStyle("lead")}>
                              Lead
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="sales">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRoleBadgeStyle("sales")}>
                              Sales
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRoleBadgeStyle("user")}>
                              User
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={user.email === "gumpubhaskar3000@gmail.com"} 
                  >
                    <UserX size={16} className="mr-1 text-red-500" />
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
