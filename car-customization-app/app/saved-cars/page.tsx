"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { apiClient, type SavedCar, type CarModel, type Part } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Loader2, LogOut, Trash2, Edit, Eye, AlertCircle } from "lucide-react"

interface SavedCarWithDetails extends SavedCar {
  carModel?: CarModel;
  parts?: Part[];
}

export default function SavedCarsPage() {
  console.log('🎯 SavedCarsPage component is loading...');
  
  const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth()
  const router = useRouter()

  // State management
  const [savedCars, setSavedCars] = useState<SavedCarWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Load saved cars
  useEffect(() => {
    const loadSavedCars = async () => {
      if (!isAuthenticated) return

      try {
        setIsLoading(true)
        const token = localStorage.getItem('auth_token')
        if (!token) {
          throw new Error('Authentication required')
        }

        console.log('Loading saved cars...');
        const cars = await apiClient.getSavedCars(token)
        console.log('Raw saved cars data:', cars);
        
        // Fetch real data for each saved car with better error handling
        const carsWithDetails: SavedCarWithDetails[] = await Promise.all(
          cars.map(async (car) => {
            try {
              console.log(`Loading details for car ${car.id}...`);
              
              // Fetch the actual car model
              const carModel = await apiClient.getCarModel(car.car_model_id)
              
              // Fetch the actual parts
              const allParts = await apiClient.getParts(car.car_model_id)
              const savedParts = car.part_ids ? allParts.filter(part => car.part_ids!.includes(part.id)) : []
              
              console.log(`✅ Loaded details for car ${car.id}: ${savedParts.length} parts`);
              
              return {
                ...car,
                carModel: carModel,
                parts: savedParts
              }
            } catch (error) {
              console.error(`Failed to load details for car ${car.id}:`, error)
              // Return car with placeholder data if fetching details fails
              return {
                ...car,
                carModel: {
                  id: car.car_model_id,
                  name: `Car Model ${car.car_model_id}`,
                  manufacturer: "Unknown",
                  year: 2024,
                  glb_url: "",
                  thumbnail_url: "",
                  license_slug: "",
                  license_url: "",
                  attribution_html: "",
                  source_url: "",
                  uploader: "",
                  source_uid: "",
                  bounds: "",
                  scale_factor: 1.0
                },
                parts: []
              }
            }
          })
        )

        console.log('All cars loaded:', carsWithDetails);
        setSavedCars(carsWithDetails)
      } catch (err: any) {
        console.error('Failed to load saved cars:', err)
        setError(err.message || 'Failed to load saved cars')
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedCars()
  }, [isAuthenticated])

  const handleDeleteCar = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this saved car?')) {
      return
    }

    try {
      setIsDeleting(carId)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Authentication required')
      }

      await apiClient.deleteSavedCar(token, carId)
      
      // Remove from local state
      setSavedCars(prev => prev.filter(car => car.id !== carId))
    } catch (err: any) {
      console.error('Failed to delete saved car:', err)
      setError(err.message || 'Failed to delete saved car')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEditCar = (car: SavedCarWithDetails) => {
    // Navigate to customize page with the saved car data
    router.push(`/customize?savedCarId=${car.id}`)
  }

  const handleViewCar = (car: SavedCarWithDetails) => {
    // Navigate to a view-only page or modal
    router.push(`/saved-cars/${car.id}`)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg mb-2">Loading your saved cars...</p>
          <p className="text-gray-400 text-sm">This may take a few moments</p>
        </div>
      </div>
    )
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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Saved Cars</h1>
            <p className="text-gray-300">Manage your car configurations</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push('/customize')}
          >
            <Car className="mr-2 h-4 w-4" />
            Create New Car
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
            <span className="ml-2 text-white">Loading your saved cars...</span>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {savedCars.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No saved cars yet</h3>
                  <p className="text-gray-300 mb-6">
                    Start customizing cars and save your configurations to see them here.
                  </p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => router.push('/customize')}
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Create Your First Car
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Saved Cars Grid */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedCars.map((car) => (
                  <Card 
                    key={car.id} 
                    className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">{car.name}</CardTitle>
                          <CardDescription className="text-gray-300">
                            {car.carModel?.name || `Car Model ${car.car_model_id}`}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            onClick={() => handleViewCar(car)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                            onClick={() => handleEditCar(car)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDeleteCar(car.id)}
                            disabled={isDeleting === car.id}
                          >
                            {isDeleting === car.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Created:</span>
                          <span className="text-white">
                            {new Date(car.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Parts:</span>
                          <span className="text-white">
                            {car.parts?.length || 0} parts
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleEditCar(car)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Configuration
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
