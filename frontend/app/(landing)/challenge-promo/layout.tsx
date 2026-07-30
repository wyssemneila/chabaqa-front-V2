import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Challenges",
  description: "Participate in exciting challenges, compete with others, and earn rewards on Chabaqa.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
