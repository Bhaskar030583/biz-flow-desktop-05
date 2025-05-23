
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentMethodsDisplayProps {
  cashAmount: number;
  cardAmount: number;
  onlineAmount: number;
}

export const PaymentMethodsDisplay: React.FC<PaymentMethodsDisplayProps> = ({
  cashAmount,
  cardAmount,
  onlineAmount
}) => {
  const formatIndianRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const total = cashAmount + cardAmount + onlineAmount;

  const PaymentMethodCard = ({ 
    title, 
    amount, 
    icon, 
    percentage 
  }: { 
    title: string, 
    amount: number, 
    icon: React.ReactNode, 
    percentage: number 
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="text-2xl font-bold">{formatIndianRupee(amount)}</div>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}% of total revenue
          </div>
          <div className="w-full bg-muted h-1 mt-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium mb-4">Payment Methods</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cash Card */}
        <PaymentMethodCard
          title="Cash Collections"
          amount={cashAmount}
          icon={<svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>}
          percentage={total > 0 ? (cashAmount / total) * 100 : 0}
        />
        
        {/* Card Card */}
        <PaymentMethodCard
          title="Card Collections"
          amount={cardAmount}
          icon={<svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>}
          percentage={total > 0 ? (cardAmount / total) * 100 : 0}
        />
        
        {/* Online Card */}
        <PaymentMethodCard
          title="Online Collections"
          amount={onlineAmount}
          icon={<svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
          percentage={total > 0 ? (onlineAmount / total) * 100 : 0}
        />
      </div>
    </div>
  );
};
