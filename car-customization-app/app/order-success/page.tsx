"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Car, Truck, Calendar, Download, Share2, ArrowRight } from "lucide-react"

export default function OrderSuccessPage() {
  const orderNumber = "ORD-2024-001234"
  const estimatedDelivery = "March 15, 2024"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Car className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">CarCustom3D</span>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            Back to Dashboard
          </Button>
        </Link>
      </nav>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">Order Confirmed!</h1>
          <p className="text-xl text-gray-300 mb-8">
            Thank you for your purchase. Your custom car parts are being prepared for shipment.
          </p>

          {/* Order Details */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Order Details</CardTitle>
              <CardDescription className="text-gray-300">Order #{orderNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-gray-300 text-sm">Vehicle</p>
                  <p className="text-white font-semibold">BMW M3 Competition</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Total Amount</p>
                  <p className="text-white font-semibold">$5,550.00</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Payment Method</p>
                  <p className="text-white font-semibold">•••• •••• •••• 3456</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Order Status</p>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Processing</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Truck className="h-8 w-8 text-blue-400" />
                <div className="text-left">
                  <p className="text-white font-semibold">Estimated Delivery</p>
                  <p className="text-gray-300">{estimatedDelivery}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                You'll receive tracking information via email once your order ships.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Calendar className="mr-2 h-4 w-4" />
              Track Order
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Share2 className="mr-2 h-4 w-4" />
              Share Build
            </Button>
          </div>

          {/* Next Steps */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <Car className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Start Another Build</h3>
                <p className="text-gray-300 text-sm mb-4">Customize another vehicle with our 3D configurator</p>
                <Link href="/customize">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                    New Project <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6 text-center">
                <Share2 className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Join Our Community</h3>
                <p className="text-gray-300 text-sm mb-4">Share your build and get inspired by others</p>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  Join Community <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
