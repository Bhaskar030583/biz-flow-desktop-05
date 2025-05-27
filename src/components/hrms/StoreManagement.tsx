import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface Store {
  id: string;
  store_code: string;
  store_name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  geo_fence_radius: number;
  manager_id?: string;
  created_at: string;
}

const StoreManagement = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    store_code: '',
    store_name: '',
    address: '',
    latitude: '',
    longitude: '',
    geo_fence_radius: 100,
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storeData = {
        store_code: formData.store_code,
        store_name: formData.store_name,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        geo_fence_radius: formData.geo_fence_radius,
      };

      if (editingStore) {
        const { error } = await supabase
          .from('hr_stores')
          .update(storeData)
          .eq('id', editingStore.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Store updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('hr_stores')
          .insert([storeData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Store created successfully",
        });
      }

      setDialogOpen(false);
      setEditingStore(null);
      resetForm();
      fetchStores();
    } catch (error) {
      console.error('Error saving store:', error);
      toast({
        title: "Error",
        description: "Failed to save store",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      store_code: store.store_code,
      store_name: store.store_name,
      address: store.address,
      latitude: store.latitude?.toString() || '',
      longitude: store.longitude?.toString() || '',
      geo_fence_radius: store.geo_fence_radius,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;

    try {
      const { error } = await supabase
        .from('hr_stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Store deleted successfully",
      });
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({
        title: "Error",
        description: "Failed to delete store",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      store_code: '',
      store_name: '',
      address: '',
      latitude: '',
      longitude: '',
      geo_fence_radius: 100,
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast({
            title: "Success",
            description: "Location captured successfully",
          });
        },
        (error) => {
          toast({
            title: "Error",
            description: "Failed to get current location",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading stores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/hrms')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to HRMS
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Store Management</h1>
            <p className="text-muted-foreground">
              Manage store locations and geo-fencing settings
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingStore(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? 'Edit Store' : 'Add New Store'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store_code">Store Code</Label>
                  <Input
                    id="store_code"
                    value={formData.store_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_code: e.target.value }))}
                    placeholder="ST001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="store_name">Store Name</Label>
                  <Input
                    id="store_name"
                    value={formData.store_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                    placeholder="Main Branch"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Store address"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="0.000000"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="0.000000"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Location
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="geo_fence_radius">Geo-fence Radius (meters)</Label>
                <Input
                  id="geo_fence_radius"
                  type="number"
                  value={formData.geo_fence_radius}
                  onChange={(e) => setFormData(prev => ({ ...prev, geo_fence_radius: parseInt(e.target.value) }))}
                  placeholder="100"
                  min="10"
                  max="1000"
                />
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
                  {editingStore ? 'Update Store' : 'Create Store'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stores List */}
      <div className="grid gap-4">
        {stores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stores found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by adding your first store location
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Store
              </Button>
            </CardContent>
          </Card>
        ) : (
          stores.map((store) => (
            <Card key={store.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {store.store_name}
                      <Badge variant="secondary">{store.store_code}</Badge>
                    </CardTitle>
                    <CardDescription>{store.address}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(store)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(store.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Latitude</p>
                    <p className="text-muted-foreground">
                      {store.latitude || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Longitude</p>
                    <p className="text-muted-foreground">
                      {store.longitude || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Geo-fence Radius</p>
                    <p className="text-muted-foreground">
                      {store.geo_fence_radius}m
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground">
                      {new Date(store.created_at).toLocaleDateString()}
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

export default StoreManagement;
