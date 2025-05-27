
export interface Employee {
  id: string;
  user_id?: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  date_of_joining: string;
  employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  department?: string;
  designation?: string;
  hourly_rate: number;
  bank_account_number?: string;
  bank_name?: string;
  bank_ifsc?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Store {
  id: string;
  store_code: string;
  store_name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  geo_fence_radius?: number;
  manager_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Shift {
  id: string;
  shift_name: string;
  shift_type: 'regular' | 'rotational' | 'split' | 'flexible';
  start_time: string;
  end_time: string;
  break_duration?: number;
  grace_period?: number;
  store_id: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  store_id: string;
  shift_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_selfie_url?: string;
  check_out_selfie_url?: string;
  check_in_latitude?: number;
  check_in_longitude?: number;
  check_out_latitude?: number;
  check_out_longitude?: number;
  check_in_address?: string;
  check_out_address?: string;
  total_hours?: number;
  break_hours?: number;
  overtime_hours?: number;
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  is_late?: boolean;
  late_by_minutes?: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
  hr_employees: {
    first_name: string;
    last_name: string;
    employee_code: string;
  };
  hr_stores: {
    store_name: string;
  };
  hr_shifts: {
    shift_name: string;
  };
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'sick' | 'casual' | 'paid' | 'unpaid' | 'maternity' | 'paternity';
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day?: boolean;
  reason: string;
  status?: 'pending' | 'approved' | 'rejected';
  applied_on?: string;
  approved_by?: string;
  approved_on?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
  hr_employees: {
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}
