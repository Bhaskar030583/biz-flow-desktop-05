
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const ApiKeyManagement: React.FC = () => {
  const { user } = useAuth();
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-razorpay-config');
      
      if (error) {
        console.error('Error checking API key status:', error);
        return;
      }
      
      setIsConfigured(data?.configured || false);
    } catch (error) {
      console.error('Error checking API key status:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    if (!keyId.trim() || !keySecret.trim()) {
      toast.error('Please enter both Key ID and Key Secret');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-razorpay-keys', {
        body: {
          keyId: keyId.trim(),
          keySecret: keySecret.trim()
        }
      });

      if (error) throw error;

      toast.success('Razorpay API keys saved successfully');
      setIsConfigured(true);
      setKeyId("");
      setKeySecret("");
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast.error('Failed to save API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-razorpay-connection');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success('Razorpay connection test successful');
      } else {
        toast.error('Razorpay connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Razorpay API Configuration
          {isConfigured && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Configured
            </Badge>
          )}
          {!isConfigured && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Not Configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured && (
          <>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Razorpay API Keys Required
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    To enable auto debit functionality, please configure your Razorpay API keys.
                    You can find these in your Razorpay Dashboard under Settings → API Keys.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyId">Razorpay Key ID</Label>
                <Input
                  id="keyId"
                  type="text"
                  placeholder="rzp_test_xxxxxxxxxxxxxxxx"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Razorpay Key ID (starts with rzp_test_ or rzp_live_)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keySecret">Razorpay Key Secret</Label>
                <div className="relative">
                  <Input
                    id="keySecret"
                    type={showSecret ? "text" : "password"}
                    placeholder="Enter your Razorpay Key Secret"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your Razorpay Key Secret (keep this confidential)
                </p>
              </div>

              <Button 
                onClick={handleSaveApiKeys} 
                disabled={loading || !keyId.trim() || !keySecret.trim()}
                className="w-full"
              >
                {loading ? "Saving..." : "Save API Keys"}
              </Button>
            </div>
          </>
        )}

        {isConfigured && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Razorpay API Keys Configured
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Your Razorpay API keys are configured and auto debit functionality is enabled.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsConfigured(false)}
                className="flex-1"
              >
                Update Keys
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> API keys are securely stored in Supabase secrets and are never exposed to the client.
            For production use, make sure to use live API keys from your Razorpay account.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
