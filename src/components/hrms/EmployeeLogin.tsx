
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Clock, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Store, Shift } from '@/types/hrms';

const EmployeeLogin = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    getCurrentLocation();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, storesRes, shiftsRes] = await Promise.all([
        supabase.from('hr_employees').select('*').eq('employment_status', 'active'),
        supabase.from('hr_stores').select('*'),
        supabase.from('hr_shifts').select('*').eq('is_active', true)
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (storesRes.error) throw storesRes.error;
      if (shiftsRes.error) throw shiftsRes.error;

      setEmployees(employeesRes.data || []);
      setStores(storesRes.data || []);
      setShifts(shiftsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocoding to get address
          fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`)
            .then(response => response.json())
            .then(data => {
              if (data.results && data.results[0]) {
                setAddress(data.results[0].formatted);
              } else {
                setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              }
            })
            .catch(() => {
              setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            });
        },
        (error) => {
          toast({
            title: "Error",
            description: "Failed to get current location. Please enable location services.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmployee || !selectedStore || !selectedShift) {
      toast({
        title: "Error",
        description: "Please select employee, store, and shift",
        variant: "destructive",
      });
      return;
    }

    if (!currentLocation) {
      toast({
        title: "Error",
        description: "Location is required for check-in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAttendance } = await supabase
        .from('hr_attendance')
        .select('*')
        .eq('employee_id', selectedEmployee)
        .eq('attendance_date', today)
        .single();

      if (existingAttendance && existingAttendance.check_in_time) {
        toast({
          title: "Error",
          description: "Already checked in today",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create attendance record
      const attendanceData = {
        employee_id: selectedEmployee,
        store_id: selectedStore,
        shift_id: selectedShift,
        attendance_date: today,
        check_in_time: new Date().toISOString(),
        check_in_latitude: currentLocation.lat,
        check_in_longitude: currentLocation.lng,
        check_in_address: address,
        status: 'present'
      };

      const { error } = await supabase
        .from('hr_attendance')
        .upsert([attendanceData]);

      if (error) throw error;

      setIsCheckedIn(true);
      toast({
        title: "Success",
        description: "Checked in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Check-in failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: attendance, error: fetchError } = await supabase
        .from('hr_attendance')
        .select('*')
        .eq('employee_id', selectedEmployee)
        .eq('attendance_date', today)
        .single();

      if (fetchError || !attendance) {
        toast({
          title: "Error",
          description: "No check-in record found for today",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calculate total hours
      const checkInTime = new Date(attendance.check_in_time);
      const checkOutTime = new Date();
      const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('hr_attendance')
        .update({
          check_out_time: checkOutTime.toISOString(),
          check_out_latitude: currentLocation?.lat,
          check_out_longitude: currentLocation?.lng,
          check_out_address: address,
          total_hours: Math.round(totalHours * 100) / 100
        })
        .eq('id', attendance.id);

      if (error) throw error;

      setIsCheckedIn(false);
      toast({
        title: "Success",
        description: "Checked out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Check-out failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Check-In/Out</h1>
        <p className="text-muted-foreground">
          Manage employee attendance with GPS tracking and selfie verification
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Check-In Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Employee Login
            </CardTitle>
            <CardDescription>Select employee, store, and shift for check-in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} ({employee.employee_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="store">Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name} ({store.store_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shift">Shift</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.shift_name} ({shift.start_time} - {shift.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Current Location</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{address || 'Getting location...'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCheckIn} 
                disabled={loading || isCheckedIn}
                className="flex-1"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? 'Checking In...' : 'Check In'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleCheckOut}
                disabled={loading || !isCheckedIn}
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {loading ? 'Checking Out...' : 'Check Out'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Status
            </CardTitle>
            <CardDescription>Today's attendance information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={isCheckedIn ? "bg-green-500" : ""}>
                  {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                </Badge>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selected Employee</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm">
                  {selectedEmployee ? 
                    employees.find(e => e.id === selectedEmployee)?.first_name + ' ' + 
                    employees.find(e => e.id === selectedEmployee)?.last_name : 
                    'No employee selected'
                  }
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selected Store</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm">
                  {selectedStore ? 
                    stores.find(s => s.id === selectedStore)?.store_name : 
                    'No store selected'
                  }
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selected Shift</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm">
                  {selectedShift ? 
                    shifts.find(s => s.id === selectedShift)?.shift_name : 
                    'No shift selected'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Additional employee actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col">
              <Camera className="h-6 w-6 mb-2" />
              <span className="text-sm">Take Selfie</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Clock className="h-6 w-6 mb-2" />
              <span className="text-sm">Start Break</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <MapPin className="h-6 w-6 mb-2" />
              <span className="text-sm">Update Location</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <LogOut className="h-6 w-6 mb-2" />
              <span className="text-sm">Emergency Logout</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeLogin;
