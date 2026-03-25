import { redirect } from "next/navigation"
import Image from "next/image"
import { getProfileServer } from "@/lib/auth.server"
import VerifyEmailForm from "../components/verify-email-form"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'

interface VerifyEmailPageProps {
  searchParams: Promise<{
    email?: string
    inviteToken?: string
  }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const t = await getTranslations("auth.verifyEmailPage")
  const user = await getProfileServer()

  if (user) {
    redirect("/")
  }

  const params = await searchParams
  const email = params.email || ""
  const inviteToken = params.inviteToken || ""

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 gradient-fallback">
        <Image src="/gradient-background.png" alt={t("backgroundAlt")} fill className="object-cover" priority />
      </div>

      <div className="absolute top-8 left-8 z-20 animate-fade-in">
        <Image
          src="/logo_chabaqa.png"
          alt={t("logoAlt")}
          width={140}
          height={56}
          className="drop-shadow-lg"
          priority
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20 sm:py-24">
        <div className="w-full max-w-lg">
          <VerifyEmailForm email={email} inviteToken={inviteToken} />

          <div className="text-center mt-8 animate-fade-in-delay-1400">
            <p className="text-xs text-gray-600 drop-shadow-sm">{t("footer")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
