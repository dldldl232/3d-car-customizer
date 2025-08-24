"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter, useParams } from "next/navigation"
import { apiClient, type SavedCar, type CarModel, type Part } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Loader2, LogOut, ArrowLeft, Edit, AlertCircle } from "lucide-react"
import CarViewer from "@/components/CarViewer"

interface SavedCarWithDetails extends SavedCar {
  carModel?: CarModel;
  parts?: Part[];
  manualTransforms?: Record<number, any>;
}

export default function SavedCarViewPage() {
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const savedCarId = params.id as string

  // State management
  const [savedCar, setSavedCar] = useState<SavedCarWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Load saved car details
  useEffect(() => {
    const loadSavedCar = async () => {
      if (!isAuthenticated || !savedCarId) return

      try {
        setIsLoading(true)
        const token = localStorage.getItem('auth_token')
        if (!token) {
          throw new Error('Authentication required')
        }

        // Get the saved car
        const car = await apiClient.getSavedCar(token, parseInt(savedCarId))
        
        // Fetch the actual car model
        const carModel = await apiClient.getCarModel(car.car_model_id)
        
        // Fetch the actual parts
        const allParts = await apiClient.getParts(car.car_model_id)
        const savedParts = car.part_ids ? allParts.filter(part => car.part_ids!.includes(part.id)) : []
        
        // Load manual adjustments for this car model
        let manualTransforms: Record<number, any> = {};
        try {
          console.log('🔍 Loading manual adjustments for car model:', carModel.id);
          const manualAdjustments = await apiClient.getManualAdjustments(token, carModel.id);
          console.log('🔍 Raw manual adjustments from API:', manualAdjustments);
          
          // Convert the adjustments to the format expected by manualTransforms
          manualAdjustments.forEach((adjustment: any) => {
            const transform = adjustment.transform_override || adjustment.transform;
            if (transform && savedParts.some(part => part.id === adjustment.part_id)) {
              manualTransforms[adjustment.part_id] = transform;
              console.log(`✅ Loaded manual transform for part ${adjustment.part_id}:`, transform);
            }
          });
        } catch (error) {
          console.error('🔍 Failed to load manual adjustments:', error);
        }
        
        const carWithDetails: SavedCarWithDetails = {
          ...car,
          carModel: carModel,
          parts: savedParts,
          manualTransforms: manualTransforms
        }

        setSavedCar(carWithDetails)
      } catch (err: any) {
        console.error('Failed to load saved car:', err)
        setError(err.message || 'Failed to load saved car')
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedCar()
  }, [isAuthenticated, savedCarId])

  const handleEditCar = () => {
    router.push(`/customize?savedCarId=${savedCarId}`)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Car className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">CarCustom3D</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white">Welcome, {user?.first_name}</span>
          <Button className="text-white hover:bg-white/10" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              className="text-white hover:bg-white/10"
              onClick={() => router.push('/saved-cars')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Cars
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {savedCar?.name || 'Loading...'}
              </h1>
              <p className="text-gray-300">View your saved car configuration</p>
            </div>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleEditCar}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Configuration
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2 text-white">Loading car configuration...</span>
          </div>
        ) : savedCar ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 3D Viewer */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">3D View</CardTitle>
                  <CardDescription className="text-gray-300">
                    {savedCar.carModel?.name || `Car Model ${savedCar.car_model_id}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px]">
                    {savedCar.carModel && (
                      <CarViewer
                        carModel={savedCar.carModel}
                        selectedParts={savedCar.parts || []}
                        onPartSelect={() => {}} // Read-only
                        onPartDeselect={() => {}} // Read-only
                        manualMode={false}
                        onManualModeToggle={() => {}} // Read-only
                        onSaveManualAdjustments={() => {}} // Read-only
                        onResetToAuto={() => {}} // Read-only
                        onClearAllAdjustments={() => {}} // Read-only
                        manualTransforms={savedCar.manualTransforms || {}}
                        onManualTransformChange={() => {}} // Read-only
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Car Details */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Car Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Name:</span>
                    <span className="text-white font-medium">{savedCar.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Car Model:</span>
                    <span className="text-white font-medium">
                      {savedCar.carModel?.name || `Car Model ${savedCar.car_model_id}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Created:</span>
                    <span className="text-white font-medium">
                      {new Date(savedCar.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Parts:</span>
                    <span className="text-white font-medium">
                      {savedCar.parts?.length || 0} parts
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Parts List */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Configured Parts</CardTitle>
                </CardHeader>
                <CardContent>
                  {savedCar.parts && savedCar.parts.length > 0 ? (
                    <div className="space-y-2">
                      {savedCar.parts.map((part) => (
                        <div key={part.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                          <span className="text-white">{part.name}</span>
                          <span className="text-gray-300 text-sm">{part.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-center py-4">No parts configured</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Car not found</h3>
              <p className="text-gray-300 mb-6">
                The saved car configuration you're looking for doesn't exist.
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => router.push('/saved-cars')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Cars
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
