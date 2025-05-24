
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSettings, CurrencyType, TimeFormat, DateFormat, ColorTheme } from "@/context/SettingsContext";
import { Palette, Clock, Calendar, DollarSign, Check } from "lucide-react";

const Settings = () => {
  const { 
    currency, setCurrency,
    timeFormat, setTimeFormat,
    dateFormat, setDateFormat,
    colorTheme, setColorTheme
  } = useSettings();

  const colorThemeOptions = [
    { value: 'default', label: 'Default', description: 'Classic blue and gray', colors: ['#3b82f6', '#6b7280'] },
    { value: 'professional', label: 'Professional', description: 'Navy and slate', colors: ['#1e40af', '#475569'] },
    { value: 'modern', label: 'Modern', description: 'Purple and pink', colors: ['#7c3aed', '#ec4899'] },
    { value: 'vibrant', label: 'Vibrant', description: 'Green and orange', colors: ['#059669', '#ea580c'] }
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-3">
            Settings
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Customize your dashboard experience with personalized preferences and appearance settings.
          </p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Color Theme Settings */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Palette className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                Appearance & Theme
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Choose your preferred color scheme to personalize your dashboard experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="color-theme" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color Theme
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {colorThemeOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                        colorTheme === option.value
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setColorTheme(option.value as ColorTheme)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {option.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {option.description}
                            </div>
                          </div>
                        </div>
                        {colorTheme === option.value && (
                          <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/30 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                Currency & Localization
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Configure your preferred currency and regional settings for financial data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Currency
                </Label>
                <Select value={currency} onValueChange={(value: CurrencyType) => setCurrency(value)}>
                  <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="INR" className="text-base py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">₹</span>
                        <div>
                          <div className="font-medium">Indian Rupee</div>
                          <div className="text-sm text-gray-500">INR</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="USD" className="text-base py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">$</span>
                        <div>
                          <div className="font-medium">US Dollar</div>
                          <div className="text-sm text-gray-500">USD</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="EUR" className="text-base py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">€</span>
                        <div>
                          <div className="font-medium">Euro</div>
                          <div className="text-sm text-gray-500">EUR</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="GBP" className="text-base py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">£</span>
                        <div>
                          <div className="font-medium">British Pound</div>
                          <div className="text-sm text-gray-500">GBP</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="JPY" className="text-base py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">¥</span>
                        <div>
                          <div className="font-medium">Japanese Yen</div>
                          <div className="text-sm text-gray-500">JPY</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Settings */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/30 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                Date & Time Preferences
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Customize how dates and times are displayed throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="time-format" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Format
                  </Label>
                  <Select value={timeFormat} onValueChange={(value: TimeFormat) => setTimeFormat(value)}>
                    <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="12h" className="text-base py-3">
                        <div>
                          <div className="font-medium">12-hour format</div>
                          <div className="text-sm text-gray-500">2:30 PM</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="24h" className="text-base py-3">
                        <div>
                          <div className="font-medium">24-hour format</div>
                          <div className="text-sm text-gray-500">14:30</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="date-format" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Format
                  </Label>
                  <Select value={dateFormat} onValueChange={(value: DateFormat) => setDateFormat(value)}>
                    <SelectTrigger className="w-full h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <SelectItem value="DD/MM/YYYY" className="text-base py-3">
                        <div>
                          <div className="font-medium">DD/MM/YYYY</div>
                          <div className="text-sm text-gray-500">31/12/2024</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="MM/DD/YYYY" className="text-base py-3">
                        <div>
                          <div className="font-medium">MM/DD/YYYY</div>
                          <div className="text-sm text-gray-500">12/31/2024</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="YYYY-MM-DD" className="text-base py-3">
                        <div>
                          <div className="font-medium">YYYY-MM-DD</div>
                          <div className="text-sm text-gray-500">2024-12-31</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Information */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Settings Saved Automatically
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                All your preferences are automatically saved and will be applied across your entire dashboard experience. 
                Changes take effect immediately and persist across browser sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
