// FeatureDetails.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, BookOpen, Target, Users, Calendar, Clock } from "lucide-react"
import Image from "next/image"

interface FeatureDetailsProps {
  feature: {
    type: "community" | "course" | "challenge" | "event" | "oneToOne"
    name: string
  }
}

export function FeatureDetails({ feature }: FeatureDetailsProps) {
  const getDetailsContent = (type: string) => {
    const content = {
      community: {
        title: "What You'll Get",
        items: [
          { icon: Users, text: "Access to exclusive community discussions" },
          { icon: BookOpen, text: "Weekly live Q&A sessions with experts" },
          { icon: Target, text: "Networking opportunities with like-minded members" },
          { icon: CheckCircle, text: "Premium resources and templates" },
        ],
      },
      course: {
        title: "What You'll Learn",
        items: [
          { icon: BookOpen, text: "Comprehensive video lessons and tutorials" },
          { icon: Target, text: "Hands-on projects and assignments" },
          { icon: CheckCircle, text: "Certificate of completion" },
          { icon: Users, text: "Lifetime access to course materials" },
        ],
      },
      challenge: {
        title: "Challenge Details",
        items: [
          { icon: Target, text: "Daily actionable tasks and milestones" },
          { icon: Users, text: "Community support and accountability" },
          { icon: CheckCircle, text: "Progress tracking and feedback" },
          { icon: Calendar, text: "Completion rewards and recognition" },
        ],
      },
      event: {
        title: "Event Highlights",
        items: [
          { icon: Calendar, text: "Live interactive sessions with experts" },
          { icon: Users, text: "Networking with industry professionals" },
          { icon: BookOpen, text: "Exclusive event materials and resources" },
          { icon: CheckCircle, text: "Recording access for registered attendees" },
        ],
      },
      oneToOne: {
        title: "Session Includes",
        items: [
          { icon: Clock, text: "Personalized one-on-one consultation" },
          { icon: Target, text: "Customized strategy and action plan" },
          { icon: BookOpen, text: "Follow-up resources and materials" },
          { icon: CheckCircle, text: "Email support for 7 days after session" },
        ],
      },
    }
    return content[type as keyof typeof content] || content.community
  }

  const details = getDetailsContent(feature.type)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
          {details.title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
          Everything you need to succeed is included in this {feature.type}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {details.items.map((item, index) => {
          const IconComponent = item.icon
          return (
            <Card
              key={index}
              className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-xl"
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                    <IconComponent className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 sm:mt-10 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 items-center">
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              Why Choose This {feature.type.charAt(0).toUpperCase() + feature.type.slice(1)}?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3 sm:mb-4">
              Join thousands of satisfied members who have transformed their skills and achieved their goals. Our proven
              methodology and expert guidance ensure you get the results you're looking for.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Expert-led content</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Proven results</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Community support</span>
              </div>
            </div>
          </div>
          <div className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden shadow-lg border-2 border-white">
            <Image
              src={`/placeholder.svg?height=400&width=600&query=${feature.type} preview content demonstration`}
              alt={`${feature.name} preview`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

