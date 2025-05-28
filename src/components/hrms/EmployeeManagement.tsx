
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Employee } from '@/types/hrms';
import { useEmployeeManagement } from '@/hooks/useEmployeeManagement';
import EmployeeStats from './EmployeeStats';
import EmployeeForm from './EmployeeForm';
import EmployeeList from './EmployeeList';

const EmployeeManagement = () => {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const navigate = useNavigate();
  const { employees, loading, fetchEmployees, deleteEmployee } = useEmployeeManagement();

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/hrms')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to HRMS
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
            <p className="text-muted-foreground">
              Manage employee records and information
            </p>
          </div>
        </div>
        <EmployeeForm
          editingEmployee={editingEmployee}
          onEmployeeUpdated={fetchEmployees}
          onEditingEmployeeChange={setEditingEmployee}
        />
      </div>

      <EmployeeStats employees={employees} />
      
      <EmployeeList
        employees={employees}
        onEdit={handleEdit}
        onDelete={deleteEmployee}
      />
    </div>
  );
};

export default EmployeeManagement;
