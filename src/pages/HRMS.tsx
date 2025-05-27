
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HRMSDashboard from '@/components/hrms/HRMSDashboard';
import EmployeeManagement from '@/components/hrms/EmployeeManagement';
import AttendanceManagement from '@/components/hrms/AttendanceManagement';
import ShiftManagement from '@/components/hrms/ShiftManagement';
import StoreManagement from '@/components/hrms/StoreManagement';
import LeaveManagement from '@/components/hrms/LeaveManagement';
import PayrollManagement from '@/components/hrms/PayrollManagement';
import EmployeeLogin from '@/components/hrms/EmployeeLogin';
import EmployeeDashboard from '@/components/hrms/EmployeeDashboard';

const HRMS = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <Routes>
        <Route index element={<HRMSDashboard />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="shifts" element={<ShiftManagement />} />
        <Route path="stores" element={<StoreManagement />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="payroll" element={<PayrollManagement />} />
        <Route path="employee-login" element={<EmployeeLogin />} />
        <Route path="employee-dashboard" element={<EmployeeDashboard />} />
      </Routes>
    </div>
  );
};

export default HRMS;
