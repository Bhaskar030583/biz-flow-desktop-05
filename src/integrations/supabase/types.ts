export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auto_debit_configs: {
        Row: {
          created_at: string
          customer_id: string
          debit_amount: number
          id: string
          is_enabled: boolean | null
          payment_method_id: string
          trigger_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          debit_amount?: number
          id?: string
          is_enabled?: boolean | null
          payment_method_id: string
          trigger_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          debit_amount?: number
          id?: string
          is_enabled?: boolean | null
          payment_method_id?: string
          trigger_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auto_debit_transactions: {
        Row: {
          amount: number
          config_id: string
          created_at: string
          customer_id: string
          error_message: string | null
          id: string
          razorpay_payment_id: string | null
          status: string
          trigger_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          config_id: string
          created_at?: string
          customer_id: string
          error_message?: string | null
          id?: string
          razorpay_payment_id?: string | null
          status?: string
          trigger_balance: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          config_id?: string
          created_at?: string
          customer_id?: string
          error_message?: string | null
          id?: string
          razorpay_payment_id?: string | null
          status?: string
          trigger_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_items: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_date: string
          bill_number: string
          created_at: string
          customer_id: string | null
          id: string
          payment_method: string
          payment_status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bill_date?: string
          bill_number: string
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_method: string
          payment_status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bill_date?: string
          bill_number?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_method?: string
          payment_status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          description: string | null
          id: string
          status: string
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          status?: string
          transaction_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          status?: string
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          amount: number
          created_at: string
          credit_date: string
          credit_type: string
          description: string | null
          hr_shop_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credit_date: string
          credit_type: string
          description?: string | null
          hr_shop_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credit_date?: string
          credit_type?: string
          description?: string | null
          hr_shop_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_payment_methods: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          method_type: string
          razorpay_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          method_type: string
          razorpay_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          method_type?: string
          razorpay_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      denomination_transactions: {
        Row: {
          amount_change: number
          created_at: string
          denominations: Json
          hr_shop_id: string
          id: string
          notes: string | null
          reference_bill_id: string | null
          terminal_id: string | null
          transaction_date: string
          transaction_time: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_change?: number
          created_at?: string
          denominations?: Json
          hr_shop_id: string
          id?: string
          notes?: string | null
          reference_bill_id?: string | null
          terminal_id?: string | null
          transaction_date?: string
          transaction_time?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_change?: number
          created_at?: string
          denominations?: Json
          hr_shop_id?: string
          id?: string
          notes?: string | null
          reference_bill_id?: string | null
          terminal_id?: string | null
          transaction_date?: string
          transaction_time?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_sessions: {
        Row: {
          created_at: string
          employee_id: string | null
          expires_at: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          expires_at: string
          id?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          hr_shop_id: string | null
          id: string
          payment_method: string
          receipt_url: string | null
          shop_id: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date: string
          hr_shop_id?: string | null
          id?: string
          payment_method: string
          receipt_url?: string | null
          shop_id: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          hr_shop_id?: string | null
          id?: string
          payment_method?: string
          receipt_url?: string | null
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_advances: {
        Row: {
          advance_date: string
          amount: number
          approved_by: string | null
          approved_on: string | null
          created_at: string | null
          deducted_in_payslip: string | null
          employee_id: string | null
          id: string
          reason: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string | null
        }
        Insert: {
          advance_date?: string
          amount: number
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          deducted_in_payslip?: string | null
          employee_id?: string | null
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
        }
        Update: {
          advance_date?: string
          amount?: number
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          deducted_in_payslip?: string | null
          employee_id?: string | null
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_advances_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_advances_deducted_in_payslip_fkey"
            columns: ["deducted_in_payslip"]
            isOneToOne: false
            referencedRelation: "hr_payslips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_attendance: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attendance_date: string
          break_hours: number | null
          check_in_address: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_selfie_url: string | null
          check_in_time: string | null
          check_out_address: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_selfie_url: string | null
          check_out_time: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          is_late: boolean | null
          late_by_minutes: number | null
          notes: string | null
          overtime_hours: number | null
          shift_id: string | null
          status: Database["public"]["Enums"]["attendance_status"] | null
          store_id: string | null
          total_hours: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_date: string
          break_hours?: number | null
          check_in_address?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_selfie_url?: string | null
          check_in_time?: string | null
          check_out_address?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_selfie_url?: string | null
          check_out_time?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_late?: boolean | null
          late_by_minutes?: number | null
          notes?: string | null
          overtime_hours?: number | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          store_id?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_date?: string
          break_hours?: number | null
          check_in_address?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_selfie_url?: string | null
          check_in_time?: string | null
          check_out_address?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_selfie_url?: string | null
          check_out_time?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_late?: boolean | null
          late_by_minutes?: number | null
          notes?: string | null
          overtime_hours?: number | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          store_id?: string | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_attendance_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "hr_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_attendance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_break_logs: {
        Row: {
          attendance_id: string | null
          break_duration: number | null
          break_end: string | null
          break_start: string
          break_type: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          selfie_url: string | null
        }
        Insert: {
          attendance_id?: string | null
          break_duration?: number | null
          break_end?: string | null
          break_start: string
          break_type?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          selfie_url?: string | null
        }
        Update: {
          attendance_id?: string | null
          break_duration?: number | null
          break_end?: string | null
          break_start?: string
          break_type?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          selfie_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_break_logs_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "hr_attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employee_shifts: {
        Row: {
          assigned_date: string
          created_at: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          shift_id: string | null
          store_id: string | null
        }
        Insert: {
          assigned_date: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          shift_id?: string | null
          store_id?: string | null
        }
        Update: {
          assigned_date?: string
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          shift_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_employee_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_shifts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "hr_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_employee_shifts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_employees: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          date_of_joining: string
          department: string | null
          designation: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_code: string
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          first_name: string
          hourly_rate: number
          id: string
          is_login_enabled: boolean | null
          last_login: string | null
          last_name: string
          password_hash: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          date_of_joining?: string
          department?: string | null
          designation?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code: string
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          first_name: string
          hourly_rate?: number
          id?: string
          is_login_enabled?: boolean | null
          last_login?: string | null
          last_name: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          date_of_joining?: string
          department?: string | null
          designation?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_code?: string
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          first_name?: string
          hourly_rate?: number
          id?: string
          is_login_enabled?: boolean | null
          last_login?: string | null
          last_name?: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hr_inventory_penalties: {
        Row: {
          approved_by: string | null
          approved_on: string | null
          created_at: string | null
          deducted_in_payslip: string | null
          description: string | null
          employee_id: string | null
          id: string
          incident_date: string
          product_name: string
          quantity_lost: number
          status: Database["public"]["Enums"]["request_status"] | null
          store_id: string | null
          total_penalty: number
          unit_value: number
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          deducted_in_payslip?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          incident_date: string
          product_name: string
          quantity_lost: number
          status?: Database["public"]["Enums"]["request_status"] | null
          store_id?: string | null
          total_penalty: number
          unit_value: number
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          deducted_in_payslip?: string | null
          description?: string | null
          employee_id?: string | null
          id?: string
          incident_date?: string
          product_name?: string
          quantity_lost?: number
          status?: Database["public"]["Enums"]["request_status"] | null
          store_id?: string | null
          total_penalty?: number
          unit_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_inventory_penalties_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_inventory_penalties_deducted_in_payslip_fkey"
            columns: ["deducted_in_payslip"]
            isOneToOne: false
            referencedRelation: "hr_payslips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_inventory_penalties_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_inventory_penalties_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_leave_requests: {
        Row: {
          applied_on: string | null
          approved_by: string | null
          approved_on: string | null
          created_at: string | null
          employee_id: string | null
          end_date: string
          id: string
          is_half_day: boolean | null
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          total_days: number
          updated_at: string | null
        }
        Insert: {
          applied_on?: string | null
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date: string
          id?: string
          is_half_day?: boolean | null
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          total_days: number
          updated_at?: string | null
        }
        Update: {
          applied_on?: string | null
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string
          id?: string
          is_half_day?: boolean | null
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_payslips: {
        Row: {
          advance_deductions: number | null
          bonuses: number | null
          created_at: string | null
          days_worked: number
          employee_id: string | null
          generated_by: string | null
          generated_on: string | null
          gross_salary: number
          id: string
          is_final: boolean | null
          month: number
          net_salary: number
          other_deductions: number | null
          overtime_hours: number | null
          penalty_deductions: number | null
          regular_hours: number
          total_hours: number
          total_working_days: number
          unpaid_leave_deductions: number | null
          year: number
        }
        Insert: {
          advance_deductions?: number | null
          bonuses?: number | null
          created_at?: string | null
          days_worked: number
          employee_id?: string | null
          generated_by?: string | null
          generated_on?: string | null
          gross_salary: number
          id?: string
          is_final?: boolean | null
          month: number
          net_salary: number
          other_deductions?: number | null
          overtime_hours?: number | null
          penalty_deductions?: number | null
          regular_hours: number
          total_hours: number
          total_working_days: number
          unpaid_leave_deductions?: number | null
          year: number
        }
        Update: {
          advance_deductions?: number | null
          bonuses?: number | null
          created_at?: string | null
          days_worked?: number
          employee_id?: string | null
          generated_by?: string | null
          generated_on?: string | null
          gross_salary?: number
          id?: string
          is_final?: boolean | null
          month?: number
          net_salary?: number
          other_deductions?: number | null
          overtime_hours?: number | null
          penalty_deductions?: number | null
          regular_hours?: number
          total_hours?: number
          total_working_days?: number
          unpaid_leave_deductions?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hr_payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_payslips_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_permission_requests: {
        Row: {
          approved_by: string | null
          approved_on: string | null
          created_at: string | null
          deduct_from_salary: boolean | null
          duration_minutes: number
          employee_id: string | null
          end_time: string
          id: string
          permission_date: string
          reason: string
          rejection_reason: string | null
          start_time: string
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          deduct_from_salary?: boolean | null
          duration_minutes: number
          employee_id?: string | null
          end_time: string
          id?: string
          permission_date: string
          reason: string
          rejection_reason?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          deduct_from_salary?: boolean | null
          duration_minutes?: number
          employee_id?: string | null
          end_time?: string
          id?: string
          permission_date?: string
          reason?: string
          rejection_reason?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_permission_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_permission_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_salary_transactions: {
        Row: {
          amount: number
          approved_by: string | null
          approved_on: string | null
          created_at: string | null
          description: string
          employee_id: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          description: string
          employee_id?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          approved_on?: string | null
          created_at?: string | null
          description?: string
          employee_id?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_salary_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_salary_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_shifts: {
        Row: {
          break_duration: number | null
          created_at: string | null
          end_time: string
          grace_period: number | null
          id: string
          is_active: boolean | null
          shift_name: string
          shift_type: Database["public"]["Enums"]["shift_type"] | null
          start_time: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          break_duration?: number | null
          created_at?: string | null
          end_time: string
          grace_period?: number | null
          id?: string
          is_active?: boolean | null
          shift_name: string
          shift_type?: Database["public"]["Enums"]["shift_type"] | null
          start_time: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          break_duration?: number | null
          created_at?: string | null
          end_time?: string
          grace_period?: number | null
          id?: string
          is_active?: boolean | null
          shift_name?: string
          shift_type?: Database["public"]["Enums"]["shift_type"] | null
          start_time?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_shifts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_stores: {
        Row: {
          address: string
          created_at: string | null
          geo_fence_radius: number | null
          id: string
          latitude: number | null
          longitude: number | null
          manager_id: string | null
          store_code: string
          store_name: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          geo_fence_radius?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          store_code: string
          store_name: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          geo_fence_radius?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          store_code?: string
          store_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_stores_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_payouts: {
        Row: {
          achievement_percentage: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payout_amount: number
          payout_date: string
          performance_id: string
          status: string
          target_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_percentage: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_amount: number
          payout_date?: string
          performance_id: string
          status?: string
          target_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_percentage?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_amount?: number
          payout_date?: string
          performance_id?: string
          status?: string
          target_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incentive_payouts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_payouts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_payouts_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "sales_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_payouts_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "sales_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_stock: {
        Row: {
          actual_stock: number
          created_at: string
          hr_shop_id: string
          id: string
          ingredient_id: string
          opening_stock: number
          stock_added: number | null
          stock_consumed: number | null
          stock_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_stock?: number
          created_at?: string
          hr_shop_id: string
          id?: string
          ingredient_id: string
          opening_stock?: number
          stock_added?: number | null
          stock_consumed?: number | null
          stock_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_stock?: number
          created_at?: string
          hr_shop_id?: string
          id?: string
          ingredient_id?: string
          opening_stock?: number
          stock_added?: number | null
          stock_consumed?: number | null
          stock_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_stock_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_stock_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          id: string
          name: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          name: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          name?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      losses: {
        Row: {
          created_at: string
          hr_shop_id: string
          id: string
          loss_date: string
          loss_type: Database["public"]["Enums"]["loss_type"]
          operator_name: string | null
          product_id: string
          quantity_lost: number
          reason: string | null
          shift_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hr_shop_id: string
          id?: string
          loss_date?: string
          loss_type: Database["public"]["Enums"]["loss_type"]
          operator_name?: string | null
          product_id: string
          quantity_lost: number
          reason?: string | null
          shift_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          hr_shop_id?: string
          id?: string
          loss_date?: string
          loss_type?: Database["public"]["Enums"]["loss_type"]
          operator_name?: string | null
          product_id?: string
          quantity_lost?: number
          reason?: string | null
          shift_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_losses_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_losses_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "hr_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "losses_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_alerts: {
        Row: {
          alert_date: string
          created_at: string
          current_stock: number
          hr_shop_id: string | null
          id: string
          is_resolved: boolean | null
          minimum_threshold: number
          product_id: string
          resolved_at: string | null
          shop_id: string
          user_id: string
        }
        Insert: {
          alert_date?: string
          created_at?: string
          current_stock: number
          hr_shop_id?: string | null
          id?: string
          is_resolved?: boolean | null
          minimum_threshold: number
          product_id: string
          resolved_at?: string | null
          shop_id: string
          user_id: string
        }
        Update: {
          alert_date?: string
          created_at?: string
          current_stock?: number
          hr_shop_id?: string | null
          id?: string
          is_resolved?: boolean | null
          minimum_threshold?: number
          product_id?: string
          resolved_at?: string | null
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_low_stock_alerts_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "low_stock_alerts_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_shops: {
        Row: {
          created_at: string
          hr_shop_id: string | null
          id: string
          product_id: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          product_id: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          product_id?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_shops_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_shops_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          cost_price: number | null
          created_at: string
          id: string
          name: string
          price: number
          quantity: number
          sku: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          cost_price?: number | null
          created_at?: string
          id?: string
          name: string
          price: number
          quantity?: number
          sku?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          cost_price?: number | null
          created_at?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          sku?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          code: string | null
          created_at: string
          full_name: string | null
          id: string
          page_access: string[] | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          code?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          page_access?: string[] | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          code?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          page_access?: string[] | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          quantity: number
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          quantity: number
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          quantity?: number
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          product_id: string
          recipe_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          product_id: string
          recipe_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string
          recipe_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reorder_points: {
        Row: {
          created_at: string
          hr_shop_id: string | null
          id: string
          minimum_stock: number
          product_id: string
          reorder_quantity: number
          shop_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          minimum_stock?: number
          product_id: string
          reorder_quantity?: number
          shop_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          minimum_stock?: number
          product_id?: string
          reorder_quantity?: number
          shop_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reorder_points_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_points_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          hr_shop_id: string | null
          id: string
          price: number
          product_id: string
          quantity: number
          sale_date: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          price: number
          product_id: string
          quantity: number
          sale_date: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          price?: number
          product_id?: string
          quantity?: number
          sale_date?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_performance: {
        Row: {
          achievement_percentage: number | null
          actual_sales_amount: number
          actual_sales_quantity: number | null
          created_at: string
          employee_id: string | null
          id: string
          performance_date: string
          performance_hour: number | null
          store_id: string | null
          target_amount: number
          target_quantity: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_percentage?: number | null
          actual_sales_amount?: number
          actual_sales_quantity?: number | null
          created_at?: string
          employee_id?: string | null
          id?: string
          performance_date?: string
          performance_hour?: number | null
          store_id?: string | null
          target_amount?: number
          target_quantity?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_percentage?: number | null
          actual_sales_amount?: number
          actual_sales_quantity?: number | null
          created_at?: string
          employee_id?: string | null
          id?: string
          performance_date?: string
          performance_hour?: number | null
          store_id?: string | null
          target_amount?: number
          target_quantity?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_performance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_performance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          effective_until: string | null
          employee_id: string | null
          id: string
          incentive_amount: number | null
          incentive_percentage: number | null
          incentive_type: string | null
          is_active: boolean | null
          store_id: string | null
          target_amount: number
          target_quantity: number | null
          target_type: Database["public"]["Enums"]["target_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          employee_id?: string | null
          id?: string
          incentive_amount?: number | null
          incentive_percentage?: number | null
          incentive_type?: string | null
          is_active?: boolean | null
          store_id?: string | null
          target_amount?: number
          target_quantity?: number | null
          target_type: Database["public"]["Enums"]["target_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_until?: string | null
          employee_id?: string | null
          id?: string
          incentive_amount?: number | null
          incentive_percentage?: number | null
          incentive_type?: string | null
          is_active?: boolean | null
          store_id?: string | null
          target_amount?: number
          target_quantity?: number | null
          target_type?: Database["public"]["Enums"]["target_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_stock_entries: {
        Row: {
          actual_stock: number
          closing_stock: number
          created_at: string
          id: string
          loss_quantity: number | null
          notes: string | null
          opening_stock: number
          operator_name: string | null
          sales_quantity: number | null
          shift_id: string | null
          stock_added: number | null
          stock_id: string
          updated_at: string
          variance: number | null
        }
        Insert: {
          actual_stock?: number
          closing_stock?: number
          created_at?: string
          id?: string
          loss_quantity?: number | null
          notes?: string | null
          opening_stock?: number
          operator_name?: string | null
          sales_quantity?: number | null
          shift_id?: string | null
          stock_added?: number | null
          stock_id: string
          updated_at?: string
          variance?: number | null
        }
        Update: {
          actual_stock?: number
          closing_stock?: number
          created_at?: string
          id?: string
          loss_quantity?: number | null
          notes?: string | null
          opening_stock?: number
          operator_name?: string | null
          sales_quantity?: number | null
          shift_id?: string | null
          stock_added?: number | null
          stock_id?: string
          updated_at?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_shift_stock_entries_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "hr_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_shift_stock_entries_stock"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          approved_by: string | null
          created_at: string
          created_by: string
          from_shop_id: string | null
          hr_from_shop_id: string | null
          hr_to_shop_id: string | null
          id: string
          movement_date: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          to_shop_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          created_by: string
          from_shop_id?: string | null
          hr_from_shop_id?: string | null
          hr_to_shop_id?: string | null
          id?: string
          movement_date?: string
          movement_type?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          to_shop_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          created_by?: string
          from_shop_id?: string | null
          hr_from_shop_id?: string | null
          hr_to_shop_id?: string | null
          id?: string
          movement_date?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          to_shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_movements_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_hr_from_shop_id_fkey"
            columns: ["hr_from_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_hr_to_shop_id_fkey"
            columns: ["hr_to_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_requests: {
        Row: {
          created_at: string
          fulfilling_hr_store_id: string | null
          fulfilling_store_id: string
          id: string
          notes: string | null
          product_id: string
          request_date: string
          requested_quantity: number
          requesting_hr_store_id: string | null
          requesting_store_id: string
          response_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fulfilling_hr_store_id?: string | null
          fulfilling_store_id: string
          id?: string
          notes?: string | null
          product_id: string
          request_date?: string
          requested_quantity: number
          requesting_hr_store_id?: string | null
          requesting_store_id: string
          response_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fulfilling_hr_store_id?: string | null
          fulfilling_store_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          request_date?: string
          requested_quantity?: number
          requesting_hr_store_id?: string | null
          requesting_store_id?: string
          response_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_requests_fulfilling_hr_store"
            columns: ["fulfilling_hr_store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_requests_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_requests_requesting_hr_store"
            columns: ["requesting_hr_store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_hr_fulfilling_store_id_fkey"
            columns: ["fulfilling_hr_store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_hr_requesting_store_id_fkey"
            columns: ["requesting_hr_store_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_templates: {
        Row: {
          created_at: string
          hr_shop_id: string | null
          id: string
          name: string
          products: Json
          shop_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          name: string
          products?: Json
          shop_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          name?: string
          products?: Json
          shop_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_templates_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          actual_stock: number
          cash_received: number | null
          closing_stock: number
          created_at: string
          hr_shop_id: string | null
          id: string
          online_received: number | null
          opening_stock: number
          operator_name: string | null
          product_id: string
          shift: string | null
          shop_id: string
          stock_added: number | null
          stock_date: string
          user_id: string
        }
        Insert: {
          actual_stock: number
          cash_received?: number | null
          closing_stock: number
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          online_received?: number | null
          opening_stock: number
          operator_name?: string | null
          product_id: string
          shift?: string | null
          shop_id: string
          stock_added?: number | null
          stock_date: string
          user_id: string
        }
        Update: {
          actual_stock?: number
          cash_received?: number | null
          closing_stock?: number
          created_at?: string
          hr_shop_id?: string | null
          id?: string
          online_received?: number | null
          opening_stock?: number
          operator_name?: string | null
          product_id?: string
          shift?: string | null
          shop_id?: string
          stock_added?: number | null
          stock_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_day_closing: {
        Row: {
          closed_at: string
          closed_by: string
          closing_date: string
          closing_denominations: Json
          created_at: string
          hr_shop_id: string
          id: string
          notes: string | null
          opening_denominations: Json
          total_cash_sales: number
          total_change_given: number
          user_id: string
          variance_amount: number
        }
        Insert: {
          closed_at?: string
          closed_by: string
          closing_date?: string
          closing_denominations?: Json
          created_at?: string
          hr_shop_id: string
          id?: string
          notes?: string | null
          opening_denominations?: Json
          total_cash_sales?: number
          total_change_given?: number
          user_id: string
          variance_amount?: number
        }
        Update: {
          closed_at?: string
          closed_by?: string
          closing_date?: string
          closing_denominations?: Json
          created_at?: string
          hr_shop_id?: string
          id?: string
          notes?: string | null
          opening_denominations?: Json
          total_cash_sales?: number
          total_change_given?: number
          user_id?: string
          variance_amount?: number
        }
        Relationships: []
      }
      store_denominations: {
        Row: {
          created_at: string
          date: string
          denominations: Json
          hr_shop_id: string | null
          id: string
          terminal_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          denominations?: Json
          hr_shop_id?: string | null
          id?: string
          terminal_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          denominations?: Json
          hr_shop_id?: string | null
          id?: string
          terminal_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_denominations_hr_shop_id_fkey"
            columns: ["hr_shop_id"]
            isOneToOne: false
            referencedRelation: "hr_stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_incentive_payout: {
        Args: { p_performance_id: string; p_user_id: string }
        Returns: boolean
      }
      calculate_working_hours: {
        Args: { check_in: string; check_out: string; break_minutes?: number }
        Returns: number
      }
      can_make_credit_purchase: {
        Args: { customer_id_param: string; purchase_amount: number }
        Returns: boolean
      }
      check_auto_debit_trigger: {
        Args: { customer_id_param: string }
        Returns: boolean
      }
      consume_recipe_ingredients: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_shop_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      generate_bill_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_denominations: {
        Args: {
          store_id: string
          terminal_id_param?: string
          date_param?: string
        }
        Returns: Json
      }
      get_customer_credit_balance: {
        Args: { customer_id_param: string }
        Returns: number
      }
      get_employee_current_shift: {
        Args: { emp_id: string; shift_date?: string }
        Returns: {
          shift_id: string
          shift_name: string
          start_time: string
          end_time: string
          store_id: string
          store_name: string
        }[]
      }
      get_shift_performance: {
        Args: { shift_id_param: string; date_param?: string }
        Returns: {
          total_sales: number
          total_losses: number
          total_variance: number
          products_count: number
        }[]
      }
      handle_stock_movement: {
        Args: { request_id: string; approving_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "half_day" | "on_leave"
      employment_status: "active" | "inactive" | "terminated" | "on_leave"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "sick"
        | "casual"
        | "paid"
        | "unpaid"
        | "maternity"
        | "paternity"
      loss_type:
        | "theft"
        | "damage"
        | "expiry"
        | "spillage"
        | "breakage"
        | "other"
      request_status: "pending" | "approved" | "rejected"
      shift_type: "regular" | "rotational" | "split" | "flexible"
      target_type: "hourly" | "daily"
      transaction_type:
        | "advance"
        | "deduction"
        | "bonus"
        | "overtime"
        | "penalty"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "half_day", "on_leave"],
      employment_status: ["active", "inactive", "terminated", "on_leave"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "sick",
        "casual",
        "paid",
        "unpaid",
        "maternity",
        "paternity",
      ],
      loss_type: ["theft", "damage", "expiry", "spillage", "breakage", "other"],
      request_status: ["pending", "approved", "rejected"],
      shift_type: ["regular", "rotational", "split", "flexible"],
      target_type: ["hourly", "daily"],
      transaction_type: [
        "advance",
        "deduction",
        "bonus",
        "overtime",
        "penalty",
      ],
    },
  },
} as const
