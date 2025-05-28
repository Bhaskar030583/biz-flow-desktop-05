
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Employee } from '@/types/hrms';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

const EmployeeList = ({ employees, onEdit, onDelete }: EmployeeListProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>;
      case 'on_leave':
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee List</CardTitle>
        <CardDescription>Manage all employee records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {employee.employee_code} • {employee.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {employee.department || 'No Department'} • {employee.designation || 'No Designation'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-sm font-medium">Hourly Rate</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{employee.hourly_rate}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium">Joining Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(employee.date_of_joining).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge(employee.employment_status)}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(employee.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {employees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No employees found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first employee to get started
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeList;
