
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { LossType } from "./LossFilters";

interface LossRecord {
  id: string;
  product_name: string;
  store_name: string;
  loss_type: LossType;
  quantity_lost: number;
  operator_name?: string;
  reason?: string;
  created_at: string;
}

interface LossRecordsTableProps {
  losses?: LossRecord[];
  isLoading: boolean;
  selectedDate: Date;
}

export const LossRecordsTable: React.FC<LossRecordsTableProps> = ({
  losses,
  isLoading,
  selectedDate
}) => {
  const lossTypeColors: Record<LossType, string> = {
    theft: "bg-red-100 text-red-800",
    damage: "bg-orange-100 text-orange-800",
    expiry: "bg-yellow-100 text-yellow-800",
    spillage: "bg-blue-100 text-blue-800",
    breakage: "bg-purple-100 text-purple-800",
    other: "bg-gray-100 text-gray-800"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loss Records - {format(selectedDate, "PPP")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading loss records...</div>
        ) : losses && losses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Loss Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {losses.map((loss) => (
                <TableRow key={loss.id}>
                  <TableCell className="text-sm">
                    {format(new Date(loss.created_at), "HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">{loss.product_name}</TableCell>
                  <TableCell>{loss.store_name}</TableCell>
                  <TableCell>
                    <Badge className={lossTypeColors[loss.loss_type]}>
                      {loss.loss_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-red-600 font-medium">
                    -{loss.quantity_lost}
                  </TableCell>
                  <TableCell>{loss.operator_name || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{loss.reason || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>No loss records found for {format(selectedDate, "PPP")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
