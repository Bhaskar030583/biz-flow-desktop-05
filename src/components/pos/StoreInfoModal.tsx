
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, User } from "lucide-react";
import { toast } from "sonner";

interface StoreInfoModalProps {
  isOpen: boolean;
  onComplete: (storeInfo: { storeName: string; salespersonName: string }) => void;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onComplete
}) => {
  const [storeName, setStoreName] = useState("");
  const [salespersonName, setSalespersonName] = useState("");

  const handleSubmit = () => {
    if (!storeName.trim()) {
      toast.error("Please enter store name");
      return;
    }
    
    if (!salespersonName.trim()) {
      toast.error("Please enter salesperson name");
      return;
    }

    onComplete({
      storeName: storeName.trim(),
      salespersonName: salespersonName.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Enter Store Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Store Name
            </Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesperson-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Salesperson Name
            </Label>
            <Input
              id="salesperson-name"
              value={salespersonName}
              onChange={(e) => setSalespersonName(e.target.value)}
              placeholder="Enter salesperson name"
              onKeyPress={handleKeyPress}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!storeName.trim() || !salespersonName.trim()}
          >
            Continue to POS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
