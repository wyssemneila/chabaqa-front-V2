import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LegalDocumentLayout } from "@/app/(landing)/components/legal-document-layout"
import { getTranslations } from "next-intl/server"

const PRIVACY_SECTIONS = [
  {
    id: "scope",
    title: "Scope and Acceptance",
    paragraphs: [
      "This Privacy Policy explains how Chabaqa collects, uses, protects, and discloses personal information when you use our website, applications, and related services.",
      "By creating an account, browsing public pages, purchasing access, or using any feature of Chabaqa, you acknowledge this policy and agree to the data practices described here.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    bullets: [
      "Account information, such as your name, email address, profile details, and authentication credentials.",
      "Community activity and user content, including posts, comments, messages, uploads, and interactions with creators.",
      "Transaction and billing information required to process purchases, subscriptions, payouts, and refunds.",
      "Technical and device information, including IP address, browser type, app version, and diagnostic events.",
      "Usage analytics, such as pages viewed, feature engagement, and session behavior to improve product quality.",
    ],
  },
  {
    id: "how-we-use-data",
    title: "How We Use Personal Data",
    bullets: [
      "Deliver, secure, and improve platform functionality and account access.",
      "Process bookings, purchases, subscriptions, and creator monetization workflows.",
      "Personalize user experience, recommendations, and service communications.",
      "Detect abuse, prevent fraud, enforce policies, and maintain platform integrity.",
      "Comply with legal obligations, respond to lawful requests, and resolve disputes.",
    ],
  },
  {
    id: "legal-basis",
    title: "Legal Basis for Processing",
    paragraphs: [
      "Where applicable, Chabaqa processes personal data on the basis of contractual necessity, legitimate interests, legal obligations, and consent.",
      "When consent is the legal basis, you may withdraw it at any time, without affecting processing that took place before withdrawal.",
    ],
  },
  {
    id: "sharing-disclosure",
    title: "Data Sharing and Disclosure",
    paragraphs: [
      "Chabaqa does not sell personal data. We may share limited data with trusted service providers that help us operate the platform, such as cloud hosting, analytics, payments, communication tools, and security services.",
      "We may also disclose information when required by law, to protect users and platform safety, or as part of a merger, acquisition, or restructuring.",
    ],
  },
  {
    id: "cookies-analytics",
    title: "Cookies, Tracking, and Analytics",
    paragraphs: [
      "We use cookies and similar technologies to keep you signed in, remember preferences, understand product usage, and improve performance.",
      "Analytics tools may collect pseudonymous events and usage metrics only after you explicitly accept analytics cookies through our consent banner or preference center.",
      "You can update your cookie choices at any time by selecting Manage Cookies in the site footer, in addition to browser and device controls.",
    ],
  },
  {
    id: "security-retention",
    title: "Security and Data Retention",
    paragraphs: [
      "We apply administrative, technical, and organizational safeguards designed to protect personal data from unauthorized access, misuse, loss, or disclosure.",
      "We retain information for as long as needed to provide the service, comply with legal and financial obligations, resolve disputes, and enforce agreements. Retention periods vary by data type and purpose.",
    ],
  },
  {
    id: "international-transfers",
    title: "International Data Transfers",
    paragraphs: [
      "Your information may be processed in countries other than your own. When this occurs, Chabaqa applies appropriate safeguards and contractual protections consistent with applicable privacy laws.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights and Choices",
    bullets: [
      "Access, correct, or update profile and account information.",
      "Request deletion of your account and eligible personal data.",
      "Object to or restrict certain processing, where applicable.",
      "Request a portable copy of certain information in a structured format.",
      "Manage communication preferences and optional notifications.",
    ],
  },
  {
    id: "children",
    title: "Children's Privacy",
    paragraphs: [
      "Chabaqa is not intended for children under 13 years old. We do not knowingly collect personal data from children under 13. If you believe such data has been submitted, contact us so we can review and remove it when appropriate.",
    ],
  },
  {
    id: "policy-updates",
    title: "Policy Updates and Contact",
    paragraphs: [
      "We may revise this Privacy Policy to reflect legal, regulatory, or product changes. Material updates will be posted on this page with a revised date.",
      "For privacy requests or questions, contact us at contactchabaqa@gmail.com.",
    ],
  },
] as const

export const metadata: Metadata = {
  title: "Privacy Policy | Chabaqa",
  description:
    "Read Chabaqa's Privacy Policy to understand how we collect, use, protect, and process personal data across our platform.",
  alternates: {
    canonical: "https://chabaqa.io/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Chabaqa",
    description:
      "Learn how Chabaqa handles personal data, platform security, retention, and user privacy rights.",
    url: "https://chabaqa.io/privacy-policy",
    siteName: "Chabaqa",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />
}

async function PrivacyPolicyContent() {
  const t = await getTranslations("landing")
  return (
    <main className="min-h-screen">
      <Header />
      <LegalDocumentLayout
        title={t("privacyPolicy.title")}
        subtitle={t("privacyPolicy.subtitle")}
        effectiveDate={t("privacyPolicy.effectiveDate")}
        lastUpdated={t("privacyPolicy.lastUpdated")}
        contactEmail="contactchabaqa@gmail.com"
        labels={{
          badge: t("legal.badge"),
          effective: t("legal.effective"),
          updated: t("legal.updated"),
          onThisPage: t("legal.onThisPage"),
          relatedDocument: t("legal.relatedDocument"),
        }}
        sections={[...PRIVACY_SECTIONS]}
        relatedLink={{
          href: "/terms-of-service",
          label: t("privacyPolicy.relatedLabel"),
          description: t("privacyPolicy.relatedDescription"),
        }}
      />
      <Footer />
    </main>
  )
}
