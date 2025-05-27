
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Clock, User, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EmployeeLogin = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  // Mock data - replace with actual API calls
  const stores = [
    { id: '1', name: 'Main Branch', code: 'MB001' },
    { id: '2', name: 'Downtown Store', code: 'DS002' },
  ];

  const shifts = [
    { id: '1', name: 'Morning Shift', time: '09:00 - 17:00' },
    { id: '2', name: 'Evening Shift', time: '14:00 - 22:00' },
  ];

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Get address from coordinates (mock implementation)
            const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            
            setLocation({
              lat: latitude,
              lng: longitude,
              address: address,
            });
            
            toast.success('Location captured successfully');
            setStep(2);
          } catch (error) {
            toast.error('Failed to get address');
            setLocation({ lat: latitude, lng: longitude });
            setStep(2);
          }
          setLoading(false);
        },
        (error) => {
          toast.error('Failed to get location. Please enable location access.');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
      setLoading(false);
    }
  }, [toast]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      toast.error('Failed to access camera');
    }
  };

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataURL = canvasRef.current.toDataURL('image/jpeg');
        setSelfieData(dataURL);
        stopCamera();
        setStep(3);
        toast.success('Selfie captured successfully');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Check-in successful!');
      setStep(4);
    } catch (error) {
      toast.error('Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    setStep(1);
    setLocation(null);
    setSelfieData(null);
    setSelectedStore('');
    setSelectedShift('');
    setEmployeeCode('');
    stopCamera();
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <User className="h-6 w-6" />
            Employee Check-In
          </CardTitle>
          <CardDescription>
            Complete all steps to check in for your shift
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
              </div>
            ))}
          </div>

          {/* Step 1: Employee Code & Store/Shift Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee_code">Employee Code</Label>
                <Input
                  id="employee_code"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Enter your employee code"
                  required
                />
              </div>

              <div>
                <Label htmlFor="store">Select Store</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shift">Select Shift</Label>
                <Select value={selectedShift} onValueChange={setSelectedShift} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name} ({shift.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={getCurrentLocation}
                disabled={!employeeCode || !selectedStore || !selectedShift || loading}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {loading ? 'Getting Location...' : 'Capture Location'}
              </Button>
            </div>
          )}

          {/* Step 2: Location Confirmation */}
          {step === 2 && location && (
            <div className="space-y-4">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <h3 className="text-lg font-semibold">Location Captured</h3>
                <p className="text-sm text-muted-foreground">
                  {location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                </p>
              </div>
              
              <Button onClick={startCamera} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Take Selfie
              </Button>
            </div>
          )}

          {/* Step 3: Camera/Selfie */}
          {step === 3 && (
            <div className="space-y-4">
              {showCamera ? (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={takeSelfie} className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : selfieData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <img
                      src={selfieData}
                      alt="Selfie"
                      className="w-48 h-48 mx-auto rounded-lg object-cover"
                    />
                    <h3 className="text-lg font-semibold mt-2">Selfie Captured</h3>
                  </div>
                  
                  {/* Summary */}
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold">Check-in Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Employee:</span>
                        <Badge variant="secondary">{employeeCode}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Store:</span>
                        <span>{stores.find(s => s.id === selectedStore)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shift:</span>
                        <span>{shifts.find(s => s.id === selectedShift)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleCheckIn} disabled={loading} className="flex-1">
                      <Clock className="h-4 w-4 mr-2" />
                      {loading ? 'Checking In...' : 'Complete Check-In'}
                    </Button>
                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                      Retake
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={startCamera} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Selfie
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-xl font-semibold text-green-600">Check-In Successful!</h3>
                <p className="text-muted-foreground">
                  You have successfully checked in for your shift.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Check-in Time:</span>
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Store:</span>
                  <span className="font-medium">{stores.find(s => s.id === selectedStore)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shift:</span>
                  <span className="font-medium">{shifts.find(s => s.id === selectedShift)?.name}</span>
                </div>
              </div>

              <Button onClick={resetLogin} variant="outline" className="w-full">
                New Check-In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeLogin;
