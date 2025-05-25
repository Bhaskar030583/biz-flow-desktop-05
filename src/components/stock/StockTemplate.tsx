
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Save, Trash2, Plus, File } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StockTemplateData {
  id: string;
  name: string;
  user_id: string;
  shop_id: string;
  products: {
    product_id: string;
    opening_stock: number;
    closing_stock: number;
    actual_stock: number;
    stock_added: number;
  }[];
  created_at: string;
  updated_at: string;
}

interface StockTemplateProps {
  onApplyTemplate: (template: StockTemplateData) => void;
  currentShopId: string;
  currentStockItems: any[];
}

const StockTemplate: React.FC<StockTemplateProps> = ({ 
  onApplyTemplate, 
  currentShopId, 
  currentStockItems 
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<StockTemplateData[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (user && currentShopId) {
      fetchTemplates();
    }
  }, [user, currentShopId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_templates')
        .select('*')
        .eq('user_id', user?.id)
        .eq('shop_id', currentShopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (currentStockItems.length === 0) {
      toast.error('No stock items to save');
      return;
    }

    try {
      setLoading(true);

      const templateData = {
        name: templateName.trim(),
        user_id: user?.id,
        shop_id: currentShopId,
        products: currentStockItems.map(item => ({
          product_id: item.productId,
          opening_stock: item.openingStock,
          closing_stock: item.availableStock,
          actual_stock: item.actualStock,
          stock_added: item.stockAdded
        }))
      };

      const { error } = await supabase
        .from('stock_templates')
        .insert(templateData);

      if (error) throw error;

      toast.success('Template saved successfully');
      setTemplateName("");
      setShowCreateDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('stock_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const applyTemplate = (template: StockTemplateData) => {
    onApplyTemplate(template);
    toast.success(`Template "${template.name}" applied successfully`);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4" />
            Stock Templates
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!currentShopId || currentStockItems.length === 0}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Save Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Save Stock Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    This will save the current stock configuration for {currentStockItems.length} products
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTemplate} disabled={loading}>
                    {loading ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No templates saved</p>
              <p className="text-xs">Save your current stock setup as a template</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="p-2 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {template.products.length} products
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="h-7 text-xs"
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="h-7 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {new Date(template.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockTemplate;
