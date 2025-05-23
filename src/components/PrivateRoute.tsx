
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/context/AuthContext";
import { toast } from "sonner";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If allowedRoles is specified, check if the user has the required role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    toast.error("You don't have permission to access this page");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
