
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Save, Trash2, Plus, File, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface StockTemplateData {
  id: string;
  name: string;
  user_id: string;
  shop_id: string;
  products: {
    product_id: string;
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
      
      const typedTemplates: StockTemplateData[] = (data || []).map(template => ({
        ...template,
        products: template.products as StockTemplateData['products']
      }));
      
      setTemplates(typedTemplates);
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

    const itemsWithStock = currentStockItems.filter(item => item.stockAdded > 0);
    
    if (itemsWithStock.length === 0) {
      toast.error('No products with stock additions to save');
      return;
    }

    try {
      setLoading(true);

      const templateData = {
        name: templateName.trim(),
        user_id: user?.id,
        shop_id: currentShopId,
        products: itemsWithStock.map(item => ({
          product_id: item.productId,
          stock_added: item.stockAdded
        }))
      };

      const { error } = await supabase
        .from('stock_templates')
        .insert(templateData);

      if (error) throw error;

      toast.success('Stock template saved successfully');
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

  const getTotalStockAddition = (template: StockTemplateData) => {
    return template.products.reduce((total, product) => total + product.stock_added, 0);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Stock Templates
            {templates.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {templates.length}
              </Badge>
            )}
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!currentShopId || currentStockItems.filter(item => item.stockAdded > 0).length === 0}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
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
                    placeholder="e.g., Weekly Restock, Emergency Stock"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Template Summary</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {currentStockItems.filter(item => item.stockAdded > 0).length} products
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Total items: {currentStockItems.filter(item => item.stockAdded > 0).reduce((sum, item) => sum + item.stockAdded, 0)}
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
      
      <CardContent className="p-4">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No templates saved yet</p>
              <p className="text-xs mt-1">Create templates for quick stock additions</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {template.products.length} products
                      </span>
                      <Badge variant="outline" className="text-xs">
                        +{getTotalStockAddition(template)} items
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="h-8 text-xs px-3"
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="h-8 text-xs text-red-600 hover:text-red-700 px-2"
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
