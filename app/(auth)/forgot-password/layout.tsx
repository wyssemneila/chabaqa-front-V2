import type React from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgotPasswordPage")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
  }
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
