import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/app/providers/auth-provider"
import { ExtensionErrorGuard } from "./components/extension-error-guard"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common")
  return {
    title: {
      default: t("brand"),
      template: `%s | ${t("brand")}`,
    },
    description: "Build and monetize your community with courses, sessions, events, and more on Chabaqa.",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style>{`
        /* ── Auth animated blob background ────────────────────────── */
        .auth-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: var(--bg, #fafafe);
          transition: background 0.3s;
        }

        .auth-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.30;
          will-change: transform;
        }
        .dark .auth-blob { opacity: 0.18; }

        /* Purple — top-left */
        .auth-blob-purple {
          width: 580px; height: 580px;
          background: #8e78fb;
          top: -140px; left: -120px;
          animation: authBlob1 9s ease-in-out infinite;
        }
        /* Pink — bottom-right */
        .auth-blob-pink {
          width: 500px; height: 500px;
          background: #f65887;
          bottom: -130px; right: -110px;
          animation: authBlob2 12s ease-in-out infinite;
        }
        /* Blue — top-right */
        .auth-blob-blue {
          width: 420px; height: 420px;
          background: #47c7ea;
          top: 18%; right: -90px;
          animation: authBlob3 10s ease-in-out infinite;
          animation-delay: -3s;
        }
        /* Orange — bottom-left */
        .auth-blob-orange {
          width: 340px; height: 340px;
          background: #ff9b28;
          bottom: 12%; left: -80px;
          animation: authBlob4 14s ease-in-out infinite;
          animation-delay: -6s;
        }

        @keyframes authBlob1 {
          0%,100% { transform: translate(0px,   0px)  scale(1);    }
          33%      { transform: translate(70px,  50px) scale(1.06); }
          66%      { transform: translate(-35px, 35px) scale(0.94); }
        }
        @keyframes authBlob2 {
          0%,100% { transform: translate(0px,   0px)   scale(1);    }
          33%      { transform: translate(-60px,-45px) scale(1.08); }
          66%      { transform: translate(50px,  30px) scale(0.93); }
        }
        @keyframes authBlob3 {
          0%,100% { transform: translate(0px,  0px)  scale(1);    }
          50%      { transform: translate(-85px,65px) scale(1.10); }
        }
        @keyframes authBlob4 {
          0%,100% { transform: translate(0px,   0px)   scale(1);   }
          50%      { transform: translate(65px, -55px) scale(0.90); }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-blob { animation: none !important; }
        }
      `}</style>

      {/* Animated blob background — fixed, behind everything */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-blob auth-blob-purple" />
        <div className="auth-blob auth-blob-pink"   />
        <div className="auth-blob auth-blob-blue"   />
        <div className="auth-blob auth-blob-orange" />
      </div>

      {/* Content — above background */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <AuthProvider>
          <ExtensionErrorGuard />
          {children}
        </AuthProvider>
        <Toaster />
      </div>
    </>
  )
}
