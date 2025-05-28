
import React from "react";
import { Lock } from "lucide-react";

interface StockManagementNoteProps {
  isAdmin: boolean;
}

const StockManagementNote: React.FC<StockManagementNoteProps> = ({ isAdmin }) => {
  if (isAdmin) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center gap-2 text-blue-700">
        <Lock className="h-3 w-3" />
        <span className="text-xs font-medium">Note: Opening stock auto-fills from actual stock for non-admin users</span>
      </div>
    </div>
  );
};

export default StockManagementNote;
