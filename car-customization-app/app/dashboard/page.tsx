"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Car, Plus, Settings, History, CreditCard, Bell, Search, Filter, Grid3X3, List } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const recentProjects = [
    {
      id: 1,
      name: "BMW M3 Custom Build",
      model: "BMW M3 Competition",
      lastModified: "2 hours ago",
      status: "In Progress",
      thumbnail: "/placeholder.svg?height=200&width=300",
      parts: 12,
      estimatedCost: "$15,420",
    },
    {
      id: 2,
      name: "Mustang GT Track Setup",
      model: "Ford Mustang GT",
      lastModified: "1 day ago",
      status: "Completed",
      thumbnail: "/placeholder.svg?height=200&width=300",
      parts: 8,
      estimatedCost: "$8,750",
    },
    {
      id: 3,
      name: "Civic Type R Street",
      model: "Honda Civic Type R",
      lastModified: "3 days ago",
      status: "Draft",
      thumbnail: "/placeholder.svg?height=200&width=300",
      parts: 5,
      estimatedCost: "$3,200",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "In Progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "Draft":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
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
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </Button>
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback className="bg-blue-600 text-white">JD</AvatarFallback>
          </Avatar>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, John!</h1>
            <p className="text-gray-300">Continue working on your custom builds</p>
          </div>
          <Link href="/customize">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Projects</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
                <Car className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Parts Installed</p>
                  <p className="text-2xl font-bold text-white">47</p>
                </div>
                <Settings className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-white">$27,370</p>
                </div>
                <CreditCard className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">8</p>
                </div>
                <History className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Projects</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex border border-white/20 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:bg-white/10 ${viewMode === "grid" ? "bg-white/10" : ""}`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-white hover:bg-white/10 ${viewMode === "list" ? "bg-white/10" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
              >
                <CardContent className="p-0">
                  {viewMode === "grid" ? (
                    <>
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-lg flex items-center justify-center">
                        <Car className="h-12 w-12 text-blue-400" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{project.name}</h3>
                          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{project.model}</p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>{project.parts} parts</span>
                          <span>{project.estimatedCost}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{project.lastModified}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center p-6 space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                        <Car className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white">{project.name}</h3>
                          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        </div>
                        <p className="text-gray-300 text-sm">{project.model}</p>
                        <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
                          <span>
                            {project.parts} parts • {project.estimatedCost}
                          </span>
                          <span>{project.lastModified}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-300">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/customize">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Project
                </Button>
              </Link>
              <Link href="/browse">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Car Models
                </Button>
              </Link>
              <Link href="/parts">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <Settings className="mr-2 h-4 w-4" />
                  Explore Parts Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-gray-300">Your latest customization activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Added carbon fiber spoiler to BMW M3</p>
                  <p className="text-gray-400 text-xs">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Completed Mustang GT project</p>
                  <p className="text-gray-400 text-xs">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Started new Civic Type R build</p>
                  <p className="text-gray-400 text-xs">3 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
