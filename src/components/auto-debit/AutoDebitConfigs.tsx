
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AutoDebitConfigModal } from "./AutoDebitConfigModal";

interface AutoDebitConfig {
  id: string;
  customer_id: string;
  payment_method_id: string;
  trigger_amount: number;
  debit_amount: number;
  is_enabled: boolean;
  customer?: { name: string; phone: string };
  payment_method?: { method_type: string };
}

export const AutoDebitConfigs: React.FC = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<AutoDebitConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AutoDebitConfig | null>(null);

  useEffect(() => {
    if (user) {
      fetchConfigs();
    }
  }, [user]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auto_debit_configs')
        .select(`
          *,
          customer:customers(name, phone),
          payment_method:customer_payment_methods(method_type)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
        payment_method: Array.isArray(item.payment_method) ? item.payment_method[0] : item.payment_method
      }));
      
      setConfigs(transformedData);
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to fetch auto debit configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: AutoDebitConfig) => {
    setEditingConfig(config);
    setIsModalOpen(true);
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this auto debit configuration?')) return;

    try {
      const { error } = await supabase
        .from('auto_debit_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      toast.success('Auto debit configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const toggleEnabled = async (configId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('auto_debit_configs')
        .update({ is_enabled: !isEnabled })
        .eq('id', configId);

      if (error) throw error;

      toast.success(`Auto debit ${!isEnabled ? 'enabled' : 'disabled'} successfully`);
      fetchConfigs();
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Auto Debit Configurations</h2>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Configuration
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">No auto debit configurations found</p>
            <p className="text-sm text-gray-500 mt-2">
              Create your first configuration to enable automatic payments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle className="text-lg">
                      {config.customer?.name || 'Unknown Customer'}
                    </CardTitle>
                    <Badge variant={config.is_enabled ? "default" : "secondary"}>
                      {config.is_enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleEnabled(config.id, config.is_enabled)}
                    >
                      {config.is_enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(config.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{config.customer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Payment Method:</span>
                    <p className="capitalize">{config.payment_method?.method_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Trigger Amount:</span>
                    <p>₹{config.trigger_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Debit Amount:</span>
                    <p>₹{config.debit_amount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AutoDebitConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingConfig(null);
        }}
        config={editingConfig}
        onSuccess={fetchConfigs}
      />
    </div>
  );
};
