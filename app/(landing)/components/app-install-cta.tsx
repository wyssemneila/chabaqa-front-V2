"use client"

import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"

export function AppInstallCTA() {
  const t = useTranslations("landing.appInstall")

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Container with border */}
        <div className="relative w-full border-4 border-gray-200 rounded-2xl overflow-hidden">
          {/* Desktop Image */}
          <Image
            src="/app-install-banner.png"
            alt={t("bannerAlt")}
            width={1920}
            height={600}
            className="hidden sm:block w-full h-auto"
            priority={false}
          />
          
          {/* Mobile Image */}
          <Image
            src="/banner-mobile.webp"
            alt={t("bannerAlt")}
            width={800}
            height={1000}
            className="block sm:hidden w-full h-auto"
            priority={false}
          />

          {/* Buttons - Centered (middle) on mobile, Bottom Center on desktop */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 sm:top-[75%] sm:bottom-8 sm:left-[30%] lg:bottom-10 z-10 w-full sm:w-auto px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center">
              <Link 
                href="https://expo.dev/accounts/mariembenali/projects/mobile/builds/f85b1b45-f20f-47c7-bb5b-78f3f36ce556"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:opacity-90 rounded-lg overflow-hidden shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Image
                  src="/app store.png"
                  alt={t("downloadAppStore")}
                  width={370}
                  height={111}
                  className="w-auto h-12 sm:h-12 lg:h-14"
                />
              </Link>
              <Link 
                href="https://expo.dev/accounts/mariembenali/projects/mobile/builds/f85b1b45-f20f-47c7-bb5b-78f3f36ce556"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:opacity-90 rounded-lg overflow-hidden shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Image
                  src="/play store.png"
                  alt={t("downloadGooglePlay")}
                  width={370}
                  height={111}
                  className="w-auto h-12 sm:h-12 lg:h-14"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
