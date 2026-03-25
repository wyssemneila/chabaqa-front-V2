"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import {
  adminApi,
  type AdminAlertConfig,
  type AdminAlertMetricType,
  type AdminPreferences,
} from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, User, Bell, Settings as SettingsIcon, AlertTriangle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const profileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const currentPassword = data.currentPassword?.trim() || ""
    const newPassword = data.newPassword?.trim() || ""
    const confirmPassword = data.confirmPassword?.trim() || ""

    if (newPassword.length > 0 && newPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters",
        path: ["newPassword"],
      })
    }

    if (newPassword.length > 0 && currentPassword.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required",
        path: ["currentPassword"],
      })
    }

    if (newPassword.length > 0 && confirmPassword !== newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    }
  })

const alertConfigSchema = z.object({
  pendingContentThreshold: z.number().min(1).max(1000),
  flaggedContentThreshold: z.number().min(1).max(1000),
  pendingCommunitiesThreshold: z.number().min(1).max(100),
  failedLoginsThreshold: z.number().min(1).max(100),
  highValueTransactionThreshold: z.number().min(100),
})

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  locale: z.string().min(2, "Locale is required"),
  timezone: z.string().min(2, "Timezone is required"),
  emailNotifications: z.boolean(),
})

type ProfileFormData = z.infer<typeof profileSchema>
type AlertConfigFormData = z.infer<typeof alertConfigSchema>
type PreferencesFormData = z.infer<typeof preferencesSchema>

type AlertField = keyof AlertConfigFormData

interface AdminProfile {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
  twoFactorEnabled?: boolean
}

const DEFAULT_ALERTS: AlertConfigFormData = {
  pendingContentThreshold: 50,
  flaggedContentThreshold: 20,
  pendingCommunitiesThreshold: 10,
  failedLoginsThreshold: 5,
  highValueTransactionThreshold: 10000,
}

const DEFAULT_PREFERENCES: PreferencesFormData = {
  theme: "system",
  locale: "en",
  timezone: "UTC",
  emailNotifications: true,
}

const ALERT_DEFINITIONS: Array<{
  metricType: AdminAlertMetricType
  field: AlertField
  name: string
  description: string
}> = [
  {
    metricType: "pending_content",
    field: "pendingContentThreshold",
    name: "High Pending Content",
    description: "Triggers when pending moderation items exceed threshold",
  },
  {
    metricType: "flagged_content",
    field: "flaggedContentThreshold",
    name: "High Flagged Content",
    description: "Triggers when flagged moderation items exceed threshold",
  },
  {
    metricType: "pending_communities",
    field: "pendingCommunitiesThreshold",
    name: "Pending Community Approvals",
    description: "Triggers when pending community approvals exceed threshold",
  },
  {
    metricType: "failed_logins",
    field: "failedLoginsThreshold",
    name: "Failed Login Attempts",
    description: "Triggers when failed login attempts exceed threshold",
  },
  {
    metricType: "high_value_transaction",
    field: "highValueTransactionThreshold",
    name: "High Value Transaction",
    description: "Triggers when a high value transaction is detected",
  },
]

function extractPayload<T>(response: { data?: T } | T): T {
  if (response && typeof response === "object" && "data" in response && response.data !== undefined) {
    return response.data
  }
  return response as T
}

