import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LegalDocumentLayout } from "@/app/(landing)/components/legal-document-layout"
import { getTranslations } from "next-intl/server"

const TERMS_SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    paragraphs: [
      "These Terms of Service govern your access to and use of Chabaqa's website, applications, and related services.",
      "By creating an account, accessing content, or using any part of the platform, you agree to these terms and our Privacy Policy.",
    ],
  },
  {
    id: "eligibility-account",
    title: "Eligibility and Account Responsibilities",
    bullets: [
      "You must be at least 13 years old to use Chabaqa.",
      "You are responsible for the accuracy of account information you provide.",
      "You are responsible for keeping your login credentials secure.",
      "You are responsible for activity that occurs under your account.",
    ],
  },
  {
    id: "platform-services",
    title: "Platform Services",
    paragraphs: [
      "Chabaqa provides tools for communities, courses, challenges, coaching sessions, events, digital products, and creator monetization.",
      "We may update, improve, suspend, or discontinue features to maintain performance, security, and product quality.",
    ],
  },
  {
    id: "content-conduct",
    title: "Content and Conduct Standards",
    bullets: [
      "You retain ownership of your content, but grant Chabaqa a license to host, display, and distribute it within the service.",
      "Do not post illegal, abusive, deceptive, infringing, or harmful content.",
      "Do not upload malware, attempt unauthorized access, or disrupt platform operations.",
      "Do not impersonate others, violate privacy rights, or misuse community and payment features.",
    ],
  },
  {
    id: "payments-billing",
    title: "Payments, Billing, and Refunds",
    paragraphs: [
      "Certain features are paid. By purchasing, you authorize applicable charges and agree to platform fees shown at checkout.",
      "Refund eligibility depends on the product type, creator policy, and applicable law. Requests should be submitted to contactchabaqa@gmail.com.",
      "Creators are responsible for taxes, reporting obligations, and compliance with local regulations tied to their earnings.",
    ],
  },
  {
    id: "ip-rights",
    title: "Intellectual Property",
    paragraphs: [
      "The Chabaqa platform, brand assets, design system, software, and non-user content are protected by intellectual property laws.",
      "You may not copy, reverse engineer, resell, or exploit platform technology without prior written permission.",
    ],
  },
  {
    id: "suspension-termination",
    title: "Suspension and Termination",
    paragraphs: [
      "You may stop using Chabaqa at any time and may request account deletion through available settings or support.",
      "We may suspend or terminate access for policy violations, legal requirements, security risks, abuse, or fraudulent activity.",
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    paragraphs: [
      "Chabaqa is provided on an \"as is\" and \"as available\" basis. We do not guarantee uninterrupted, error-free, or fully secure operation at all times.",
      "User-generated content and third-party services are the responsibility of their respective providers.",
    ],
  },
  {
    id: "limitation-liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by applicable law, Chabaqa is not liable for indirect, incidental, special, consequential, or punitive damages arising from platform use.",
      "Our total liability for claims related to the service is limited to amounts you paid to Chabaqa in the twelve months before the event giving rise to the claim.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law and Disputes",
    paragraphs: [
      "These terms are governed by applicable laws in the jurisdiction where Chabaqa operates, unless mandatory local law requires otherwise.",
      "Parties agree to attempt good-faith resolution before escalating disputes through formal legal channels.",
    ],
  },
  {
    id: "term-updates-contact",
    title: "Updates and Contact Information",
    paragraphs: [
      "We may revise these Terms of Service from time to time. Continued use after updates means you accept the revised terms.",
      "For legal inquiries, policy questions, or support, contact contactchabaqa@gmail.com.",
    ],
  },
] as const

export const metadata: Metadata = {
  title: "Terms of Service | Chabaqa",
  description:
    "Read Chabaqa's Terms of Service covering platform access, account responsibilities, payments, content standards, and legal terms.",
  alternates: {
    canonical: "https://chabaqa.io/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service | Chabaqa",
    description:
      "Understand the terms that govern use of Chabaqa, including accounts, payments, content, and platform policies.",
    url: "https://chabaqa.io/terms-of-service",
    siteName: "Chabaqa",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />
}

async function TermsOfServiceContent() {
  const t = await getTranslations("landing")
  return (
    <main className="min-h-screen">
      <Header />
      <LegalDocumentLayout
        title={t("termsOfService.title")}
        subtitle={t("termsOfService.subtitle")}
        effectiveDate={t("termsOfService.effectiveDate")}
        lastUpdated={t("termsOfService.lastUpdated")}
        contactEmail="contactchabaqa@gmail.com"
        labels={{
          badge: t("legal.badge"),
          effective: t("legal.effective"),
          updated: t("legal.updated"),
          onThisPage: t("legal.onThisPage"),
          relatedDocument: t("legal.relatedDocument"),
        }}
        sections={[...TERMS_SECTIONS]}
        relatedLink={{
          href: "/privacy-policy",
          label: t("termsOfService.relatedLabel"),
          description: t("termsOfService.relatedDescription"),
        }}
      />
      <Footer />
    </main>
  )
}
