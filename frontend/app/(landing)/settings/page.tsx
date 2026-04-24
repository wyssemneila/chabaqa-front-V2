"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  CreditCard,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Save,
  Trash2,
  Crown,
  Users,
  Briefcase,
  Palette,
  BarChart,
  FileText,
  Coins,
  Settings,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Download,
} from "lucide-react"
import { Header } from "@/components/header"


export default function SettingsPage() {
  // Mock user type - replace with actual auth
  const [userType, setUserType] = useState<"user" | "creator">("creator") // Change to "user" to see user settings
  
  // Profile states
  const [fullName, setFullName] = useState(userType === "creator" ? "John Smith" : "Jane Doe")
  const [email, setEmail] = useState(userType === "creator" ? "john@example.com" : "jane@example.com")
  const [bio, setBio] = useState(userType === "creator" ? "Fitness coach and wellness expert" : "Fitness enthusiast")
  const [phone, setPhone] = useState("+1 234 567 8900")
  const [location, setLocation] = useState("New York, USA")
  const [website, setWebsite] = useState(userType === "creator" ? "www.johnsmith.com" : "")
  
  // Creator-specific states
  const [businessName, setBusinessName] = useState("Smith Fitness Academy")
  const [businessDescription, setBusinessDescription] = useState("Professional fitness training and wellness coaching")
  const [brandColor, setBrandColor] = useState("#3B82F6")
  const [publicProfile, setPublicProfile] = useState(true)
  
  // Notification states
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [communityUpdates, setCommunityUpdates] = useState(true)
  const [newMessages, setNewMessages] = useState(true)
  const [eventReminders, setEventReminders] = useState(true)
  
  // Privacy states
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState("public")
  const [allowMessages, setAllowMessages] = useState(true)
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  
  // Subscription/Plan states
  const [currentPlan, setCurrentPlan] = useState(userType === "creator" ? "growth" : "free")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const handleSaveProfile = () => {
    // Save profile logic
    alert("Profile saved successfully!")
  }
  
  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    // Change password logic
    alert("Password changed successfully!")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }
  
  const handleDeleteAccount = () => {
    // Delete account logic
    alert("Account deletion requested")
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen bg-gray-50 px-4 py-8">
      
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Manage your account preferences and settings
                </p>
              </div>
              <Badge className={userType === "creator" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}>
                <Crown className="w-3 h-3 mr-1" />
                {userType === "creator" ? "Creator Account" : "User Account"}
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-2">
              <TabsTrigger value="profile" className="text-xs sm:text-sm">
                <User className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">
                <Bell className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="text-xs sm:text-sm">
                <Shield className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs sm:text-sm">
                <Lock className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              {userType === "creator" && (
                <>
                  <TabsTrigger value="branding" className="text-xs sm:text-sm">
                    <Palette className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Branding</span>
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="text-xs sm:text-sm">
                    <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Billing</span>
                  </TabsTrigger>
                </>
              )}
              {userType === "user" && (
                <TabsTrigger value="subscription" className="text-xs sm:text-sm">
                  <Crown className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Plan</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                      {fullName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Brief description for your profile. Max 160 characters.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  {userType === "creator" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="www.yourwebsite.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Your business name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="businessDescription">Business Description</Label>
                        <Textarea
                          id="businessDescription"
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                          placeholder="Describe what your business offers..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Email Notifications</h4>
                        <p className="text-xs text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Push Notifications</h4>
                        <p className="text-xs text-gray-500">Receive push notifications on your device</p>
                      </div>
                      <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Community Updates</h4>
                        <p className="text-xs text-gray-500">Get notified about new posts and activities</p>
                      </div>
                      <Switch checked={communityUpdates} onCheckedChange={setCommunityUpdates} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">New Messages</h4>
                        <p className="text-xs text-gray-500">Get notified when you receive messages</p>
                      </div>
                      <Switch checked={newMessages} onCheckedChange={setNewMessages} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Event Reminders</h4>
                        <p className="text-xs text-gray-500">Reminders for upcoming events</p>
                      </div>
                      <Switch checked={eventReminders} onCheckedChange={setEventReminders} />
                    </div>

                    {userType === "user" && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">Marketing Emails</h4>
                          <p className="text-xs text-gray-500">Receive promotional content and offers</p>
                        </div>
                        <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                      </div>
                    )}

                    {userType === "creator" && (
                      <>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">New Member Alerts</h4>
                            <p className="text-xs text-gray-500">Get notified when someone joins your community</p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">Revenue Updates</h4>
                            <p className="text-xs text-gray-500">Notifications about sales and earnings</p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">Analytics Reports</h4>
                            <p className="text-xs text-gray-500">Weekly analytics summaries</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control who can see your information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility">Profile Visibility</Label>
                    <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="members">Members Only - Community members</SelectItem>
                        <SelectItem value="private">Private - Only you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Show Email Address</h4>
                        <p className="text-xs text-gray-500">Allow others to see your email</p>
                      </div>
                      <Switch checked={showEmail} onCheckedChange={setShowEmail} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Show Phone Number</h4>
                        <p className="text-xs text-gray-500">Allow others to see your phone</p>
                      </div>
                      <Switch checked={showPhone} onCheckedChange={setShowPhone} />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Allow Direct Messages</h4>
                        <p className="text-xs text-gray-500">Let others send you messages</p>
                      </div>
                      <Switch checked={allowMessages} onCheckedChange={setAllowMessages} />
                    </div>

                    {userType === "creator" && (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">Public Creator Profile</h4>
                          <p className="text-xs text-gray-500">Show your profile in search results</p>
                        </div>
                        <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
                        Update Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Enable 2FA</h4>
                        <p className="text-xs text-gray-500">
                          {twoFactorEnabled 
                            ? "Two-factor authentication is enabled" 
                            : "Protect your account with 2FA"}
                        </p>
                      </div>
                      <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions for your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-600 mb-2">Delete Account</h4>
                      <p className="text-xs text-gray-600 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button 
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Creator: Branding Tab */}
            {userType === "creator" && (
              <TabsContent value="branding">
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Customization</CardTitle>
                    <CardDescription>
                      Customize your community's look and feel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="brandColor">Brand Color</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="brandColor"
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <Button variant="outline">
                          Upload Cover Image
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Recommended: 1920x1080px, Max 5MB
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <Button variant="outline">
                          Upload Logo
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Recommended: 512x512px, Max 2MB
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        Save Branding
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Creator: Billing Tab */}
            {userType === "creator" && (
              <TabsContent value="billing">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>Manage your subscription</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <div>
                          <h3 className="text-lg font-semibold capitalize">{currentPlan} Plan</h3>
                          <p className="text-sm text-gray-600">
                            {currentPlan === "starter" && "29 TND/mois - Parfait pour commencer"}
                            {currentPlan === "growth" && "79 TND/mois - Développez votre communauté"}
                            {currentPlan === "pro" && "199 TND/mois - Toutes les fonctionnalités & analytiques"}
                          </p>
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Method</CardTitle>
                      <CardDescription>Manage your payment information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                            VISA
                          </div>
                          <div>
                            <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                            <p className="text-xs text-gray-500">Expires 12/25</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Billing History</CardTitle>
                      <CardDescription>View your past invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { date: "Oct 1, 2024", amount: "79.00 TND", status: "Paid" },
                          { date: "Sep 1, 2024", amount: "79.00 TND", status: "Paid" },
                          { date: "Aug 1, 2024", amount: "79.00 TND", status: "Paid" },
                        ].map((invoice, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{invoice.date}</p>
                              <p className="text-xs text-gray-500">{invoice.amount}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 border-0">
                                {invoice.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* User: Subscription Tab */}
            {userType === "user" && (
              <TabsContent value="subscription">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Memberships</CardTitle>
                      <CardDescription>Communities you're subscribed to</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { name: "Fitness Warriors", plan: "Premium", price: "29 TND/mois", expires: "Nov 15, 2024" },
                          { name: "Tech Innovators", plan: "Basic", price: "9 TND/mois", expires: "Nov 20, 2024" },
                        ].map((sub, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{sub.name}</h4>
                              <p className="text-xs text-gray-500">{sub.plan} - {sub.price}</p>
                              <p className="text-xs text-gray-400">Renews on {sub.expires}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                      <CardDescription>Manage your saved payment methods</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                            VISA
                          </div>
                          <div>
                            <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                            <p className="text-xs text-gray-500">Expires 12/25</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Billing History</CardTitle>
                      <CardDescription>Your payment history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { date: "Oct 15, 2024", description: "Fitness Warriors - Premium", amount: "29.00 TND", status: "Paid" },
                          { date: "Oct 20, 2024", description: "Tech Innovators - Basic", amount: "9.00 TND", status: "Paid" },
                          { date: "Sep 15, 2024", description: "Fitness Warriors - Premium", amount: "29.00 TND", status: "Paid" },
                        ].map((invoice, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{invoice.date}</p>
                              <p className="text-xs text-gray-500">{invoice.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{invoice.amount}</p>
                              <Badge className="bg-green-100 text-green-700 border-0">
                                {invoice.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Delete Account Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Warning</h4>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>All your communities will be permanently deleted</li>
                  <li>All your content and data will be lost</li>
                  <li>Your subscriptions will be cancelled</li>
                  <li>This action cannot be reversed</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmDelete">Type "DELETE" to confirm</Label>
                <Input
                  id="confirmDelete"
                  placeholder="DELETE"
                  className="font-mono"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}