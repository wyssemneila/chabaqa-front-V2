"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Trophy, 
  Calendar, 
  Package, 
  MessageSquare,
  Info,
  Users,
  Settings
} from "lucide-react"

interface CommunityDetailsContentProps {
  community: any
}

export function CommunityDetailsContent({ community }: CommunityDetailsContentProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-gray-50 border border-gray-200 p-1 rounded-xl">
          <TabsTrigger 
            value="posts"
            className="data-[state=active]:bg-[#ef4444] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="courses"
            className="data-[state=active]:bg-[#47c7ea] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Courses</span>
          </TabsTrigger>
          <TabsTrigger 
            value="challenges"
            className="data-[state=active]:bg-[#ff9b28] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <Trophy className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Challenges</span>
          </TabsTrigger>
          <TabsTrigger 
            value="events"
            className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger 
            value="products"
            className="data-[state=active]:bg-[#a855f7] data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <Package className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger 
            value="about"
            className="data-[state=active]:bg-chabaqa-primary data-[state=active]:text-white rounded-lg transition-all duration-200"
          >
            <Info className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">About</span>
          </TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6 mt-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">
              About This Community
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-3 text-gray-900">Description</h4>
                <p className="text-gray-700 leading-relaxed text-base">
                  {community.longDescription || community.description || "No description available."}
                </p>
              </div>

              {community.tags && community.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3 text-gray-900">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag: string, index: number) => (
                      <Badge 
                        key={index} 
                        className="bg-gradient-to-r from-chabaqa-primary/10 to-chabaqa-secondary1/10 text-chabaqa-primary border-chabaqa-primary/20 hover:from-chabaqa-primary hover:to-chabaqa-secondary1 hover:text-white transition-all duration-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-bold text-gray-900">{community.category}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">Rank</p>
                  <p className="font-bold text-gray-900 capitalize">{community.rank || "Bronze"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="font-bold text-gray-900">
                    {new Date(community.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge 
                    variant={community.verified ? "default" : "secondary"}
                    className={community.verified ? "bg-chabaqa-primary" : ""}
                  >
                    {community.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Community Rules */}
          {community.rules && community.rules.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">
                Community Rules
              </h3>
              <ul className="space-y-4">
                {community.rules.map((rule: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-chabaqa-primary text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed pt-1">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                No courses available yet. Check back later!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                No challenges available yet. Check back later!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                No events scheduled yet. Check back later!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                No products available yet. Check back later!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Community Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                No posts yet. Be the first to post!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
