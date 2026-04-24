"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { changePassword, deleteAccount, updateProfile, type ChangePasswordPayload, type DeleteAccountPayload } from "@/lib/api/user.api"
import { storageApi } from "@/lib/api/storage.api"
import { useCurrentUser } from "@/lib/hooks/useUser"
import { useAuthContext } from "@/app/providers/auth-provider"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AtSign, Mail as MailIcon, MapPin, Pencil, Save as SaveIcon, TriangleAlert, User as UserIcon } from "lucide-react"
import { getUserProfileHandle } from "@/lib/profile-handle"
import { SOCIAL_PLATFORMS, cleanSocialLinks, type SocialPlatform, type UserSocialLinks } from "@/lib/social-links"
import { SocialBrandIcon } from "@/components/profile/SocialBrandIcon"

function slugFromUser(u: any) {
  return getUserProfileHandle(u)
}

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  youtube: "YouTube",
  tiktok: "TikTok",
  github: "GitHub",
  website: "Website",
}

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const { logout } = useAuthContext()
  const { user, isLoading, mutate } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  // Form fields
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [location, setLocation] = useState("")
  const [bio, setBio] = useState("")
  const [socialLinks, setSocialLinks] = useState<UserSocialLinks>({})
  const [nameTouched, setNameTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [locationTouched, setLocationTouched] = useState(false)
  const [bioTouched, setBioTouched] = useState(false)

  // Profile Picture
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  // Security actions
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState("")
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  // Validation helpers
  const isValidEmail = (v: string) => /.+@.+\..+/.test((v || '').trim())
  const currentVille = (user as any)?.ville || ""
  const currentPays = (user as any)?.pays || ""
  const currentSocialLinks = cleanSocialLinks({
    ...((user as any)?.socialLinks || {}),
    instagram: (user as any)?.socialLinks?.instagram || (user as any)?.lien_instagram || "",
  })
  const socialLinksDirty = JSON.stringify(cleanSocialLinks(socialLinks)) !== JSON.stringify(currentSocialLinks)
  const currentLocation = [currentVille, currentPays].filter(Boolean).join(", ")
  const isDirty = (
    fullName !== (user?.name || "") ||
    email !== (user?.email || "") ||
    bio !== ((user as any)?.bio || "") ||
    location !== currentLocation ||
    socialLinksDirty ||
    (!!uploadedAvatarUrl && uploadedAvatarUrl !== user?.avatar)
  )
  const isValid = (
    (!!fullName || !!user?.name) &&
    (!!email && isValidEmail(email))
  )
  const nameError = !fullName.trim() ? "Full name is required" : ""
  const emailError = !email.trim() ? "Email is required" : (!isValidEmail(email) ? "Enter a valid email address" : "")
  const BIO_MAX = 300
  const hasLocalPassword = (user as any)?.hasLocalPassword !== false
  const isPasswordSameAsCurrent = hasLocalPassword && !!currentPassword && !!newPassword && currentPassword === newPassword
  const isPasswordMismatch = !!confirmNewPassword && newPassword !== confirmNewPassword
  const canSubmitPassword = hasLocalPassword
    ? (
        currentPassword.trim().length >= 8 &&
        newPassword.trim().length >= 8 &&
        confirmNewPassword.trim().length >= 8 &&
        !isPasswordSameAsCurrent &&
        !isPasswordMismatch
      )
    : (
        newPassword.trim().length >= 8 &&
        confirmNewPassword.trim().length >= 8 &&
        !isPasswordMismatch
      )
  const canDeleteAccount = hasLocalPassword
    ? deleteCurrentPassword.trim().length >= 8 && deleteConfirmText.trim() === "DELETE"
    : deleteConfirmText.trim() === "DELETE"

  useEffect(() => {
    // when SWR provides user, prefill
    if (!isLoading) {
      if (!user) {
        router.replace("/signin")
        return
      }
      const expected = slugFromUser(user)
      if (params?.slug && params.slug !== expected) {
        router.replace(`/profile/${expected}/edit`)
        return
      }
      const ua: any = user
      setUsername(ua.username || slugFromUser(ua))
      setFullName(ua.name || "")
      setEmail(ua.email || "")
      const loc = [ua.ville, ua.pays].filter(Boolean).join(", ")
      setLocation(loc)
      setBio(ua.bio || "")
      setSocialLinks(cleanSocialLinks({
        ...(ua.socialLinks || {}),
        instagram: ua?.socialLinks?.instagram || ua?.lien_instagram || "",
      }))
      setLoading(false)
    }
  }, [isLoading, user, params?.slug, router])



  const avatarUrl = uploadedAvatarUrl || user?.avatar || "/placeholder.svg"

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file")
      return
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      const uploaded = await storageApi.upload(file)
      setUploadedAvatarUrl(uploaded.url)
      console.log("Uploaded avatar URL:", uploaded.url) // Debugging
    } catch (err: any) {
      console.error("Upload failed:", err)
      setError(err.message || "Failed to upload image")
    } finally {
      setUploading(false)
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!isDirty || !isValid) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      // Split location into city and country if possible
      const parts = (location || "").split(",")
      const ville = (parts[0] || "").trim() || undefined
      const pays = (parts.slice(1).join(",") || "").trim() || undefined
      const payload: any = {
        name: fullName || undefined,
        email: email || undefined,
        ville,
        pays,

        bio: bio || undefined,
        photo_profil: uploadedAvatarUrl || undefined,
        socialLinks: cleanSocialLinks(socialLinks),
      }
      if (!Object.keys(payload.socialLinks).length) {
        delete payload.socialLinks
      }
      // Prepare optimistic user
      const optimisticUser = {
        ...(user as any),
        name: payload.name ?? user?.name,
        email: payload.email ?? user?.email,
        bio: payload.bio ?? (user as any)?.bio,
        ville: payload.ville ?? (user as any)?.ville,

        pays: payload.pays ?? (user as any)?.pays,
        photo_profil: payload.photo_profil ?? (user as any)?.photo_profil,
        avatar: payload.photo_profil ?? user?.avatar,
        socialLinks: payload.socialLinks,
        lien_instagram: payload.socialLinks?.instagram,
      }
      // Optimistic update with rollback on error
      await mutate(optimisticUser, { revalidate: false })
      await updateProfile(payload)
      await mutate() // revalidate from server
      setSuccess("Profile updated successfully")
      // Revalidate current user cache
      try { await mutate() } catch { }
      const handle = (username || slugFromUser(user)).toLowerCase()
      setTimeout(() => router.replace(`/profile/${handle}`), 700)
    } catch (err: any) {
      // rollback to server value
      try { await mutate() } catch { }
      setError(err?.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmitPassword) {
      if (isPasswordSameAsCurrent) {
        setPasswordError("New password must be different from your current password.")
      } else if (isPasswordMismatch) {
        setPasswordError("Password confirmation does not match.")
      } else {
        setPasswordError("Please provide valid password fields.")
      }
      return
    }

    setPasswordSaving(true)
    setPasswordError("")
    setPasswordSuccess("")
    try {
      const payload: ChangePasswordPayload = hasLocalPassword
        ? { currentPassword: currentPassword.trim(), newPassword: newPassword.trim() }
        : { newPassword: newPassword.trim() }
      const result = await changePassword(payload)
      setPasswordSuccess(result.message || "Password updated successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password.")
    } finally {
      setPasswordSaving(false)
    }
  }

  const onDeleteAccount = async () => {
    if (!canDeleteAccount) {
      setDeleteError(hasLocalPassword
        ? "Type DELETE and provide your current password to continue."
        : "Type DELETE to confirm account deletion.")
      return
    }

    setDeleteLoading(true)
    setDeleteError("")
    try {
      const payload: DeleteAccountPayload = hasLocalPassword
        ? { currentPassword: deleteCurrentPassword.trim(), confirmText: deleteConfirmText.trim() }
        : { confirmText: deleteConfirmText.trim() }
      await deleteAccount(payload)

      await mutate(null, { revalidate: false })
      await logout()
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete account.")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header />
        <main className="flex justify-center pt-16 pb-32 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-40">
          <div className="min-h-[40vh] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main className="flex justify-center pt-16 pb-32 px-4 sm:px-8 md:px-12 lg:px-20 xl:px-40">
        <div className="flex flex-col gap-6 w-full max-w-4xl tracking-normal">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-text-primary">Edit Profile</h1>
            <p className="text-sm text-text-secondary leading-normal">Update your profile information and personal details.</p>
          </div>

          <div className="border border-border-color rounded-xl bg-white shadow-subtle p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
              <div className="relative shrink-0">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 sm:h-28 sm:w-28 relative ring-2 ring-white shadow-md" style={{ backgroundImage: `url(${avatarUrl})` }}>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={handleFileClick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors border-2 border-white disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-tight text-text-primary truncate">{fullName || user?.name}</h2>
                <p className="text-sm text-text-secondary truncate">@{username || "user"}</p>
                <p className="text-sm text-text-secondary mt-3 leading-normal">
                  A clear avatar and short bio help people trust your profile faster.
                </p>
              </div>
            </div>

            <form className="space-y-6" onSubmit={onSubmit} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="username">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      className="w-full rounded-lg border border-border-color pl-10 pr-4 py-2 bg-gray-50 text-gray-600"
                      value={username}
                      readOnly
                      aria-readonly
                      title="Public handle generated from your full name at signup"
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">Read-only handle shown on your public profile.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="fullName">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className={`w-full rounded-lg border pl-10 pr-4 py-2 focus:ring-2 transition ${nameTouched && nameError ? 'border-red-300 focus:ring-red-200' : 'border-border-color focus:ring-primary focus:border-primary'}`}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => setNameTouched(true)}
                      aria-invalid={nameTouched && !!nameError}
                      autoComplete="name"
                      maxLength={80}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  {nameTouched && nameError && (
                    <p className="mt-1 text-xs text-red-600">{nameError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="email">Email Address</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`w-full rounded-lg border pl-10 pr-4 py-2 focus:ring-2 transition ${emailTouched && emailError ? 'border-red-300 focus:ring-red-200' : 'border-border-color focus:ring-primary focus:border-primary'}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailTouched && !!emailError}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {emailTouched && emailError && (
                  <p className="mt-1 text-xs text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="location">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    className="w-full rounded-lg border border-border-color pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => setLocationTouched(true)}
                    autoComplete="address-level2"
                    maxLength={80}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  placeholder="Tell us a little about yourself..."
                  className="w-full rounded-lg border border-border-color p-3 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  onBlur={() => setBioTouched(true)}
                  maxLength={BIO_MAX}
                />
                <div className="mt-1 text-xs text-text-tertiary text-right">{bio.length}/{BIO_MAX}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Social Links</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <div key={platform}>
                      <label className="block text-xs text-text-secondary mb-1.5" htmlFor={`social-${platform}`}>
                        {SOCIAL_LABELS[platform]}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                          <SocialBrandIcon platform={platform} className="w-4 h-4" />
                        </span>
                        <input
                          id={`social-${platform}`}
                          name={`social-${platform}`}
                          type="url"
                          className="w-full rounded-lg border border-border-color pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                          placeholder={`https://${platform === "website" ? "your-site.com" : `${platform}.com/username`}`}
                          value={socialLinks[platform] || ""}
                          onChange={(e) =>
                            setSocialLinks((prev) => ({
                              ...prev,
                              [platform]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
              {success && <div className="text-sm text-green-600">{success}</div>}

              <div className="border-t border-border-color pt-6 flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3">
                <p className="text-xs text-text-tertiary mr-auto">{isDirty ? "You have unsaved changes." : "No pending changes."}</p>
                <button type="button" onClick={() => router.back()} className="flex min-w-[84px] items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white hover:bg-gray-100 transition-colors text-text-secondary text-sm font-bold border border-border-color">Cancel</button>
                <Button type="submit" disabled={saving || !isDirty || !isValid} aria-disabled={saving || !isDirty || !isValid} className={`flex min-w-[84px] items-center justify-center gap-2 rounded-lg h-10 px-4 text-white text-sm font-bold border ${saving || !isDirty || !isValid ? 'bg-[#8e78fb]/60 border-[#7b61f8]/60 cursor-not-allowed' : 'bg-[#8e78fb] hover:bg-[#7b61f8] border-[#7b61f8]'}`}>
                  <SaveIcon className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          <div className="border border-border-color rounded-xl bg-white shadow-subtle p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Security</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {hasLocalPassword
                    ? "Change your password to keep your account secure."
                    : "Set a password to enable email/password login alongside Google."}
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={onPasswordSubmit} noValidate>
              {hasLocalPassword ? (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    className="w-full rounded-lg border border-border-color px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    minLength={8}
                    required
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                  <p className="text-sm text-blue-800">
                    You signed in with Google. Set a password below to also enable email/password login.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    className={`w-full rounded-lg border px-4 py-2 focus:ring-2 transition ${isPasswordSameAsCurrent ? "border-red-300 focus:ring-red-200" : "border-border-color focus:ring-primary focus:border-primary"}`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    className={`w-full rounded-lg border px-4 py-2 focus:ring-2 transition ${isPasswordMismatch ? "border-red-300 focus:ring-red-200" : "border-border-color focus:ring-primary focus:border-primary"}`}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {isPasswordSameAsCurrent && <p className="text-sm text-red-600">New password must be different from current password.</p>}
              {isPasswordMismatch && <p className="text-sm text-red-600">Confirmation password does not match.</p>}
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={passwordSaving || !canSubmitPassword}
                  className={`h-10 px-5 text-white font-semibold ${passwordSaving || !canSubmitPassword ? "bg-[#8e78fb]/60 hover:bg-[#8e78fb]/60" : "bg-[#8e78fb] hover:bg-[#7b61f8]"}`}
                >
                  {passwordSaving ? "Updating..." : (hasLocalPassword ? "Update Password" : "Set Password")}
                </Button>
              </div>
            </form>
          </div>

          <div className="border border-red-200 rounded-xl bg-red-50/40 shadow-subtle p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-700">
                <TriangleAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-800">Danger Zone</h2>
                <p className="text-sm text-red-700 mt-1">
                  Deleting your account permanently removes your profile, communities, and linked data.
                </p>
                <div className="mt-5">
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-10 px-5"
                    onClick={() => {
                      setDeleteError("")
                      setDeleteDialogOpen(true)
                    }}
                    disabled={deleteLoading}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  {hasLocalPassword
                    ? "This action is permanent. Enter your current password and type DELETE to confirm."
                    : "This action is permanent. Type DELETE to confirm."}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4">
                {hasLocalPassword && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="deleteCurrentPassword">Current Password</label>
                    <input
                      id="deleteCurrentPassword"
                      name="deleteCurrentPassword"
                      type="password"
                      className="w-full rounded-lg border border-border-color px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                      value={deleteCurrentPassword}
                      onChange={(e) => setDeleteCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      minLength={8}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5" htmlFor="deleteConfirmText">Type DELETE to confirm</label>
                  <input
                    id="deleteConfirmText"
                    name="deleteConfirmText"
                    type="text"
                    className="w-full rounded-lg border border-border-color px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
                {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={deleteLoading}
                  onClick={() => {
                    setDeleteDialogOpen(false)
                    setDeleteCurrentPassword("")
                    setDeleteConfirmText("")
                    setDeleteError("")
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDeleteAccount}
                  disabled={deleteLoading || !canDeleteAccount}
                >
                  {deleteLoading ? "Deleting..." : "Delete Permanently"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
      <Footer />
    </div>
  )
}
