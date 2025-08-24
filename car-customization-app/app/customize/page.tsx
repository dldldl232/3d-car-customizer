"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { apiClient, type CarModel, type Part } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Loader2, LogOut, ShoppingCart, RotateCcw, AlertCircle } from "lucide-react"
import CarViewer from "@/components/CarViewer"
import PartsSelector from "@/components/PartsSelector"
import ManualCorrectionControls from "@/components/ManualCorrectionControls"
import Test3D from "@/components/Test3D"
import Simple3D from "@/components/Simple3D"

// Mock data for testing UI (remove when connecting to real API)
const MOCK_CAR_MODELS: CarModel[] = [
  {
    id: 1,
    name: "1975 Porsche 911 (930) Turbo",
    manufacturer: "Porsche",
    year: 1975,
    glb_url: "/free_1975_porsche_911_930_turbo/scene.gltf", // Using GLTF for now since we don't have GLB
    thumbnail_url: "/placeholder.svg?height=200&width=300",
    license_slug: "CC-BY-4.0",
    license_url: "https://creativecommons.org/licenses/by/4.0/",
    attribution_html: "Model by Lionsharp Studios",
    source_url: "https://skfb.ly/6WZyV",
    uploader: "Lionsharp Studios",
    source_uid: "6WZyV",
    bounds: '{"min": [-1, 0, -2], "max": [1, 1, 2]}',
    scale_factor: 1.0
  },
  {
    id: 2,
    name: "BMW M3 Competition",
    manufacturer: "BMW",
    year: 2024,
    glb_url: "/models/m3.gltf",
    thumbnail_url: "/placeholder.svg?height=200&width=300",
    license_slug: "CC-BY-4.0",
    license_url: "https://creativecommons.org/licenses/by/4.0/",
    attribution_html: "Model by Creator",
    source_url: "",
    uploader: "Creator",
    source_uid: "",
    bounds: '{"min": [-1, 0, -2], "max": [1, 1, 2]}',
    scale_factor: 1.0
  },
  {
    id: 3,
    name: "Ford Mustang GT",
    manufacturer: "Ford",
    year: 2024,
    glb_url: "/models/mustang.gltf",
    thumbnail_url: "/placeholder.svg?height=200&width=300",
    license_slug: "CC-BY-4.0",
    license_url: "https://creativecommons.org/licenses/by/4.0/",
    attribution_html: "Model by Creator",
    source_url: "",
    uploader: "Creator",
    source_uid: "",
    bounds: '{"min": [-1, 0, -2], "max": [1, 1, 2]}',
    scale_factor: 1.0
  },
]

