"use client"

import { Mail, Phone, Calendar, User as UserIcon, MapPin, Home, Hash, Globe, Instagram, FileText } from "lucide-react"

type Details = {
  email?: string
  numtel?: string
  date_naissance?: string | Date
  sexe?: string
  pays?: string
  ville?: string
  code_postal?: string
  adresse?: string
  bio?: string
  lien_instagram?: string
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium text-gray-900 break-words">{value}</div>
      </div>
    </div>
  )
}

export function ProfileDetails({ details }: { details: Details }) {
  const formattedDate = details.date_naissance
    ? new Date(details.date_naissance).toLocaleDateString()
    : undefined

  const location = [details.ville, details.pays].filter(Boolean).join(", ")
  const addressLine = [details.adresse, details.code_postal].filter(Boolean).join(" ")

  return (
    <div className="border rounded-2xl bg-white/70 backdrop-blur-md p-6">
      <h3 className="text-lg font-semibold mb-4">About</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Row icon={<Mail className="w-4 h-4" />} label="Email" value={details.email} />
        <Row icon={<Phone className="w-4 h-4" />} label="Phone" value={details.numtel} />
        <Row icon={<Calendar className="w-4 h-4" />} label="Birth date" value={formattedDate} />
        <Row icon={<UserIcon className="w-4 h-4" />} label="Gender" value={details.sexe} />
        <Row icon={<MapPin className="w-4 h-4" />} label="Location" value={location || undefined} />
        <Row icon={<Home className="w-4 h-4" />} label="Address" value={addressLine || undefined} />
        <Row icon={<Instagram className="w-4 h-4" />} label="Instagram" value={details.lien_instagram} />
      </div>
      {details.bio && (
        <div className="mt-4 p-4 rounded-xl bg-muted/40">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Bio</span>
          </div>
          <p className="text-sm leading-relaxed">{details.bio}</p>
        </div>
      )}
    </div>
  )
}
