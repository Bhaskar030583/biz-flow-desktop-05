
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Trash2, 
  MoreHorizontal, 
  FileText, 
  FileX,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToExcel } from "@/utils/exportUtils";

interface BulkActionsProps {
  selectedIds: string[];
  onSelectionClear: () => void;
  onSuccess: () => void;
  exportData: Record<string, any>[];
}

const StockBulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  onSelectionClear,
  onSuccess,
  exportData
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!selectedIds.length) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('stocks')
        .delete()
        .in('id', selectedIds);
      
      if (error) throw error;
      
      toast.success(`${selectedIds.length} stock entries deleted successfully`);
      onSelectionClear();
      onSuccess();
    } catch (error) {
      console.error('Error deleting stock entries:', error);
      toast.error('Failed to delete stock entries');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleExportExcel = () => {
    if (!exportData.length) {
      toast.warning('No data to export');
      return;
    }
    
    try {
      exportToExcel(exportData, `stock_data_${selectedIds.length > 0 ? 'selected' : 'all'}`);
      toast.success('Data exported to Excel successfully');
    } catch (error) {
      toast.error('Failed to export data to Excel');
    }
  };

  const handleExportCSV = () => {
    if (!exportData.length) {
      toast.warning('No data to export');
      return;
    }
    
    try {
      exportToCSV(exportData, `stock_data_${selectedIds.length > 0 ? 'selected' : 'all'}`);
      toast.success('Data exported to CSV successfully');
    } catch (error) {
      toast.error('Failed to export data to CSV');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[160px]">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Export Excel</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              <span>Export CSV</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {selectedIds.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Selected</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedIds.length} selected stock entries from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default React.memo(StockBulkActions);
