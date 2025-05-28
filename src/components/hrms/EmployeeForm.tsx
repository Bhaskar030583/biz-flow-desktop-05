
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/hrms';

interface EmployeeFormProps {
  editingEmployee: Employee | null;
  onEmployeeUpdated: () => void;
  onEditingEmployeeChange: (employee: Employee | null) => void;
}

const EmployeeForm = ({ editingEmployee, onEmployeeUpdated, onEditingEmployeeChange }: EmployeeFormProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    date_of_birth: string;
    date_of_joining: string;
    employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
    department: string;
    designation: string;
    hourly_rate: number;
    bank_account_number: string;
    bank_name: string;
    bank_ifsc: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
  }>({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    employment_status: 'active',
    department: '',
    designation: '',
    hourly_rate: 0,
    bank_account_number: '',
    bank_name: '',
    bank_ifsc: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        employee_code: editingEmployee.employee_code,
        first_name: editingEmployee.first_name,
        last_name: editingEmployee.last_name,
        email: editingEmployee.email,
        phone: editingEmployee.phone || '',
        address: editingEmployee.address || '',
        date_of_birth: editingEmployee.date_of_birth || '',
        date_of_joining: editingEmployee.date_of_joining,
        employment_status: editingEmployee.employment_status,
        department: editingEmployee.department || '',
        designation: editingEmployee.designation || '',
        hourly_rate: editingEmployee.hourly_rate,
        bank_account_number: editingEmployee.bank_account_number || '',
        bank_name: editingEmployee.bank_name || '',
        bank_ifsc: editingEmployee.bank_ifsc || '',
        emergency_contact_name: editingEmployee.emergency_contact_name || '',
        emergency_contact_phone: editingEmployee.emergency_contact_phone || '',
      });
      setShowAddDialog(true);
    }
  }, [editingEmployee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate employee code format
      if (!/^[A-Za-z0-9]+$/.test(formData.employee_code)) {
        toast({
          title: "Invalid Employee Code",
          description: "Employee code can only contain letters and numbers",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check for duplicate employee code when adding new employee
      if (!editingEmployee) {
        const { data: existingEmployee, error: checkError } = await supabase
          .from('hr_employees')
          .select('employee_code')
          .eq('employee_code', formData.employee_code.trim())
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingEmployee) {
          toast({
            title: "Duplicate Employee Code",
            description: "An employee with this code already exists",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Prepare clean data for submission with proper date handling
      const cleanFormData = {
        employee_code: formData.employee_code.trim().toUpperCase(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        date_of_joining: formData.date_of_joining,
        employment_status: formData.employment_status,
        department: formData.department.trim() || null,
        designation: formData.designation.trim() || null,
        hourly_rate: formData.hourly_rate,
        bank_account_number: formData.bank_account_number.trim() || null,
        bank_name: formData.bank_name.trim() || null,
        bank_ifsc: formData.bank_ifsc.trim().toUpperCase() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
      };

      console.log('Submitting employee data:', cleanFormData);

      if (editingEmployee) {
        const { error } = await supabase
          .from('hr_employees')
          .update(cleanFormData)
          .eq('id', editingEmployee.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('hr_employees')
          .insert([cleanFormData]);

        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Employee added successfully",
        });
      }

      resetForm();
      onEmployeeUpdated();
    } catch (error: any) {
      console.error('Employee submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Operation failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_code: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      employment_status: 'active',
      department: '',
      designation: '',
      hourly_rate: 0,
      bank_account_number: '',
      bank_name: '',
      bank_ifsc: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    });
    onEditingEmployeeChange(null);
    setShowAddDialog(false);
  };

  return (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogTrigger asChild>
        <Button onClick={() => onEditingEmployeeChange(null)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {editingEmployee ? 'Update employee information' : 'Enter employee details to add them to the system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_code">Employee Code</Label>
              <Input
                id="employee_code"
                value={formData.employee_code}
                onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                placeholder="e.g., ABC001, EMP123"
                pattern="[A-Za-z0-9]+"
                title="Employee code can only contain letters and numbers"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Only letters and numbers allowed</p>
            </div>
            <div>
              <Label htmlFor="employment_status">Status</Label>
              <Select 
                value={formData.employment_status} 
                onValueChange={(value: 'active' | 'inactive' | 'terminated' | 'on_leave') => 
                  setFormData({...formData, employment_status: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
            <div>
              <Label htmlFor="date_of_joining">Date of Joining</Label>
              <Input
                id="date_of_joining"
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => setFormData({...formData, date_of_joining: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingEmployee ? 'Update' : 'Add'} Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeForm;