export default function CustomizePage() {
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth()
  const router = useRouter()

  // State management
  const [carModels, setCarModels] = useState<CarModel[]>([])
  const [selectedCarModel, setSelectedCarModel] = useState<CarModel | null>(null)
  const [availableParts, setAvailableParts] = useState<Part[]>([])
  const [selectedParts, setSelectedParts] = useState<Part[]>([])
  const [isLoadingParts, setIsLoadingParts] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [error, setError] = useState("")
  const [manualMode, setManualMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSavedCar, setIsLoadingSavedCar] = useState(false)
  const [manualTransforms, setManualTransforms] = useState<Record<number, any>>({})
  const [hasCheckedSavedCar, setHasCheckedSavedCar] = useState(false)

  // Manual mode handlers
  const handleManualModeToggle = () => {
    setManualMode(!manualMode);
  };

  const handleSaveManualAdjustments = async () => {
    if (!selectedCarModel || Object.keys(manualTransforms).length === 0) {
      alert('No manual adjustments to save');
      return;
    }

    console.log('🔍 ===== SAVE MANUAL ADJUSTMENTS DEBUG START =====');
    console.log('🔍 handleSaveManualAdjustments called');
    console.log('🔍 Selected car model:', selectedCarModel);
    console.log('🔍 Manual transforms to save:', manualTransforms);
    console.log('🔍 Number of manual adjustments:', Object.keys(manualTransforms).length);

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('🔍 Authentication token present:', !!token);

      // Save manual transforms to backend
      for (const [partId, transform] of Object.entries(manualTransforms)) {
        const partIdNum = parseInt(partId);
        console.log(`🔍 Processing part ${partId}:`, transform);
        
        const adjustmentData = {
          car_model_id: selectedCarModel.id,
          part_id: partIdNum,
          transform: transform
        };
        
        try {
          console.log(`🔍 Calling saveManualAdjustment API for part ${partId}:`, adjustmentData);
          console.log(`🔍 Transform data type:`, typeof transform);
          console.log(`🔍 Transform data:`, JSON.stringify(transform, null, 2));
          await apiClient.saveManualAdjustment(token, adjustmentData);
          console.log(`✅ Manual adjustment saved for part ${partId}`);
        } catch (error) {
          console.error(`❌ Failed to save manual adjustment for part ${partId}:`, error);
          console.error(`❌ Error details:`, error);
          // Continue with other parts even if one fails
        }
      }
      
      // Show success message
      alert('Manual adjustments saved successfully!');
      
      console.log('🔍 ===== SAVE MANUAL ADJUSTMENTS DEBUG END =====');
      
    } catch (error) {
      console.error('🔍 ===== SAVE MANUAL ADJUSTMENTS ERROR =====');
      console.error('Failed to save manual adjustments:', error);
      alert('Failed to save manual adjustments');
    }
  };

  const handleResetToAuto = () => {
    setManualMode(false);
  };

  const handleClearAllAdjustments = () => {
    setManualMode(false);
    // Clear all manual adjustments
    setManualTransforms({});
    console.log('Clearing all adjustments...');
  };

  // Clear manual transforms when car model changes
  useEffect(() => {
    setManualTransforms({})
  }, [selectedCarModel])

  // Debug manual transforms changes
  useEffect(() => {
    console.log('🔍 manualTransforms state changed:', manualTransforms);
    console.log('🔍 manualTransforms keys:', Object.keys(manualTransforms));
    console.log('🔍 manualTransforms length:', Object.keys(manualTransforms).length);
  }, [manualTransforms])

  // Load saved car configuration if savedCarId is provided
  useEffect(() => {
    if (!isAuthenticated || hasCheckedSavedCar) {
      return;
    }

    const loadSavedCar = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const savedCarId = urlParams.get('savedCarId');
      
      console.log('🔍 Checking for savedCarId in URL:', savedCarId);
      setHasCheckedSavedCar(true);
      
      if (!savedCarId) {
        console.log('🔍 No savedCarId, skipping saved car load');
        return;
      }

      try {
        setIsLoadingSavedCar(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication required');
        }

        console.log('🔍 Loading saved car with ID:', savedCarId);

        // Get the saved car
        const savedCar = await apiClient.getSavedCar(token, parseInt(savedCarId));
        console.log('🔍 Loaded saved car:', savedCar);
        
        // Load the car model
        const carModel = await apiClient.getCarModel(savedCar.car_model_id);
        console.log('🔍 Loaded car model:', carModel);
        setSelectedCarModel(carModel);
        
        // Load the parts
        const allParts = await apiClient.getParts(savedCar.car_model_id);
        const savedParts = allParts.filter(part => savedCar.part_ids?.includes(part.id));
        console.log('🔍 Loaded saved parts:', savedParts);
        setSelectedParts(savedParts);
        
        // Load manual adjustments for this car model
        try {
          console.log('🔍 ===== LOAD MANUAL ADJUSTMENTS DEBUG START =====');
          console.log('🔍 Loading manual adjustments for car model:', carModel.id);
          const manualAdjustments = await apiClient.getManualAdjustments(token, carModel.id);
          console.log('🔍 Raw manual adjustments from API:', manualAdjustments);
          console.log('🔍 Number of adjustments received:', manualAdjustments.length);
          
          // Convert the adjustments to the format expected by manualTransforms
          const transforms: Record<number, any> = {};
          manualAdjustments.forEach((adjustment: any, index: number) => {
            console.log(`🔍 Processing adjustment ${index + 1}:`, adjustment);
            console.log(`🔍 Adjustment fields:`, Object.keys(adjustment));
            console.log(`🔍 Part ID:`, adjustment.part_id);
            console.log(`🔍 Transform override:`, adjustment.transform_override);
            console.log(`🔍 Transform:`, adjustment.transform);
            
            // The backend returns FitmentResponse with transform_override field
            const transform = adjustment.transform_override || adjustment.transform;
            console.log(`🔍 Final transform to use:`, transform);
            
            if (transform && savedParts.some(part => part.id === adjustment.part_id)) {
              transforms[adjustment.part_id] = transform;
              console.log(`✅ Loaded manual transform for part ${adjustment.part_id}:`, transform);
            } else {
              console.log(`❌ Skipping adjustment for part ${adjustment.part_id}: transform=${!!transform}, part_in_saved=${savedParts.some(part => part.id === adjustment.part_id)}`);
            }
          });
          
          console.log('🔍 Final transforms object:', transforms);
          console.log('🔍 Number of transforms to apply:', Object.keys(transforms).length);
          setManualTransforms(transforms);
          console.log('🔍 Set manual transforms:', transforms);
          console.log('🔍 ===== LOAD MANUAL ADJUSTMENTS DEBUG END =====');
        } catch (error) {
          console.error('🔍 ===== LOAD MANUAL ADJUSTMENTS ERROR =====');
          console.error('🔍 Failed to load manual adjustments:', error);
          // Don't fail the entire load if manual adjustments fail
        }
        
        console.log('🔍 Loaded saved car configuration:', { savedCar, carModel, savedParts });
        
      } catch (err: any) {
        console.error('🔍 Failed to load saved car:', err);
        setError(err.message || 'Failed to load saved car configuration');
      } finally {
        setIsLoadingSavedCar(false);
      }
    };

    loadSavedCar();
  }, [isAuthenticated, hasCheckedSavedCar]);

  // Save configured car
  const handleSaveCar = async () => {
    if (!selectedCarModel || selectedParts.length === 0) {
      setError('Please select a car model and at least one part before saving');
      return;
    }

    console.log('🔍 ===== SAVE CAR DEBUG START =====');
    console.log('🔍 handleSaveCar called');
    console.log('🔍 Selected car model:', selectedCarModel);
    console.log('🔍 Selected parts:', selectedParts);
    console.log('🔍 Current manualTransforms state:', manualTransforms);
    console.log('🔍 manualTransforms keys:', Object.keys(manualTransforms));
    console.log('🔍 manualTransforms length:', Object.keys(manualTransforms).length);

    setIsSaving(true);
    setError('');

    // Generate a name for the saved car
    const carName = `${selectedCarModel.name} Configuration`;

    // Prepare the data to send
    const saveData = {
      car_model_id: selectedCarModel.id,
      name: carName,
      part_ids: [...new Set(selectedParts.map(part => part.id))] // Remove duplicates
    };

    console.log('🔍 Car save data being sent to backend:', saveData);
    console.log('🔍 Note: Manual adjustments are saved separately via handleSaveManualAdjustments');

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('🔍 === SAVE MANUAL ADJUSTMENTS FIRST ===');
      console.log('🔍 Manual transforms to save:', manualTransforms);
      console.log('🔍 Number of manual adjustments to save:', Object.keys(manualTransforms).length);

      // Save manual adjustments first if any exist
      if (Object.keys(manualTransforms).length > 0) {
        console.log('🔍 Saving manual adjustments...');
        for (const [partId, transform] of Object.entries(manualTransforms)) {
          const partIdNum = parseInt(partId);
          console.log(`🔍 Saving manual transform for part ${partId}:`, transform);
          
          const adjustmentData = {
            car_model_id: selectedCarModel.id,
            part_id: partIdNum,
            transform: transform
          };
          
          try {
            console.log(`🔍 Calling saveManualAdjustment API for part ${partId}:`, adjustmentData);
            await apiClient.saveManualAdjustment(token, adjustmentData);
            console.log(`✅ Manual adjustment saved for part ${partId}`);
          } catch (error) {
            console.error(`❌ Failed to save manual adjustment for part ${partId}:`, error);
            console.error(`❌ Error details:`, error);
            // Continue with car save even if manual adjustment fails
          }
        }
        console.log('🔍 === MANUAL ADJUSTMENTS SAVE COMPLETE ===');
      } else {
        console.log('🔍 No manual adjustments to save');
      }

      console.log('🔍 === SAVE CAR CONFIGURATION ===');
      console.log('🔍 About to call apiClient.saveCar with data:', saveData);

      // Save the car configuration
      const savedCar = await apiClient.saveCar(token, saveData);

      console.log('🔍 Car saved successfully:', savedCar);
      console.log('🔍 Response from backend:', savedCar);
      console.log('🔍 === CAR SAVE COMPLETE ===');
      
      // Show success message (you could use a toast notification here)
      alert('Car configuration saved successfully!');
      
      console.log('🔍 ===== SAVE CAR DEBUG END =====');
      
    } catch (err: any) {
      console.error('🔍 ===== SAVE CAR ERROR =====');
      console.error('Failed to save car:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        selectedParts,
        saveData
      });
      setError(err.message || 'Failed to save car configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Load car models
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setIsLoadingModels(true);
      apiClient.getCarModels()
        .then(models => {
          console.log('Loaded car models from API:', models);
          
          // Filter out the database Porsche models and use the local one
          const filteredModels = models.filter(model => 
            !(model.name.includes("Porsche") && model.source_uid === "6WZyV")
          );
          
          // Add the local Porsche model at the beginning
          const localPorsche: CarModel = {
            id: 999, // Use a high ID to avoid conflicts
            name: "1975 Porsche 911 (930) Turbo",
            manufacturer: "Porsche",
            year: 1975,
            glb_url: "/free_1975_porsche_911_930_turbo/scene.gltf",
            thumbnail_url: "/placeholder.svg?height=200&width=300",
            license_slug: "CC-BY-4.0",
            license_url: "https://creativecommons.org/licenses/by/4.0/",
            attribution_html: "Model by Lionsharp Studios",
            source_url: "https://skfb.ly/6WZyV",
            uploader: "Lionsharp Studios",
            source_uid: "6WZyV",
            bounds: '{"min": [-1, 0, -2], "max": [1, 1, 2]}',
            scale_factor: 1.0
          };
          
          const finalModels = [localPorsche, ...filteredModels];
          setCarModels(finalModels);
          setIsLoadingModels(false);
        })
        .catch(err => {
          console.error('Failed to load car models:', err);
          setError('Failed to load car models');
          setIsLoadingModels(false);
          // Fallback to mock data if API fails
          setCarModels(MOCK_CAR_MODELS);
        });
    }
  }, [isAuthenticated, authLoading])

  // Load parts when car model is selected
  useEffect(() => {
    if (selectedCarModel) {
      setIsLoadingParts(true)
      apiClient.getParts(selectedCarModel.id)
        .then(parts => {
          setAvailableParts(parts)
          setIsLoadingParts(false)
        })
        .catch(err => {
          console.error('Failed to load parts:', err)
          setError('Failed to load parts')
          setIsLoadingParts(false)
        })
    }
  }, [selectedCarModel])

  // Calculate total cost when parts change
  useEffect(() => {
    const cost = selectedParts.reduce((sum, part) => sum + part.price, 0)
  }, [selectedParts])

  const handlePartSelect = (part: Part) => {
    setSelectedParts(prev => [...prev, part])
  }

  const handlePartDeselect = (part: Part) => {
    setSelectedParts(prev => prev.filter(p => p.id !== part.id))
    // Clear manual transforms for this part when deselected
    setManualTransforms(prev => {
      const newTransforms = { ...prev }
      delete newTransforms[part.id]
      return newTransforms
    })
  }

  const handleEstimateCost = async () => {
    try {
      const partIds = selectedParts.map(part => part.id)
      if (partIds.length === 0) return
      
      const estimate = await apiClient.estimateCost(partIds)
      console.log('Cost estimate:', estimate)
      // You could show this in a modal or update the UI
    } catch (err: any) {
      setError(err.message || "Failed to calculate cost estimate")
    }
  }

  const resetConfiguration = () => {
    setSelectedParts([])
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Car className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">CarCustom3D</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white">Welcome, {user?.first_name}</span>
          <Button 
            className="text-white hover:bg-white/10" 
            onClick={() => {
              console.log('My Cars button clicked, navigating to /saved-cars');
              console.log('Current URL:', window.location.href);
              
              // Use window.location directly since router.push isn't working
              console.log('Using window.location.href...');
              window.location.href = '/saved-cars';
            }}
          >
            <Car className="mr-2 h-4 w-4" />
            My Cars
          </Button>
          <Button className="text-white hover:bg-white/10" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-4 overflow-y-auto h-full scrollbar-hide">
        {/* Manual Correction Controls - Always Visible */}
        {/* <ManualCorrectionControls
          selectedParts={selectedParts}
          manualMode={manualMode}
          onManualModeToggle={handleManualModeToggle}
          onSaveManualAdjustments={handleSaveManualAdjustments}
          onResetToAuto={handleResetToAuto}
          onClearAllAdjustments={handleClearAllAdjustments}
        /> */}
        
        {error && (
          <Alert className="mb-4 bg-red-500/10 border-red-500/20 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Car Model Selection */}
        {!selectedCarModel && (
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white mb-4">Choose Your Car Model</h1>

            {isLoadingModels ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="ml-2 text-white">Loading car models...</span>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {carModels.map((model) => (
                  <Card
                    key={model.id}
                    className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                    onClick={() => setSelectedCarModel(model)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-lg flex items-center justify-center">
                        {model.thumbnail_url ? (
                          <img
                            src={model.thumbnail_url || "/placeholder.svg"}
                            alt={model.name}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <Car className="h-16 w-16 text-blue-400" />
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-white text-lg mb-2">{model.name}</h3>
                        <p className="text-gray-300 mb-2">
                          {model.manufacturer} • {model.year}
                        </p>
                        <p className="text-green-400 font-semibold">
                          Starting from $75,000
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Customization Interface */}
        {selectedCarModel && (
          <div className="grid lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
            {/* 3D Viewer */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{selectedCarModel.name}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {selectedCarModel.manufacturer} • {selectedCarModel.year}
                      {selectedCarModel.name.includes("Porsche") && (
                        <div className="mt-1 text-xs text-gray-400">
                          Model by Lionsharp Studios • 
                          <a 
                            href="https://skfb.ly/6WZyV" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 ml-1"
                          >
                            CC BY 4.0
                          </a>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      onClick={resetConfiguration}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      onClick={() => setSelectedCarModel(null)}
                    >
                      Change Model
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleSaveCar}
                      disabled={isSaving || selectedParts.length === 0}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Save Car
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <div className="h-full">
                    <CarViewer
                      carModel={selectedCarModel}
                      selectedParts={selectedParts}
                      onPartSelect={handlePartSelect}
                      onPartDeselect={handlePartDeselect}
                      manualMode={manualMode}
                      onManualModeToggle={handleManualModeToggle}
                      onSaveManualAdjustments={handleSaveManualAdjustments}
                      onResetToAuto={handleResetToAuto}
                      onClearAllAdjustments={handleClearAllAdjustments}
                      manualTransforms={manualTransforms}
                      onManualTransformChange={(partId, transform) => {
                        console.log(`🔍 Manual transform change for part ${partId}:`, transform);
                        console.log(`🔍 Previous manualTransforms:`, manualTransforms);
                        setManualTransforms(prev => {
                          const newTransforms = {
                            ...prev,
                            [partId]: transform
                          };
                          console.log(`🔍 New manualTransforms:`, newTransforms);
                          return newTransforms;
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Parts Selection */}
            <div className="h-full">
              <PartsSelector
                carModel={selectedCarModel}
                selectedParts={selectedParts}
                onPartSelect={handlePartSelect}
                onPartDeselect={handlePartDeselect}
              />
              
              {/* Manual Correction Controls - Below Parts Selector */}
              <ManualCorrectionControls
                selectedParts={selectedParts}
                manualMode={manualMode}
                onManualModeToggle={handleManualModeToggle}
                onSaveManualAdjustments={handleSaveManualAdjustments}
                onResetToAuto={handleResetToAuto}
                onClearAllAdjustments={handleClearAllAdjustments}
              />
              
              {/* Save Car Button */}
              <div className="mt-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveCar}
                  disabled={isSaving || selectedParts.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Configuration...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Save Car Configuration
                    </>
                  )}
                </Button>
                {selectedParts.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Select at least one part to save
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
