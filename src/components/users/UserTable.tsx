
import React from "react";
import { UserRole } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, UserX, Shield, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPageAccessModal } from "./UserPageAccessModal";

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string | null;
  page_access?: string[];
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

  // Check if a user is the protected admin
  const isProtectedAdmin = (email: string) => email === "gumpubhaskar3000@gmail.com";

  const handleRemoveClick = (email: string) => {
    if (isProtectedAdmin(email)) {
      toast.error("Cannot remove system administrator");
      return;
    }
    toast("This feature is not yet implemented", {
      description: "User removal functionality will be added in future updates."
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Page Access</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className={isProtectedAdmin(user.email) ? "bg-amber-50/30" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.full_name || "N/A"}
                    {isProtectedAdmin(user.email) && 
                      <Shield size={14} className="text-red-500" />
                    }
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{user.email}</span>
                    {isProtectedAdmin(user.email) && 
                      <span className="text-xs text-red-500 font-medium">System Administrator</span>
                    }
                  </div>
                </TableCell>
                <TableCell>
                  {isProtectedAdmin(user.email) ? (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Admin (Protected)
                    </Badge>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(value: string) => 
                        updateUserRole(user.id, value as UserRole)
                      }
                      disabled={isProtectedAdmin(user.email)} 
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {user.page_access?.length || 0} pages
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Eye size={12} className="text-gray-400" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <UserPageAccessModal
                      userId={user.id}
                      userName={user.full_name || user.email}
                      currentAccess={user.page_access || ['dashboard']}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={isProtectedAdmin(user.email)}
                      onClick={() => handleRemoveClick(user.email)}
                    >
                      <UserX size={16} className="mr-1 text-red-500" />
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
