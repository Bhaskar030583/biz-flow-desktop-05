import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Download, Eye, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Payslip } from '@/types/hrms';
import { useNavigate } from 'react-router-dom';

const PayrollManagement = () => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      // Process the payslips data without strict type casting
      const processedPayslips: Payslip[] = (data || [])
        .filter((payslip: any) => {
          // Only include records with valid employee data
          return payslip.hr_employees && 
                 typeof payslip.hr_employees === 'object' && 
                 !('error' in payslip.hr_employees) &&
                 payslip.hr_employees.first_name &&
                 payslip.hr_employees.last_name &&
                 payslip.hr_employees.employee_code &&
                 typeof payslip.hr_employees.hourly_rate === 'number';
        })
        .map((payslip: any) => ({
          ...payslip,
          hr_employees: payslip.hr_employees && !('error' in payslip.hr_employees) ? {
            first_name: payslip.hr_employees.first_name,
            last_name: payslip.hr_employees.last_name,
            employee_code: payslip.hr_employees.employee_code,
            hourly_rate: payslip.hr_employees.hourly_rate,
          } : null,
        }));

      setPayslips(processedPayslips);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast({
        title: "Error",
        description: "Failed to load payslips",
        variant: "destructive",
      });
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
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/hrms')}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to HRMS
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
              Payroll Management
            </h1>
            <p className="text-blue-700 dark:text-blue-300 font-medium">
              Manage employee salaries and payslips
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border border-blue-200 dark:border-blue-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-blue-200 dark:border-blue-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500"
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
                      {payslip.hr_employees?.first_name || 'Unknown'} {payslip.hr_employees?.last_name || ''}
                      <Badge variant="secondary">
                        {payslip.hr_employees?.employee_code || 'N/A'}
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
