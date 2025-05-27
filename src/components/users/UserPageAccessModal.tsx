
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PageAccessControl } from "./PageAccessControl";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserPageAccessModalProps {
  userId: string;
  userName: string;
  currentAccess?: string[];
  onAccessUpdated?: () => void;
}

export const UserPageAccessModal: React.FC<UserPageAccessModalProps> = ({
  userId,
  userName,
  currentAccess = ['dashboard'],
  onAccessUpdated
}) => {
  const [selectedPages, setSelectedPages] = useState<string[]>(currentAccess);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelectedPages(currentAccess);
  }, [currentAccess]);

  const handlePageToggle = (page: string) => {
    setSelectedPages(prev => 
      prev.includes(page) 
        ? prev.filter(p => p !== page)
        : [...prev, page]
    );
  };

  const handleUpdateAccess = async () => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          page_access: selectedPages,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Page access updated for ${userName}`);
      setIsOpen(false);
      
      // Call the callback to refresh parent data
      if (onAccessUpdated) {
        onAccessUpdated();
      }
    } catch (error: any) {
      console.error('Error updating page access:', error);
      toast.error(`Failed to update page access: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings size={16} className="mr-1 text-blue-500" />
          Manage Access
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            Manage Page Access for {userName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current access: <span className="font-medium">{selectedPages.length} pages</span>
          </div>
          
          <PageAccessControl 
            selectedPages={selectedPages}
            onPageToggle={handlePageToggle}
            showAllPages={true}
          />
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAccess}
              disabled={isUpdating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Access
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
