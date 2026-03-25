"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Eye, Smartphone, Tablet, Monitor, Palette, Type, Layout, Zap } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useCreatorCommunity } from "../context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"

export default function CustomizeCommunityPage() {
  const router = useRouter()
  const { guard, selectedCommunity: contextCommunity, isLoading: contextLoading } = useCommunityGuard()
  const [community, setCommunity] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [activeTab, setActiveTab] = useState("design")
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const loadCommunity = async () => {
      // Wait for context to load
      if (contextLoading || !contextCommunity) return
      
      try {
        // Use the community from context instead of params.slug
        const foundCommunity = contextCommunity
        
        if (foundCommunity) {
          // Get community settings
          try {
            const settingsResponse = await api.communities.getSettings(foundCommunity.id)
            const communitySettings = settingsResponse.data || {}
            
            // Type assertion for settings to include custom properties
            const settingsWithCustomProps = communitySettings as any
            
            setCommunity({
              ...foundCommunity,
              settings: {
                template: settingsWithCustomProps.template || "modern",
                primaryColor: settingsWithCustomProps.primaryColor || "#8e78fb",
                secondaryColor: settingsWithCustomProps.secondaryColor || "#47c7ea",
                logo: settingsWithCustomProps.logo || foundCommunity.image,
                welcomeMessage: settingsWithCustomProps.welcomeMessage || "Welcome to our amazing community!",
                features: settingsWithCustomProps.features || ["Expert-led courses", "Interactive challenges", "1-on-1 mentoring", "Community support"],
                benefits: settingsWithCustomProps.benefits || [
                  "Access to exclusive content",
                  "Direct mentor feedback",
                  "Career guidance",
                  "Networking opportunities",
                ],
                showHero: settingsWithCustomProps.showHero !== false,
                showFeatures: settingsWithCustomProps.showFeatures !== false,
                showPosts: settingsWithCustomProps.showPosts !== false,
                showBenefits: settingsWithCustomProps.showBenefits !== false,
                showTestimonials: settingsWithCustomProps.showTestimonials !== false,
                showStats: settingsWithCustomProps.showStats !== false,
                headerStyle: settingsWithCustomProps.headerStyle || "default",
                contentWidth: settingsWithCustomProps.contentWidth || "normal",
                enableAnimations: settingsWithCustomProps.enableAnimations !== false,
                enableParallax: settingsWithCustomProps.enableParallax || false,
                customCSS: settingsWithCustomProps.customCSS || "",
                metaTitle: settingsWithCustomProps.metaTitle || foundCommunity.name,
                metaDescription: settingsWithCustomProps.metaDescription || foundCommunity.description,
              },
              longDescription: foundCommunity.longDescription || foundCommunity.description + " Join our community to learn, grow, and connect with like-minded individuals.",
              members: foundCommunity.members || 0,
              rating: foundCommunity.rating || 4.8,
            })
          } catch (settingsError) {
            console.error('Failed to load community settings:', settingsError)
            // Use default settings if settings API fails
            setCommunity({
              ...foundCommunity,
              settings: {
                template: "modern",
                primaryColor: "#8e78fb",
                secondaryColor: "#47c7ea",
                logo: foundCommunity.image,
                welcomeMessage: "Welcome to our amazing community!",
                features: ["Expert-led courses", "Interactive challenges", "1-on-1 mentoring", "Community support"],
                benefits: [
                  "Access to exclusive content",
                  "Direct mentor feedback",
                  "Career guidance",
                  "Networking opportunities",
                ],
                showHero: true,
                showFeatures: true,
                showPosts: true,
                showBenefits: true,
                showTestimonials: true,
                showStats: true,
                headerStyle: "default",
                contentWidth: "normal",
                enableAnimations: true,
                enableParallax: false,
                customCSS: "",
                metaTitle: foundCommunity.name,
                metaDescription: foundCommunity.description,
              },
              longDescription: foundCommunity.longDescription || foundCommunity.description + " Join our community to learn, grow, and connect with like-minded individuals.",
              members: foundCommunity.members || 0,
              rating: foundCommunity.rating || 4.8,
            })
          }
        }
      } catch (error) {
        console.error('Failed to load community:', error)
      }
    }

    loadCommunity()
  }, [contextCommunity, contextLoading])

  const handleSave = async () => {
    try {
      await api.communities.updateSettings(community.id, community.settings)
      setHasChanges(false)
      // Show success message
      console.log('Community settings saved successfully')
    } catch (error) {
      console.error('Failed to save community settings:', error)
      // Show error message
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setCommunity((prev: any) => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
  }

  const handleSettingsChange = (field: string, value: any) => {
    setCommunity((prev: any) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }
 
  if (!contextCommunity) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No community selected. Please select a community first.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/creator')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customization settings...</p>
        </div>
      </div>
    )
  }

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  }

  if (guard) return guard

  return (
    <PageShell className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customize {community.name}</h1>
            <p className="text-gray-600 mt-1">Personalize your community's appearance and settings</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Device Preview Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {(["desktop", "tablet", "mobile"] as const).map((device) => {
              const Icon = deviceIcons[device]
              return (
                <Button
                  key={device}
                  variant={previewDevice === device ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewDevice(device)}
                  className={cn(
                    "px-3 py-2 transition-all duration-200",
                    previewDevice === device ? "bg-white shadow-sm" : "hover:bg-gray-200",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline capitalize">{device}</span>
                </Button>
              )
            })}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowPreview(true)} className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center space-x-2"
              style={{
                backgroundColor: hasChanges ? community.settings.primaryColor : undefined,
                opacity: hasChanges ? 1 : 0.5,
              }}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div
          className="border rounded-lg p-4"
          style={{
            backgroundColor: `${community.settings.primaryColor}10`,
            borderColor: `${community.settings.primaryColor}30`,
          }}
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: community.settings.primaryColor }}
            ></div>
            <p className="font-medium" style={{ color: community.settings.primaryColor }}>
              You have unsaved changes
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Customization Panel */}
        <div className="xl:col-span-3">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b" style={{ borderColor: `${community.settings.primaryColor}20` }}>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" style={{ color: community.settings.primaryColor }} />
                <span>Customization Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-none border-b">
                  <TabsTrigger value="design" className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span>Design</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center space-x-2">
                    <Type className="w-4 h-4" />
                    <span>Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="flex items-center space-x-2">
                    <Layout className="w-4 h-4" />
                    <span>Layout</span>
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Advanced</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="p-6 sm:p-8 space-y-8">
                  {/* Color Customization */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Brand Colors</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Primary Color</Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={community.settings.primaryColor}
                            onChange={(e) => handleSettingsChange("primaryColor", e.target.value)}
                            className="w-12 h-12 rounded border"
                          />
                          <Input
                            value={community.settings.primaryColor}
                            onChange={(e) => handleSettingsChange("primaryColor", e.target.value)}
                            placeholder="#8e78fb"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Used for buttons, accents, and primary elements</p>
                      </div>
                      <div className="space-y-3">
                        <Label>Secondary Color</Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={community.settings.secondaryColor}
                            onChange={(e) => handleSettingsChange("secondaryColor", e.target.value)}
                            className="w-12 h-12 rounded border"
                          />
                          <Input
                            value={community.settings.secondaryColor}
                            onChange={(e) => handleSettingsChange("secondaryColor", e.target.value)}
                            placeholder="#47c7ea"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Used for gradients and secondary elements</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="p-6 sm:p-8 space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Basic Information</Label>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Community Name</Label>
                        <Input
                          id="name"
                          value={community.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Short Description</Label>
                        <Input
                          id="description"
                          value={community.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longDescription">Long Description</Label>
                        <Textarea
                          id="longDescription"
                          value={community.longDescription}
                          onChange={(e) => handleInputChange("longDescription", e.target.value)}
                          rows={4}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* Welcome Message */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Welcome Message</Label>
                    <Textarea
                      value={community.settings.welcomeMessage}
                      onChange={(e) => handleSettingsChange("welcomeMessage", e.target.value)}
                      rows={3}
                      placeholder="Welcome new members with a personalized message..."
                    />
                  </div>
                  <Separator />
                  {/* Features */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Community Features</Label>
                    <div className="space-y-3">
                      {community.settings.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Input
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...community.settings.features]
                              newFeatures[index] = e.target.value
                              handleSettingsChange("features", newFeatures)
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newFeatures = community.settings.features.filter((_: any, i: number) => i !== index)
                              handleSettingsChange("features", newFeatures)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newFeatures = [...community.settings.features, "New Feature"]
                          handleSettingsChange("features", newFeatures)
                        }}
                        style={{
                          borderColor: community.settings.primaryColor,
                          color: community.settings.primaryColor,
                        }}
                      >
                        Add Feature
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  {/* Benefits */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Member Benefits</Label>
                    <div className="space-y-3">
                      {community.settings.benefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Textarea
                            value={benefit}
                            onChange={(e) => {
                              const newBenefits = [...community.settings.benefits]
                              newBenefits[index] = e.target.value
                              handleSettingsChange("benefits", newBenefits)
                            }}
                            rows={2}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newBenefits = community.settings.benefits.filter((_: any, i: number) => i !== index)
                              handleSettingsChange("benefits", newBenefits)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newBenefits = [...community.settings.benefits, "New benefit for members"]
                          handleSettingsChange("benefits", newBenefits)
                        }}
                        style={{
                          borderColor: community.settings.primaryColor,
                          color: community.settings.primaryColor,
                        }}
                      >
                        Add Benefit
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="p-6 sm:p-8 space-y-8">
                  {/* Section Toggles */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Page Sections</Label>
                    <div className="space-y-4">
                      {[
                        { key: "showHero", label: "Hero Section", description: "Main banner with community info" },
                        {
                          key: "showFeatures",
                          label: "Features Section",
                          description: "Highlight community features",
                        },
                        { key: "showPosts", label: "Posts Section", description: "Recent community updates" },
                        { key: "showBenefits", label: "Benefits Section", description: "Member benefits and perks" },
                        { key: "showTestimonials", label: "Testimonials", description: "Member success stories" },
                        { key: "showStats", label: "Statistics", description: "Community metrics and numbers" },
                      ].map((section) => (
                        <div
                          key={section.key}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          style={{ borderColor: `${community.settings.primaryColor}20` }}
                        >
                          <div>
                            <Label className="font-medium">{section.label}</Label>
                            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                          </div>
                          <Switch
                            checked={community.settings[section.key] !== false}
                            onCheckedChange={(checked) => handleSettingsChange(section.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="p-6 sm:p-8 space-y-8">
                  {/* Animation Settings */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Animation & Effects</Label>
                    <div className="space-y-4">
                      <div
                        className="flex items-center justify-between p-4 border rounded-lg"
                        style={{ borderColor: `${community.settings.primaryColor}20` }}
                      >
                        <div>
                          <Label className="font-medium">Enable Animations</Label>
                          <p className="text-sm text-gray-600 mt-1">Smooth transitions and hover effects</p>
                        </div>
                        <Switch
                          checked={community.settings.enableAnimations !== false}
                          onCheckedChange={(checked) => handleSettingsChange("enableAnimations", checked)}
                        />
                      </div>
                      <div
                        className="flex items-center justify-between p-4 border rounded-lg"
                        style={{ borderColor: `${community.settings.primaryColor}20` }}
                      >
                        <div>
                          <Label className="font-medium">Parallax Effects</Label>
                          <p className="text-sm text-gray-600 mt-1">Background parallax scrolling</p>
                        </div>
                        <Switch
                          checked={community.settings.enableParallax || false}
                          onCheckedChange={(checked) => handleSettingsChange("enableParallax", checked)}
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* Custom CSS */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Custom CSS</Label>
                    <Textarea
                      value={community.settings.customCSS || ""}
                      onChange={(e) => handleSettingsChange("customCSS", e.target.value)}
                      rows={8}
                      placeholder="/* Add your custom CSS here */
.custom-class {
  /* Your styles */
}"
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Sidebar */}
        <div className="xl:col-span-1">
          <Card className="border-0 shadow-lg sticky top-8">
            <CardHeader className="border-b" style={{ borderColor: `${community.settings.primaryColor}20` }}>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" style={{ color: community.settings.primaryColor }} />
                  <span>Live Preview</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs capitalize"
                  style={{
                    borderColor: community.settings.primaryColor,
                    color: community.settings.primaryColor,
                  }}
                >
                  {previewDevice}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div
                className={cn(
                  "border rounded-lg overflow-hidden bg-white transition-all duration-300 shadow-lg",
                  previewDevice === "desktop" && "aspect-video",
                  previewDevice === "tablet" && "aspect-[4/5] max-w-md mx-auto",
                  previewDevice === "mobile" && "aspect-[9/16] max-w-xs mx-auto",
                )}
                style={{ borderColor: `${community.settings.primaryColor}30` }}
              >
                <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                  {/* Device Frame for Mobile */}
                  {previewDevice === "mobile" && (
                    <div className="absolute top-0 left-0 right-0 h-6 bg-gray-900 rounded-t-lg flex items-center justify-center z-10">
                      <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                  )}
                  {/* Preview Content */}
                  <div
                    className="w-full h-full flex items-center justify-center relative"
                    style={{
                      background: `linear-gradient(135deg, ${community.settings.primaryColor}20 0%, ${community.settings.secondaryColor}20 100%), linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #3730a3 100%)`,
                    }}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:15px_15px]"></div>
                    </div>
                    {/* Content */}
                    <div className="relative z-10 text-center space-y-3 p-4">
                      {/* Community Avatar */}
                      <div
                        className={cn(
                          "rounded-full mx-auto flex items-center justify-center text-white font-bold shadow-lg",
                          previewDevice === "mobile" ? "w-8 h-8 text-xs" : "w-12 h-12 text-sm",
                        )}
                        style={{ backgroundColor: community.settings.primaryColor }}
                      >
                        {community.name.charAt(0)}
                      </div>
                      {/* Community Name */}
                      <div>
                        <h3
                          className={cn(
                            "font-bold mb-1 text-white",
                            previewDevice === "mobile" ? "text-xs" : "text-sm",
                          )}
                        >
                          {community.name}
                        </h3>
                        <p
                          className={cn(
                            "opacity-80 max-w-xs mx-auto line-clamp-2 text-white",
                            previewDevice === "mobile" ? "text-xs" : "text-xs",
                          )}
                        >
                          {community.description}
                        </p>
                      </div>
                      {/* Stats */}
                      <div className="flex items-center justify-center space-x-3">
                        <div className="text-center">
                          <div
                            className={cn("font-bold text-white", previewDevice === "mobile" ? "text-xs" : "text-xs")}
                          >
                            {community.members.toLocaleString()}
                          </div>
                          <div
                            className={cn("opacity-70 text-white", previewDevice === "mobile" ? "text-xs" : "text-xs")}
                          >
                            Members
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={cn("font-bold text-white", previewDevice === "mobile" ? "text-xs" : "text-xs")}
                          >
                            {community.rating}
                          </div>
                          <div
                            className={cn("opacity-70 text-white", previewDevice === "mobile" ? "text-xs" : "text-xs")}
                          >
                            Rating
                          </div>
                        </div>
                      </div>
                      {/* CTA Button */}
                      <button
                        className={cn(
                          "px-3 py-1 rounded font-semibold transition-all duration-200",
                          previewDevice === "mobile" ? "text-xs" : "text-xs",
                        )}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.2)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.3)",
                        }}
                      >
                        Join Community
                      </button>
                    </div>
                    {/* Template Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${community.settings.primaryColor}20`,
                          color: "white",
                          border: `1px solid ${community.settings.primaryColor}30`,
                        }}
                      >
                        {community.settings.template}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="w-full"
                  style={{
                    borderColor: community.settings.primaryColor,
                    color: community.settings.primaryColor,
                  }}
                >
                  Full Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
