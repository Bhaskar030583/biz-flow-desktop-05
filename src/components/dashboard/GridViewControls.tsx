
import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid2x2, Grid3x3, LayoutGrid } from 'lucide-react';

interface GridViewControlsProps {
  currentView: number;
  onViewChange: (columns: number) => void;
}

export const GridViewControls: React.FC<GridViewControlsProps> = ({
  currentView,
  onViewChange
}) => {
  const viewOptions = [
    { columns: 2, icon: Grid2x2, label: '2 columns' },
    { columns: 3, icon: Grid3x3, label: '3 columns' },
    { columns: 5, icon: LayoutGrid, label: '5 columns' }
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground mr-2">Grid View:</span>
      {viewOptions.map(({ columns, icon: Icon, label }) => (
        <Button
          key={columns}
          variant={currentView === columns ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange(columns)}
          className="flex items-center gap-1"
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{columns}</span>
        </Button>
      ))}
    </div>
  );
};
