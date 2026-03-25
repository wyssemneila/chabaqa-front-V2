import { redirect } from "next/navigation"
import { getProfileServer } from "@/lib/auth.server"
import Image from "next/image"
import SignUpForm from "../components/signup-form"
import { getTranslations } from "next-intl/server"
import { ThemeToggle } from "@/components/theme-toggle"
import { LangToggle } from "@/components/lang-toggle"

export const dynamic = "force-dynamic"

export default async function SignUpPage() {
  const t    = await getTranslations("auth.signupPage")
  const user = await getProfileServer()
  if (user) redirect("/")

  return (
    <>
      <style>{`
        @keyframes breathe {
          0%,100% { transform:scale(1);    filter:drop-shadow(0 0   0px rgba(142,120,251,0));   }
          50%      { transform:scale(1.06); filter:drop-shadow(0 6px 24px rgba(142,120,251,.55)); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @media (prefers-reduced-motion:no-preference) {
          .logo-breathe { animation: breathe 3s ease-in-out infinite; }
        }
        .fade-up-1 { animation: fadeUp .5s ease-out .05s both; }
        .fade-up-2 { animation: fadeUp .5s ease-out .15s both; }
        .fade-up-3 { animation: fadeUp .5s ease-out .25s both; }
      `}</style>

      {/* ── Top-right toggles ── */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LangToggle />
        <ThemeToggle />
      </div>

      {/* ── Page background ── */}
      <div
        className="min-h-screen flex items-start justify-center p-4 py-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -5%, rgba(142,120,251,.18) 0%, transparent 70%)," +
            "radial-gradient(ellipse 55% 40% at 95% 95%, rgba(108,82,240,.12) 0%, transparent 70%)," +
            "#fafafe",
        }}
      >
        <div className="w-full max-w-[420px]">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8 fade-up-1">
            <div className="logo-breathe">
              <Image src="/logo_chabaqa.png" alt="Chabaqa" width={190} height={76} priority />
            </div>
            <div
              className="w-10 h-[3px] rounded-full mt-4"
              style={{ background: "linear-gradient(90deg,#8e78fb,#c4b8fd)" }}
            />
          </div>

          {/* Headline */}
          <div className="text-center mb-7 fade-up-2">
            <h1 className="text-[22px] font-black mb-1" style={{ color: "#111827" }}>
              {t("headline")}
            </h1>
            <p className="text-[14px]" style={{ color: "#6b7280" }}>{t("subheadline")}</p>
          </div>

          {/* Form card */}
          <div className="fade-up-3">
            <SignUpForm />
          </div>

          <p className="text-center text-[12px] mt-5 pb-6" style={{ color: "#9ca3af" }}>{t("footer")}</p>
        </div>
      </div>
    </>
  )
}
