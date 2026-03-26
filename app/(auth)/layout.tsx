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
        }

        .auth-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(110px);
          opacity: 0.38;
          will-change: transform;
        }
        .dark .auth-blob { opacity: 0.22; }

        /* Purple — starts top-left, sweeps toward center-right */
        .auth-blob-purple {
          width: 65vw; height: 65vw;
          max-width: 720px; max-height: 720px;
          background: #8e78fb;
          top: -15%; left: -10%;
          animation: blobMove1 9s ease-in-out infinite alternate;
        }
        /* Pink — starts bottom-right, sweeps toward center-left */
        .auth-blob-pink {
          width: 55vw; height: 55vw;
          max-width: 620px; max-height: 620px;
          background: #f65887;
          bottom: -15%; right: -10%;
          animation: blobMove2 11s ease-in-out infinite alternate;
          animation-delay: -3s;
        }
        /* Blue — starts top-right, sweeps down-left */
        .auth-blob-blue {
          width: 48vw; height: 48vw;
          max-width: 540px; max-height: 540px;
          background: #47c7ea;
          top: 5%; right: -8%;
          animation: blobMove3 13s ease-in-out infinite alternate;
          animation-delay: -5s;
        }
        /* Orange — starts bottom-left, sweeps up-right */
        .auth-blob-orange {
          width: 40vw; height: 40vw;
          max-width: 460px; max-height: 460px;
          background: #ff9b28;
          bottom: 10%; left: -5%;
          animation: blobMove4 10s ease-in-out infinite alternate;
          animation-delay: -7s;
        }

        /* alternate = smoothly travels to destination, then smoothly returns */
        @keyframes blobMove1 {
          from { transform: translate(0,      0);     }
          to   { transform: translate(30vw,  25vh);   }
        }
        @keyframes blobMove2 {
          from { transform: translate(0,      0);     }
          to   { transform: translate(-28vw, -22vh);  }
        }
        @keyframes blobMove3 {
          from { transform: translate(0,      0);     }
          to   { transform: translate(-22vw,  28vh);  }
        }
        @keyframes blobMove4 {
          from { transform: translate(0,      0);     }
          to   { transform: translate(22vw,  -25vh);  }
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
