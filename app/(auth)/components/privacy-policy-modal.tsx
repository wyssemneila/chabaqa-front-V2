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

interface PrivacyPolicyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">PRIVACY POLICY</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Effective Date: 25/01/2026
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">App Name: Chabaqa</p>
              <p className="font-semibold">Support Email: contactchabaqa@gmail.com</p>
            </div>

            <p>
              This Privacy Policy explains how Chabaqa collects, uses, shares, and protects your 
              information when you use our Android mobile application (the "App") and related 
              services (the "Services").
            </p>

            <p className="font-medium">
              By using Chabaqa, you agree to the practices described in this Privacy Policy.
            </p>

            <div>
              <h3 className="font-bold text-base mb-2">1) Information We Collect</h3>
              
              <div className="ml-4 space-y-3">
                <div>
                  <h4 className="font-semibold">A. Information you provide</h4>
                  <p>When you create an account or use the app, you may provide:</p>
                  <ul className="list-disc ml-6 mt-1 space-y-1">
                    <li><strong>Account information:</strong> name, username, email address, phone number, profile photo, date of birth, country/city (as provided by you).</li>
                    <li><strong>User content:</strong> posts, comments, messages, and any content you upload or share in communities (text, images, videos, files if enabled in the app).</li>
                    <li><strong>Reservations (1:1 sessions / events):</strong> booking details for reservation purposes only (such as selected time/date, session/event reference, and related notes you submit).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">B. Information collected automatically</h4>
                  <p>We may collect:</p>
                  <ul className="list-disc ml-6 mt-1 space-y-1">
                    <li><strong>Device and app information:</strong> device model, operating system version, app version, language, and basic diagnostics.</li>
                    <li><strong>Usage data:</strong> screens viewed, actions taken in the app, and interactions—through Google Analytics (see Section 4).</li>
                    <li><strong>Approximate location:</strong> we do not collect precise GPS location. We may infer approximate location from technical signals such as IP region (when applicable).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">C. Sign-in information</h4>
                  <p>
                    You can sign in using Google Sign-In. When you use Google Sign-In, we receive 
                    information from Google as needed to authenticate you (typically your Google account 
                    identifier and basic profile details depending on your consent and Google settings).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">2) How We Use Your Information</h3>
              <p>We use your information to:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Create and manage your account and provide the Services</li>
                <li>Enable community features (posts, comments, messaging, profiles)</li>
                <li>Provide course, challenge, and event features</li>
                <li>Process and manage reservations (1:1 sessions/events)</li>
                <li>Send important service messages and push notifications (updates, reminders, and activity)</li>
                <li>Improve the app, fix bugs, and understand usage patterns (analytics)</li>
                <li>Maintain security, prevent abuse, and enforce our Terms</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">3) Legal Bases (If Applicable)</h3>
              <p>Depending on your jurisdiction, we process your information based on:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>Performance of a contract (to provide the Services you requested)</li>
                <li>Legitimate interests (security, improving the Services)</li>
                <li>Consent (where required, e.g., marketing communications if introduced later)</li>
                <li>Legal obligations (if we must comply with law enforcement or regulations)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">4) Analytics</h3>
              <p>
                We use Google Analytics to understand how users interact with the app (e.g., feature 
                usage and general engagement). This helps us improve performance and user 
                experience.
              </p>
              <p className="mt-1">
                Google may process data according to its own policies. You can learn more via Google's 
                privacy information (search "Google Analytics privacy" and "Google privacy policy").
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">5) Advertising</h3>
              <p>Chabaqa does not show ads and we do not use third-party advertising SDKs.</p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">6) Sharing of Information</h3>
              <p>We do not sell your personal data.</p>
              <p className="mt-1">We also stated: no sharing with third parties for marketing.</p>
              <p className="mt-1">However, we may share limited information only in these necessary cases:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li><strong>Service providers (processors):</strong> vendors who help us operate the app (e.g., analytics, hosting, notifications). They are permitted to use data only to provide services to us.</li>
                <li><strong>Legal requirements:</strong> if required by law, court order, or to protect rights, safety, and security.</li>
                <li><strong>Business transfers:</strong> if we are involved in a merger, acquisition, or asset sale, user information may be transferred as part of that transaction (with appropriate protections).</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">7) Data Storage and Security</h3>
              <p>
                Your data is stored on infrastructure provided by a third-party hosting provider (Other 
                provider as you indicated).
              </p>
              <p className="mt-1">
                We use reasonable administrative, technical, and organizational safeguards to protect 
                your data. However, no method of transmission or storage is 100% secure.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">8) Data Retention</h3>
              <p>
                We keep your information while your account is active and as needed to provide the 
                Services. We may retain certain information for a limited period after account deletion 
                where necessary for:
              </p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>security and fraud prevention</li>
                <li>legal compliance</li>
                <li>backup and dispute resolution</li>
              </ul>
              <p className="mt-1">After that, we delete or anonymize it where feasible.</p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">9) Your Rights and Choices</h3>
              
              <div className="ml-4 space-y-2">
                <div>
                  <h4 className="font-semibold">A. Account access and updates</h4>
                  <p>You can update certain profile information in the app.</p>
                </div>

                <div>
                  <h4 className="font-semibold">B. Delete your account</h4>
                  <p>You can delete your account inside the app.</p>
                  <p className="mt-1">You can also request deletion by contacting us at contactchabaqa@gmail.com.</p>
                </div>

                <div>
                  <h4 className="font-semibold">C. Notifications</h4>
                  <p>
                    You can control push notifications in your device settings and (if available) inside the 
                    app.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">10) Children's Privacy</h3>
              <p>
                Chabaqa is not intended for children under 13. We do not knowingly collect personal 
                information from children under 13. If you believe a child has provided personal data, 
                contact us at contactchabaqa@gmail.com and we will take appropriate steps to delete it.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">11) International Transfers</h3>
              <p>
                Your information may be processed and stored in countries outside your country of 
                residence depending on our service providers and hosting. We take steps to ensure 
                appropriate protections are in place when required.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">12) Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will update the Effective Date 
                above. If changes are significant, we may provide additional notice within the app.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base mb-2">13) Contact Us</h3>
              <p>If you have questions or requests regarding this Privacy Policy, contact us:</p>
              <p className="mt-1 font-semibold">Email: contactchabaqa@gmail.com</p>
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
