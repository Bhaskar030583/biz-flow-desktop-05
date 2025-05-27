
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Payslip {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  total_working_days: number;
  days_worked: number;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  gross_salary: number;
  advance_deductions: number;
  penalty_deductions: number;
  unpaid_leave_deductions: number;
  other_deductions: number;
  bonuses: number;
  net_salary: number;
  generated_on: string;
  is_final: boolean;
  hr_employees?: {
    first_name: string;
    last_name: string;
    employee_code: string;
    hourly_rate: number;
  };
}

const PayrollManagement = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  useEffect(() => {
    fetchPayslips();
  }, [selectedMonth, selectedYear]);

  const fetchPayslips = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_payslips')
        .select(`
          *,
          hr_employees (
            first_name,
            last_name,
            employee_code,
            hourly_rate
          )
        `)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('generated_on', { ascending: false });

      if (error) throw error;
      setPayslips(data || []);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalGrossSalary = payslips.reduce((sum, p) => sum + p.gross_salary, 0);
  const totalNetSalary = payslips.reduce((sum, p) => sum + p.net_salary, 0);
  const totalDeductions = payslips.reduce((sum, p) => 
    sum + p.advance_deductions + p.penalty_deductions + p.unpaid_leave_deductions + p.other_deductions, 0
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading payslips...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage employee salaries and payslips
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslips.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalGrossSalary)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDeductions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalNetSalary)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payslips for {monthNames[selectedMonth - 1]} {selectedYear}
          </CardTitle>
          <CardDescription>
            Total payslips: {payslips.length}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Payslips */}
      <div className="grid gap-4">
        {payslips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payslips found</h3>
              <p className="text-muted-foreground text-center">
                No payslips for {monthNames[selectedMonth - 1]} {selectedYear}
              </p>
            </CardContent>
          </Card>
        ) : (
          payslips.map((payslip) => (
            <Card key={payslip.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      {payslip.hr_employees?.first_name} {payslip.hr_employees?.last_name}
                      <Badge variant="secondary">
                        {payslip.hr_employees?.employee_code}
                      </Badge>
                      {payslip.is_final ? (
                        <Badge className="bg-green-500">Final</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Generated on {formatDate(payslip.generated_on)}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Working Days</p>
                    <p className="text-muted-foreground">
                      {payslip.days_worked}/{payslip.total_working_days}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Total Hours</p>
                    <p className="text-muted-foreground">{payslip.total_hours}h</p>
                  </div>
                  <div>
                    <p className="font-medium">Overtime</p>
                    <p className="text-muted-foreground">{payslip.overtime_hours}h</p>
                  </div>
                  <div>
                    <p className="font-medium">Gross Salary</p>
                    <p className="text-green-600 font-semibold">
                      {formatCurrency(payslip.gross_salary)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Total Deductions</p>
                    <p className="text-red-600 font-semibold">
                      {formatCurrency(
                        payslip.advance_deductions + 
                        payslip.penalty_deductions + 
                        payslip.unpaid_leave_deductions + 
                        payslip.other_deductions
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Net Salary</p>
                    <p className="text-blue-600 font-bold text-lg">
                      {formatCurrency(payslip.net_salary)}
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                    <div>
                      <p className="font-medium">Advances</p>
                      <p className="text-red-500">-{formatCurrency(payslip.advance_deductions)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Penalties</p>
                      <p className="text-red-500">-{formatCurrency(payslip.penalty_deductions)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Unpaid Leave</p>
                      <p className="text-red-500">-{formatCurrency(payslip.unpaid_leave_deductions)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Other Deductions</p>
                      <p className="text-red-500">-{formatCurrency(payslip.other_deductions)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Bonuses</p>
                      <p className="text-green-500">+{formatCurrency(payslip.bonuses)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PayrollManagement;
