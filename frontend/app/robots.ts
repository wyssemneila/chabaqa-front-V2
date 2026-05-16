import { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/seo-config"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/faq",
          "/blogs",
          "/blogs/",
          "/explore",
          "/community/",
          "/profile/",
          "/terms-of-service",
          "/privacy-policy",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/creator/",
          "/settings/",
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/build-community",
          "/community/*/checkout",
          "/invite/",
          "/invitation/",
          "/payment-success",
          "/ticket/verify/",
          "/konnect-mock-checkout",
          "/private/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
