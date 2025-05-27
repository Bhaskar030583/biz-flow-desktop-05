
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '@/types/hrms';

const AttendanceManagement = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_attendance')
        .select(`
          *,
          hr_employees (
            first_name,
            last_name,
            employee_code
          ),
          hr_stores (
            store_name
          ),
          hr_shifts (
            shift_name
          )
        `)
        .order('attendance_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter out records with invalid employee data
      const validRecords = data?.filter(record => 
        record.hr_employees && 
        typeof record.hr_employees === 'object' && 
        'first_name' in record.hr_employees &&
        'last_name' in record.hr_employees &&
        'employee_code' in record.hr_employees
      ) || [];

      setAttendanceRecords(validRecords as AttendanceRecord[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (isLate) {
      return <Badge variant="destructive">Late</Badge>;
    }
    
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'half_day':
        return <Badge variant="secondary">Half Day</Badge>;
      case 'on_leave':
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Track and manage employee attendance records
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Attendance Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceRecords.filter(r => 
                r.attendance_date === new Date().toISOString().split('T')[0] && 
                r.status === 'present'
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceRecords.filter(r => 
                r.attendance_date === new Date().toISOString().split('T')[0] && 
                r.is_late
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceRecords.filter(r => 
                r.attendance_date === new Date().toISOString().split('T')[0] && 
                r.status === 'absent'
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceRecords.length > 0 ? 
                (attendanceRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0) / attendanceRecords.length).toFixed(1) : 
                '0'
              }h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Latest employee check-ins and check-outs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">
                      {record.hr_employees?.first_name} {record.hr_employees?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.hr_employees?.employee_code} • {record.hr_stores?.store_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.hr_shifts?.shift_name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">Check In</p>
                    <p className="text-sm text-muted-foreground">
                      {record.check_in_time ? 
                        new Date(record.check_in_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Not checked in'
                      }
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">Check Out</p>
                    <p className="text-sm text-muted-foreground">
                      {record.check_out_time ? 
                        new Date(record.check_out_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Not checked out'
                      }
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">Hours</p>
                    <p className="text-sm text-muted-foreground">
                      {record.total_hours || 0}h
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.attendance_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {getStatusBadge(record.status || 'present', record.is_late || false)}
                </div>
              </div>
            ))}
            
            {attendanceRecords.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No attendance records found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManagement;
