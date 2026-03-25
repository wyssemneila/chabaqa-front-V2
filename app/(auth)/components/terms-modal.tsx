"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">TERMS AND CONDITIONS</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Last Updated: 25/01/2026
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">App Name: Chabaqa</p>
              <p className="font-semibold">Support Email: contactchabaqa@gmail.com</p>
            </div>

            <p className="font-medium">
              Welcome to Chabaqa! By accessing or using our application and services, you agree to be bound by these Terms and Conditions.
            </p>

            <div>
              <h3 className="font-bold text-base mb-2">1) Acceptance of Terms</h3>
              <p>
                By creating an account or using Chabaqa, you agree to these Terms and Conditions and our Privacy Policy. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">2) Description of Service</h3>
              <p>
                Chabaqa is a platform that enables creators to build engaged communities, share content, create courses 
                and challenges, and monetize their expertise through various features including:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Community creation and management</li>
                <li>Content sharing (posts, images, videos)</li>
                <li>Course and challenge creation</li>
                <li>1:1 sessions and event bookings</li>
                <li>Messaging and communication features</li>
                <li>Payment processing for services</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">3) User Accounts</h3>
              
              <div className="ml-4 space-y-3">
                <div>
                  <h4 className="font-semibold">A. Account Registration</h4>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>You must be at least 13 years old to use Chabaqa</li>
                    <li>You must provide accurate and complete information</li>
                    <li>You are responsible for maintaining the security of your account</li>
                    <li>You are responsible for all activities under your account</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">B. Account Security</h4>
                  <p>
                    You must keep your password secure and notify us immediately of any unauthorized access to your account.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">4) User Content</h3>
              
              <div className="ml-4 space-y-3">
                <div>
                  <h4 className="font-semibold">A. Your Content</h4>
                  <p>
                    You retain ownership of content you post on Chabaqa. By posting content, you grant us a license to 
                    use, display, and distribute your content on our platform.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">B. Content Standards</h4>
                  <p>You agree not to post content that:</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Is illegal, harmful, threatening, abusive, or harassing</li>
                    <li>Infringes on intellectual property rights</li>
                    <li>Contains viruses or malicious code</li>
                    <li>Is spam or misleading</li>
                    <li>Violates privacy rights of others</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">5) Payments and Refunds</h3>
              
              <div className="ml-4 space-y-3">
                <div>
                  <h4 className="font-semibold">A. Payments</h4>
                  <p>
                    Some features of Chabaqa require payment. You agree to pay all fees associated with your use of 
                    paid features. All payments are processed securely through our payment providers.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">B. Refunds</h4>
                  <p>
                    Refund policies vary by service type. Please contact contactchabaqa@gmail.com for refund requests.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">C. Creator Payouts</h4>
                  <p>
                    Creators are responsible for their own taxes. Chabaqa may deduct applicable platform fees from 
                    creator earnings.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">6) Prohibited Activities</h3>
              <p>You may not:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Impersonate others or provide false information</li>
                <li>Collect user data without permission</li>
                <li>Use automated systems (bots) without authorization</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">7) Intellectual Property</h3>
              <p>
                The Chabaqa platform, including its design, features, and content (excluding user content), is owned by 
                Chabaqa and protected by copyright, trademark, and other laws. You may not copy, modify, or distribute 
                our platform without permission.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">8) Termination</h3>
              
              <div className="ml-4 space-y-2">
                <div>
                  <h4 className="font-semibold">A. By You</h4>
                  <p>You may delete your account at any time through the app settings.</p>
                </div>

                <div>
                  <h4 className="font-semibold">B. By Us</h4>
                  <p>
                    We may suspend or terminate your account if you violate these Terms, for security reasons, or if 
                    required by law. We will provide notice when possible.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">9) Disclaimers</h3>
              <p>
                Chabaqa is provided "as is" without warranties of any kind. We do not guarantee that the service will be 
                uninterrupted, secure, or error-free. We are not responsible for user content or interactions between users.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">10) Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Chabaqa shall not be liable for any indirect, incidental, special, 
                or consequential damages arising from your use of the service.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">11) Changes to Terms</h3>
              <p>
                We may update these Terms and Conditions from time to time. We will notify users of significant changes 
                through the app or via email. Continued use of the service after changes constitutes acceptance of the 
                new terms.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">12) Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall 
                be resolved in accordance with the laws of the jurisdiction where Chabaqa operates.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">13) Contact Information</h3>
              <p>
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <p className="mt-2 font-semibold">Email: contactchabaqa@gmail.com</p>
            </div>

            <div className="border-t pt-4 mt-6">
              <p className="text-xs text-gray-600">
                By using Chabaqa, you acknowledge that you have read, understood, and agree to be bound by these 
                Terms and Conditions and our Privacy Policy.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
