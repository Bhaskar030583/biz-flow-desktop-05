
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, DollarSign, User, LogOut, FileText } from 'lucide-react';

const EmployeeDashboard = () => {
  // Mock employee data - replace with actual data from context/API
  const employee = {
    name: 'John Doe',
    code: 'EMP001',
    designation: 'Sales Associate',
    currentShift: 'Morning Shift (09:00 - 17:00)',
    store: 'Main Branch',
    status: 'checked_in',
    checkInTime: '09:15 AM',
    workingHours: '7.5 hours',
  };

  const todayStats = {
    checkIn: '09:15 AM',
    breakTime: '45 minutes',
    workingHours: '6.2 hours',
    status: 'Working',
  };

  const recentLeaves = [
    { type: 'Sick Leave', date: '2024-01-15', status: 'approved', days: 1 },
    { type: 'Casual Leave', date: '2024-01-10', status: 'pending', days: 2 },
  ];

  const thisMonthSalary = {
    workingDays: 22,
    workedDays: 18,
    estimatedSalary: 45000,
    advances: 5000,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {employee.name}</h1>
          <p className="text-muted-foreground">
            {employee.designation} • {employee.store}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Apply Leave
          </Button>
          <Button variant="destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Check Out
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className="bg-green-500">
                {todayStats.status}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Check In</p>
              <p className="text-lg font-semibold">{todayStats.checkIn}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Working Hours</p>
              <p className="text-lg font-semibold">{todayStats.workingHours}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Break Time</p>
              <p className="text-lg font-semibold">{todayStats.breakTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Leaves */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Leave Requests
            </CardTitle>
            <CardDescription>Your recent leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeaves.map((leave, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{leave.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {leave.date} • {leave.days} day{leave.days > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge 
                    variant={leave.status === 'approved' ? 'default' : 'secondary'}
                    className={leave.status === 'approved' ? 'bg-green-500' : ''}
                  >
                    {leave.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Calendar className="h-4 w-4 mr-2" />
              Apply for Leave
            </Button>
          </CardContent>
        </Card>

        {/* This Month's Salary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              This Month's Salary
            </CardTitle>
            <CardDescription>Estimated salary for current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Working Days:</span>
                <span className="font-medium">{thisMonthSalary.workingDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Worked Days:</span>
                <span className="font-medium">{thisMonthSalary.workedDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Salary:</span>
                <span className="font-medium">₹{thisMonthSalary.estimatedSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Advances Taken:</span>
                <span className="font-medium text-red-600">₹{thisMonthSalary.advances.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Expected Net:</span>
                  <span className="text-green-600">
                    ₹{(thisMonthSalary.estimatedSalary - thisMonthSalary.advances).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              <FileText className="h-4 w-4 mr-2" />
              View Payslips
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <Clock className="h-6 w-6 mb-2" />
              <span className="text-sm">Start Break</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">Apply Leave</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">View Payslips</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <User className="h-6 w-6 mb-2" />
              <span className="text-sm">My Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Employee Code</p>
              <p className="text-muted-foreground">{employee.code}</p>
            </div>
            <div>
              <p className="font-medium">Designation</p>
              <p className="text-muted-foreground">{employee.designation}</p>
            </div>
            <div>
              <p className="font-medium">Current Shift</p>
              <p className="text-muted-foreground">{employee.currentShift}</p>
            </div>
            <div>
              <p className="font-medium">Store</p>
              <p className="text-muted-foreground">{employee.store}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
