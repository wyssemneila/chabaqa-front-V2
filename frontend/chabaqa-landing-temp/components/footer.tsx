"use client"

import Link from "next/link"
import { Twitter, Linkedin, Github } from "lucide-react"
import { siteData } from "@/lib/data"

const iconMap = {
  Twitter,
  Linkedin,
  Github,
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-bold text-chabaqa-primary mb-4 block">
              {siteData.brand.name}
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">{siteData.footer.description}</p>
            <div className="flex space-x-4">
              {siteData.footer.social.map((social, index) => {
                const Icon = iconMap[social.icon as keyof typeof iconMap]
                return (
                  <Link
                    key={index}
                    href={social.href}
                    className="text-gray-400 hover:text-chabaqa-primary transition-colors"
                  >
                    <Icon className="w-6 h-6" />
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {siteData.footer.links.product.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {siteData.footer.links.company.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {siteData.footer.links.support.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} {siteData.brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
