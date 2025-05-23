
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const AccessDenied: React.FC = () => {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Access Denied</CardTitle>
        <CardDescription>You don't have permission to manage users</CardDescription>
      </CardHeader>
    </Card>
  );
};
