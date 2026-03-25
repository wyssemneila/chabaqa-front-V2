import { redirect } from "next/navigation"
import { getProfileServer } from "@/lib/auth.server"
import Image from "next/image"
import ForgotPasswordForm from "../components/forgot-password-form"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPasswordPage")
  const user = await getProfileServer()

  if (user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 gradient-fallback">
        <Image src="/gradient-background.png" alt={t("backgroundAlt")} fill className="object-cover" priority />
      </div>


      {/* Logo - Top Left */}
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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20 sm:py-24">
        <div className="w-full max-w-lg">
          {/* Forgot Password Form */}
          <ForgotPasswordForm />

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in-delay-1400">
            <p className="text-xs text-gray-600 drop-shadow-sm">{t("footer")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
