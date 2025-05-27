
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Calendar, DollarSign, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HRMSDashboard = () => {
  const navigate = useNavigate();

  const quickStats = [
    { label: 'Total Employees', value: '0', icon: Users, color: 'bg-blue-500' },
    { label: 'Present Today', value: '0', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Active Stores', value: '0', icon: MapPin, color: 'bg-purple-500' },
    { label: 'Pending Leaves', value: '0', icon: Calendar, color: 'bg-orange-500' },
  ];

  const moduleCards = [
    {
      title: 'Employee Management',
      description: 'Manage employee records, profiles, and basic information',
      path: 'employees',
      icon: Users,
    },
    {
      title: 'Store Management',
      description: 'Manage store locations, geo-fencing, and store settings',
      path: 'stores',
      icon: MapPin,
    },
    {
      title: 'Shift Management',
      description: 'Create and manage work shifts, assignments, and schedules',
      path: 'shifts',
      icon: Clock,
    },
    {
      title: 'Attendance Tracking',
      description: 'Monitor employee attendance, check-ins, and working hours',
      path: 'attendance',
      icon: CheckCircle,
    },
    {
      title: 'Leave Management',
      description: 'Handle leave requests, approvals, and leave policies',
      path: 'leaves',
      icon: Calendar,
    },
    {
      title: 'Payroll & Salary',
      description: 'Manage salaries, advances, deductions, and payslips',
      path: 'payroll',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HRMS Dashboard</h1>
          <p className="text-muted-foreground">
            Human Resource Management System - Comprehensive employee management
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/hrms/employee-login')}
            variant="outline"
          >
            Employee Login
          </Button>
          <Button onClick={() => navigate('/hrms/employees')}>
            Quick Setup
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-md ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* HRMS Modules */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">HRMS Modules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {moduleCards.map((module, index) => {
            const Icon = module.icon;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(`/hrms/${module.path}`)}
                    className="w-full"
                  >
                    Open Module
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with HRMS</CardTitle>
          <CardDescription>
            Follow these steps to set up your HR system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">1</Badge>
              <div>
                <p className="font-medium">Set up Stores</p>
                <p className="text-sm text-muted-foreground">
                  Create store locations with geo-fencing settings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">2</Badge>
              <div>
                <p className="font-medium">Create Shifts</p>
                <p className="text-sm text-muted-foreground">
                  Define work shifts and time schedules
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">3</Badge>
              <div>
                <p className="font-medium">Add Employees</p>
                <p className="text-sm text-muted-foreground">
                  Register employees with their details and assignments
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">4</Badge>
              <div>
                <p className="font-medium">Start Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Begin attendance tracking and payroll management
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRMSDashboard;
