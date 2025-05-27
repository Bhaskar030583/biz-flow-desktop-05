
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  reason: string;
  status: string;
  applied_on: string;
  approved_on?: string;
  rejection_reason?: string;
  hr_employees?: {
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, [filter]);

  const fetchLeaveRequests = async () => {
    try {
      let query = supabase
        .from('hr_leave_requests')
        .select(`
          *,
          hr_employees (
            first_name,
            last_name,
            employee_code
          )
        `)
        .order('applied_on', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeaveRequests(data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, approved: boolean, rejectionReason?: string) => {
    try {
      const updateData: any = {
        status: approved ? 'approved' : 'rejected',
        approved_on: approved ? new Date().toISOString() : null,
      };

      if (!approved && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('hr_leave_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success(`Leave request ${approved ? 'approved' : 'rejected'} successfully`);
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast.error('Failed to update leave request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick': return 'bg-red-100 text-red-800';
      case 'casual': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'maternity': return 'bg-pink-100 text-pink-800';
      case 'paternity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate summary statistics
  const totalPending = leaveRequests.filter(r => r.status === 'pending').length;
  const totalApproved = leaveRequests.filter(r => r.status === 'approved').length;
  const totalRejected = leaveRequests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return <div className="flex justify-center p-8">Loading leave requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage employee leave requests and approvals
          </p>
        </div>
        <div className="flex space-x-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? "default" : "outline"}
              onClick={() => setFilter(filterOption)}
              className="capitalize"
            >
              {filterOption}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalApproved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <div className="grid gap-4">
        {leaveRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
              <p className="text-muted-foreground text-center">
                {filter === 'all' ? 'No leave requests available' : `No ${filter} leave requests`}
              </p>
            </CardContent>
          </Card>
        ) : (
          leaveRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {request.hr_employees?.first_name} {request.hr_employees?.last_name}
                      </div>
                      <Badge variant="secondary">
                        {request.hr_employees?.employee_code}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={getLeaveTypeColor(request.leave_type)}
                      >
                        {request.leave_type.toUpperCase()}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-white ${getStatusColor(request.status)}`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status.toUpperCase()}
                        </div>
                      </Badge>
                      {request.is_half_day && (
                        <Badge variant="outline">Half Day</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(request.start_date)} - {formatDate(request.end_date)} • {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(request.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional):');
                          handleApproval(request.id, false, reason || undefined);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Reason:</p>
                    <p className="text-muted-foreground">{request.reason}</p>
                  </div>
                  
                  {request.rejection_reason && (
                    <div>
                      <p className="font-medium text-red-600">Rejection Reason:</p>
                      <p className="text-red-500">{request.rejection_reason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-2 border-t">
                    <div>
                      <p className="font-medium">Applied On</p>
                      <p className="text-muted-foreground">
                        {formatDate(request.applied_on)}
                      </p>
                    </div>
                    {request.approved_on && (
                      <div>
                        <p className="font-medium">
                          {request.status === 'approved' ? 'Approved On' : 'Processed On'}
                        </p>
                        <p className="text-muted-foreground">
                          {formatDate(request.approved_on)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">Leave Type</p>
                      <p className="text-muted-foreground capitalize">{request.leave_type}</p>
                    </div>
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-muted-foreground">
                        {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                        {request.is_half_day ? ' (Half Day)' : ''}
                      </p>
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

export default LeaveManagement;
