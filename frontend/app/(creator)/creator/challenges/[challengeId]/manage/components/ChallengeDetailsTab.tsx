
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Lock, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
export default function ChallengeDetailsTab({
  challenge,
  formData,
  onInputChange,
  fieldErrors = {},
}: {
  challenge: any
  formData: any
  onInputChange: (field: string, value: any) => void
  fieldErrors?: Record<string, string>
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const totalParticipants = challenge.participants?.length || 0
  const totalRewards = (challenge.completionReward || 0) + (challenge.topPerformerBonus || 0)
  const averageProgress = (challenge.participants || []).reduce((acc: number, p: any) => acc + (p.progress || 0), 0) / totalParticipants || 0

  const handlePickFile = () => fileInputRef.current?.click()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const max = 2 * 1024 * 1024
    if (file.size > max) {
      toast({ title: "File too large", description: "Please upload an image up to 2MB.", variant: "destructive" })
      return
    }

    try {
      setUploading(true)
      const res = await api.storage.upload(file)
      const uploaded = (res as any)?.data || res
      const url = uploaded?.url || uploaded?.data?.url
      if (!url) throw new Error("Upload did not return a URL")
      onInputChange("thumbnail", url)
      toast({ title: "Thumbnail updated", description: file.name })
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Try again later.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your challenge basic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Challenge Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => onInputChange("title", e.target.value)}
                className={fieldErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {fieldErrors.title && <p className="text-sm text-red-500">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => onInputChange("description", e.target.value)}
                className={fieldErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {fieldErrors.description && <p className="text-sm text-red-500">{fieldErrors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  Start Date
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  disabled
                  readOnly
                  className={`${fieldErrors.startDate ? "border-red-500 focus-visible:ring-red-500" : ""} bg-muted cursor-not-allowed`}
                />
                {fieldErrors.startDate && <p className="text-sm text-red-500">{fieldErrors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  End Date
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  disabled
                  readOnly
                  className={`${fieldErrors.endDate ? "border-red-500 focus-visible:ring-red-500" : ""} bg-muted cursor-not-allowed`}
                />
                {fieldErrors.endDate && <p className="text-sm text-red-500">{fieldErrors.endDate}</p>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Start and end dates are locked after challenge creation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => onInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => onInputChange("difficulty", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 30 days"
                  value={formData.duration}
                  onChange={(e) => onInputChange("duration", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maximum Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                placeholder="100"
                value={formData.maxParticipants}
                onChange={(e) => onInputChange("maxParticipants", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Challenge Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Add any notes, tips, or instructions for participants..."
                value={formData.notes}
                onChange={(e) => onInputChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="space-y-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Challenge Thumbnail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {(formData.thumbnail || challenge.thumbnail) ? (
                  <Image
                    src={formData.thumbnail || challenge.thumbnail || "/placeholder.svg"}
                    alt={challenge.title}
                    width={300}
                    height={200}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Upload thumbnail</p>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                type="button"
                onClick={handlePickFile}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Change Thumbnail"}
              </Button>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Participants</span>
              <span className="font-semibold">{totalParticipants}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Daily Tasks</span>
              <span className="font-semibold">{challenge.tasks?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Progress</span>
              <span className="font-semibold">{Math.round(averageProgress)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Rewards</span>
              <span className="font-semibold text-green-600">${totalRewards}</span>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => onInputChange("isActive", checked)}
              />
              <Label htmlFor="active">Challenge is active</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {formData.isActive
                ? "Challenge is live and accepting participants"
                : "Challenge is inactive and not visible to users"}
            </p>
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  )
}
