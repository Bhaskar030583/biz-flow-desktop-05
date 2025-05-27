
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Shift {
  id: string;
  shift_name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  grace_period: number;
  store_id: string;
  is_active: boolean;
  created_at: string;
  hr_stores?: {
    store_name: string;
    store_code: string;
  };
}

interface Store {
  id: string;
  store_name: string;
  store_code: string;
}

const ShiftManagement = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    shift_name: '',
    shift_type: 'regular',
    start_time: '',
    end_time: '',
    break_duration: 60,
    grace_period: 15,
    store_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchShifts();
    fetchStores();
  }, []);

  const fetchShifts = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_shifts')
        .select(`
          *,
          hr_stores (
            store_name,
            store_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('id, store_name, store_code')
        .order('store_name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const shiftData = {
        shift_name: formData.shift_name,
        shift_type: formData.shift_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_duration: formData.break_duration,
        grace_period: formData.grace_period,
        store_id: formData.store_id,
        is_active: formData.is_active,
      };

      if (editingShift) {
        const { error } = await supabase
          .from('hr_shifts')
          .update(shiftData)
          .eq('id', editingShift.id);

        if (error) throw error;
        toast.success('Shift updated successfully');
      } else {
        const { error } = await supabase
          .from('hr_shifts')
          .insert([shiftData]);

        if (error) throw error;
        toast.success('Shift created successfully');
      }

      setDialogOpen(false);
      setEditingShift(null);
      resetForm();
      fetchShifts();
    } catch (error) {
      console.error('Error saving shift:', error);
      toast.error('Failed to save shift');
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      shift_name: shift.shift_name,
      shift_type: shift.shift_type,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_duration: shift.break_duration,
      grace_period: shift.grace_period,
      store_id: shift.store_id,
      is_active: shift.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const { error } = await supabase
        .from('hr_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Shift deleted successfully');
      fetchShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift');
    }
  };

  const resetForm = () => {
    setFormData({
      shift_name: '',
      shift_type: 'regular',
      start_time: '',
      end_time: '',
      break_duration: 60,
      grace_period: 15,
      store_id: '',
      is_active: true,
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'bg-blue-500';
      case 'rotational': return 'bg-green-500';
      case 'split': return 'bg-yellow-500';
      case 'flexible': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading shifts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground">
            Create and manage work shifts and schedules
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingShift(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingShift ? 'Edit Shift' : 'Add New Shift'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shift_name">Shift Name</Label>
                  <Input
                    id="shift_name"
                    value={formData.shift_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, shift_name: e.target.value }))}
                    placeholder="Morning Shift"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shift_type">Shift Type</Label>
                  <Select 
                    value={formData.shift_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, shift_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="rotational">Rotational</SelectItem>
                      <SelectItem value="split">Split</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="store_id">Store</Label>
                <Select 
                  value={formData.store_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, store_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="break_duration">Break Duration (minutes)</Label>
                  <Input
                    id="break_duration"
                    type="number"
                    value={formData.break_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, break_duration: parseInt(e.target.value) }))}
                    min="0"
                    max="480"
                  />
                </div>
                <div>
                  <Label htmlFor="grace_period">Grace Period (minutes)</Label>
                  <Input
                    id="grace_period"
                    type="number"
                    value={formData.grace_period}
                    onChange={(e) => setFormData(prev => ({ ...prev, grace_period: parseInt(e.target.value) }))}
                    min="0"
                    max="60"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active Shift</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingShift ? 'Update Shift' : 'Create Shift'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shifts List */}
      <div className="grid gap-4">
        {shifts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No shifts found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first work shift
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </CardContent>
          </Card>
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <Clock className="h-5 w-5" />
                      {shift.shift_name}
                      <Badge 
                        variant="secondary" 
                        className={`text-white ${getShiftTypeColor(shift.shift_type)}`}
                      >
                        {shift.shift_type}
                      </Badge>
                      {!shift.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {shift.hr_stores?.store_name} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(shift)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(shift.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-muted-foreground">
                      {(() => {
                        const start = new Date(`1970-01-01T${shift.start_time}`);
                        const end = new Date(`1970-01-01T${shift.end_time}`);
                        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        return `${diff} hours`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Break Duration</p>
                    <p className="text-muted-foreground">{shift.break_duration} minutes</p>
                  </div>
                  <div>
                    <p className="font-medium">Grace Period</p>
                    <p className="text-muted-foreground">{shift.grace_period} minutes</p>
                  </div>
                  <div>
                    <p className="font-medium">Store</p>
                    <p className="text-muted-foreground">
                      {shift.hr_stores?.store_code}
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

export default ShiftManagement;
