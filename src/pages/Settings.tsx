
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSettings, CurrencyType, TimeFormat, DateFormat, ColorTheme } from "@/context/SettingsContext";
import { Palette, Clock, Calendar, DollarSign } from "lucide-react";

const Settings = () => {
  const { 
    currency, setCurrency,
    timeFormat, setTimeFormat,
    dateFormat, setDateFormat,
    colorTheme, setColorTheme
  } = useSettings();

  const colorThemeOptions = [
    { value: 'default', label: 'Default', description: 'Classic blue and gray' },
    { value: 'professional', label: 'Professional', description: 'Navy and slate' },
    { value: 'modern', label: 'Modern', description: 'Purple and pink' },
    { value: 'vibrant', label: 'Vibrant', description: 'Green and orange' }
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Settings
        </h1>
        
        <div className="grid gap-6 max-w-4xl">
          {/* Color Theme Settings */}
          <Card className="shadow-lg border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the visual appearance of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="color-theme">Color Theme</Label>
                <Select value={colorTheme} onValueChange={(value: ColorTheme) => setColorTheme(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a color theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorThemeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card className="shadow-lg border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <DollarSign className="h-5 w-5" />
                Currency & Localization
              </CardTitle>
              <CardDescription>
                Set your preferred currency and number formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="currency">Default Currency</Label>
                <Select value={currency} onValueChange={(value: CurrencyType) => setCurrency(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                    <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                    <SelectItem value="JPY">¥ Japanese Yen (JPY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Settings */}
          <Card className="shadow-lg border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Clock className="h-5 w-5" />
                Date & Time
              </CardTitle>
              <CardDescription>
                Configure how dates and times are displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="time-format">Time Format</Label>
                <Select value={timeFormat} onValueChange={(value: TimeFormat) => setTimeFormat(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="date-format">Date Format</Label>
                <Select value={dateFormat} onValueChange={(value: DateFormat) => setDateFormat(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
