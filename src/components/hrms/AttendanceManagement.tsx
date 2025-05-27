
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  total_hours: number;
  break_hours: number;
  overtime_hours: number;
  status: string;
  is_late: boolean;
  late_by_minutes: number;
  hr_employees?: {
    first_name: string;
    last_name: string;
    employee_code: string;
  };
  hr_stores?: {
    store_name: string;
    store_code: string;
  };
  hr_shifts?: {
    shift_name: string;
    start_time: string;
    end_time: string;
  };
}

const AttendanceManagement = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedDate]);

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
            store_name,
            store_code
          ),
          hr_shifts (
            shift_name,
            start_time,
            end_time
          )
        `)
        .eq('attendance_date', selectedDate)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-yellow-500';
      case 'half_day': return 'bg-orange-500';
      case 'on_leave': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate summary statistics
  const totalPresent = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const totalAbsent = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalLate = attendanceRecords.filter(r => r.is_late).length;
  const totalOnLeave = attendanceRecords.filter(r => r.status === 'on_leave').length;

  if (loading) {
    return <div className="flex justify-center p-8">Loading attendance records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Monitor employee attendance and working hours
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor="date">Select Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPresent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAbsent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalLate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalOnLeave}</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance for {formatDate(selectedDate)}
          </CardTitle>
          <CardDescription>
            Total records: {attendanceRecords.length}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Attendance Records */}
      <div className="grid gap-4">
        {attendanceRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
              <p className="text-muted-foreground text-center">
                No attendance records for {formatDate(selectedDate)}
              </p>
            </CardContent>
          </Card>
        ) : (
          attendanceRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        {record.hr_employees?.first_name} {record.hr_employees?.last_name}
                      </div>
                      <Badge variant="secondary">
                        {record.hr_employees?.employee_code}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-white ${getStatusColor(record.status)}`}
                      >
                        {record.status.toUpperCase()}
                      </Badge>
                      {record.is_late && (
                        <Badge variant="destructive">
                          Late by {record.late_by_minutes}m
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {record.hr_stores?.store_name} • {record.hr_shifts?.shift_name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Check In</p>
                    <p className="text-muted-foreground">
                      {record.check_in_time ? formatTime(record.check_in_time) : 'Not checked in'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Check Out</p>
                    <p className="text-muted-foreground">
                      {record.check_out_time ? formatTime(record.check_out_time) : 'Not checked out'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Total Hours</p>
                    <p className="text-muted-foreground">{record.total_hours}h</p>
                  </div>
                  <div>
                    <p className="font-medium">Break Hours</p>
                    <p className="text-muted-foreground">{record.break_hours}h</p>
                  </div>
                  <div>
                    <p className="font-medium">Overtime</p>
                    <p className="text-muted-foreground">{record.overtime_hours}h</p>
                  </div>
                  <div>
                    <p className="font-medium">Shift Time</p>
                    <p className="text-muted-foreground">
                      {record.hr_shifts?.start_time} - {record.hr_shifts?.end_time}
                    </p>
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

export default AttendanceManagement;
