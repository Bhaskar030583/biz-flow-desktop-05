
import React from "react";
import { Progress } from "@/components/ui/progress";

interface StockExportProgressProps {
  exporting: boolean;
  exportProgress: number;
}

const StockExportProgress: React.FC<StockExportProgressProps> = ({ exporting, exportProgress }) => {
  if (!exporting) return null;
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Exporting data...</span>
        <span className="text-sm text-muted-foreground">{exportProgress}%</span>
      </div>
      <Progress value={exportProgress} className="h-2" />
    </div>
  );
};

export default StockExportProgress;
