import { redirect } from "next/navigation"
import { getProfileServer } from "@/lib/auth.server"
import Image from "next/image"
import SignUpForm from "../components/signup-form"
import { getTranslations } from "next-intl/server"

export const dynamic = 'force-dynamic'

export default async function SignUpPage() {
  const t = await getTranslations("auth.signupPage")
  const user = await getProfileServer()

  if (user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 gradient-fallback">
        <Image src="/gradient-background.webp" alt="Gradient Background" fill sizes="100vw" className="object-cover" priority />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center">
              <Image
                src="/logo_chabaqa.png"
                alt="Chabaqa Logo"
                width={280}
                height={112}
                sizes="280px"
                className="drop-shadow-lg"
                priority
              />
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-[#8e78fb] to-[#86e4fd] mx-auto rounded-full"></div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8 animate-fade-in-delay-200">
            <p className="text-xl text-gray-700 font-light drop-shadow-sm">{t("headline")}</p>
            <p className="text-sm text-gray-600 mt-2 drop-shadow-sm">{t("subheadline")}</p>
          </div>

          {/* Signup Form */}
          <SignUpForm />

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in-delay-1100">
            <p className="text-xs text-gray-600 drop-shadow-sm">{t("footer")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