function normalizeAlertId(alert: Partial<AdminAlertConfig> & { _id?: string }): string {
  return String(alert.id || alert._id || "")
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function AdminSettingsPage() {
  const { admin, isAuthenticated, loading: authLoading, syncSession } = useAdminAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [alertsSaving, setAlertsSaving] = useState(false)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [existingAlerts, setExistingAlerts] = useState<Map<AdminAlertMetricType, AdminAlertConfig>>(new Map())

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const alertForm = useForm<AlertConfigFormData>({
    resolver: zodResolver(alertConfigSchema),
    defaultValues: DEFAULT_ALERTS,
  })

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: DEFAULT_PREFERENCES,
  })

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const [sessionRes, alertsRes, preferencesRes] = await Promise.all([
        adminApi.auth.me(),
        adminApi.analytics.getAlerts(),
        adminApi.settings.getPreferences(),
      ])

      const session = extractPayload(sessionRes)
      const sessionAdmin = session?.admin || admin

      if (sessionAdmin) {
        const nextProfile: AdminProfile = {
          _id: String(sessionAdmin._id),
          name: String(sessionAdmin.name || ""),
          email: String(sessionAdmin.email || ""),
          role: String(sessionAdmin.role || "admin"),
          createdAt: String(sessionAdmin.createdAt || new Date().toISOString()),
          twoFactorEnabled: Boolean(sessionAdmin.twoFactorEnabled),
        }

        setProfile(nextProfile)
        profileForm.reset({
          name: nextProfile.name,
          email: nextProfile.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }

      const alertList = extractPayload(alertsRes) || []
      const alertMap = new Map<AdminAlertMetricType, AdminAlertConfig>()
      for (const alert of alertList) {
        alertMap.set(alert.metricType, alert)
      }
      setExistingAlerts(alertMap)

      const alertValues: AlertConfigFormData = {
        ...DEFAULT_ALERTS,
        pendingContentThreshold: alertMap.get("pending_content")?.threshold ?? DEFAULT_ALERTS.pendingContentThreshold,
        flaggedContentThreshold: alertMap.get("flagged_content")?.threshold ?? DEFAULT_ALERTS.flaggedContentThreshold,
        pendingCommunitiesThreshold:
          alertMap.get("pending_communities")?.threshold ?? DEFAULT_ALERTS.pendingCommunitiesThreshold,
        failedLoginsThreshold: alertMap.get("failed_logins")?.threshold ?? DEFAULT_ALERTS.failedLoginsThreshold,
        highValueTransactionThreshold:
          alertMap.get("high_value_transaction")?.threshold ?? DEFAULT_ALERTS.highValueTransactionThreshold,
      }
      alertForm.reset(alertValues)

      const preferences = extractPayload<AdminPreferences>(preferencesRes)
      preferencesForm.reset({
        theme: preferences.theme || "system",
        locale: preferences.locale || "en",
        timezone: preferences.timezone || "UTC",
        emailNotifications: Boolean(preferences.emailNotifications),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load settings"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [admin, alertForm, preferencesForm, profileForm, toast])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
      return
    }

    if (isAuthenticated) {
      void fetchSettings()
    }
  }, [authLoading, fetchSettings, isAuthenticated, router])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileSaving(true)
    try {
      const hasPasswordUpdate = Boolean(data.newPassword?.trim())

      const profileRes = await adminApi.settings.updateProfile({
        name: data.name,
        email: data.email,
      })

      if (hasPasswordUpdate) {
        await adminApi.settings.changePassword({
          currentPassword: data.currentPassword?.trim() || "",
          newPassword: data.newPassword?.trim() || "",
        })
      }

      const session = extractPayload(profileRes)
      if (session?.admin) {
        setProfile({
          _id: String(session.admin._id),
          name: String(session.admin.name || data.name),
          email: String(session.admin.email || data.email),
          role: String(session.admin.role || profile?.role || "admin"),
          createdAt: String(session.admin.createdAt || profile?.createdAt || new Date().toISOString()),
          twoFactorEnabled: Boolean(session.admin.twoFactorEnabled),
        })
      }

      await syncSession()

      profileForm.reset({
        name: data.name,
        email: data.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Success",
        description: hasPasswordUpdate
          ? "Profile and password updated successfully"
          : "Profile updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update profile settings"),
        variant: "destructive",
      })
    } finally {
      setProfileSaving(false)
    }
  }

  const onAlertConfigSubmit = async (data: AlertConfigFormData) => {
    setAlertsSaving(true)
    try {
      for (const definition of ALERT_DEFINITIONS) {
        const existing = existingAlerts.get(definition.metricType)
        const payload = {
          name: definition.name,
          description: definition.description,
          metricType: definition.metricType,
          condition: "greater_than" as const,
          threshold: data[definition.field],
          severity: "warning" as const,
          notifyAdmins: [],
          notifyEmails: [],
        }

        if (existing) {
          await adminApi.analytics.updateAlert(normalizeAlertId(existing), {
            name: payload.name,
            description: payload.description,
            threshold: payload.threshold,
            severity: payload.severity,
            isEnabled: true,
            notifyAdmins: payload.notifyAdmins,
            notifyEmails: payload.notifyEmails,
          })
        } else {
          await adminApi.analytics.createAlert(payload)
        }
      }

      await fetchSettings()

      toast({
        title: "Success",
        description: "Alert configuration saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save alert configuration"),
        variant: "destructive",
      })
    } finally {
      setAlertsSaving(false)
    }
  }

  const onPreferencesSubmit = async (data: PreferencesFormData) => {
    setPreferencesSaving(true)
    try {
      const res = await adminApi.settings.updatePreferences(data)
      const saved = extractPayload<AdminPreferences>(res)

      preferencesForm.reset({
        theme: saved.theme || data.theme,
        locale: saved.locale || data.locale,
        timezone: saved.timezone || data.timezone,
        emailNotifications: Boolean(saved.emailNotifications),
      })

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save preferences"),
        variant: "destructive",
      })
    } finally {
      setPreferencesSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your admin profile and configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Configuration
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Platform Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Update your personal information and password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Profile Information</h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" {...profileForm.register("name")} placeholder="Enter your name" />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-red-600">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...profileForm.register("email")} placeholder="Enter your email" />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {profile && (
                    <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Role</Label>
                        <p className="mt-1 text-sm font-medium">{profile.role}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Member Since</Label>
                        <p className="mt-1 text-sm font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">Leave blank if you do not want to change your password</p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...profileForm.register("currentPassword")}
                        placeholder="Enter current password"
                      />
                      {profileForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-600">{profileForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...profileForm.register("newPassword")}
                          placeholder="Enter new password"
                        />
                        {profileForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.newPassword.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...profileForm.register("confirmPassword")}
                          placeholder="Confirm new password"
                        />
                        {profileForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600">{profileForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Configure thresholds for automated admin alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={alertForm.handleSubmit(onAlertConfigSubmit)} className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Threshold changes are persisted through analytics alert definitions and reloaded on page refresh.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Content Moderation</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pendingContentThreshold">Pending Content Threshold</Label>
                        <Input
                          id="pendingContentThreshold"
                          type="number"
                          {...alertForm.register("pendingContentThreshold", { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="flaggedContentThreshold">Flagged Content Threshold</Label>
                        <Input
                          id="flaggedContentThreshold"
                          type="number"
                          {...alertForm.register("flaggedContentThreshold", { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-medium">Community Management</h3>
                    <div className="space-y-2">
                      <Label htmlFor="pendingCommunitiesThreshold">Pending Communities Threshold</Label>
                      <Input
                        id="pendingCommunitiesThreshold"
                        type="number"
                        className="max-w-md"
                        {...alertForm.register("pendingCommunitiesThreshold", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-medium">Security</h3>
                    <div className="space-y-2">
                      <Label htmlFor="failedLoginsThreshold">Failed Login Attempts Threshold</Label>
                      <Input
                        id="failedLoginsThreshold"
                        type="number"
                        className="max-w-md"
                        {...alertForm.register("failedLoginsThreshold", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-medium">Financial</h3>
                    <div className="space-y-2">
                      <Label htmlFor="highValueTransactionThreshold">High Value Transaction Threshold (TND)</Label>
                      <Input
                        id="highValueTransactionThreshold"
                        type="number"
                        className="max-w-md"
                        {...alertForm.register("highValueTransactionThreshold", { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={alertsSaving}>
                    {alertsSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Manage your personal admin preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <select
                      id="theme"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...preferencesForm.register("theme")}
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locale">Locale</Label>
                    <Input id="locale" placeholder="en" {...preferencesForm.register("locale")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" placeholder="UTC" {...preferencesForm.register("timezone")} />
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <input
                      id="emailNotifications"
                      type="checkbox"
                      className="h-4 w-4"
                      {...preferencesForm.register("emailNotifications")}
                    />
                    <Label htmlFor="emailNotifications">Enable email notifications</Label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={preferencesSaving}>
                    {preferencesSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
