"use client"

import { PageShell } from "@/components/creator-dashboard"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Video,
  Coins,
  BarChart,
  Lock,
  CheckCircle2,
  Clock,
  Bell,
  Rocket,
  Sparkles
} from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  status: "available" | "coming-soon" | "planned"
  popular?: boolean
}

const integrations: Integration[] = [
  {
    id: "1",
    name: "Zapier",
    description: "Automate workflows with 5000+ apps",
    icon: <Zap className="w-8 h-8" />,
    category: "Automation",
    status: "coming-soon",
    popular: true
  },
  {
    id: "2",
    name: "Mailchimp",
    description: "Sync email campaigns and subscribers",
    icon: <Mail className="w-8 h-8" />,
    category: "Email Marketing",
    status: "coming-soon",
    popular: true
  },
  {
    id: "3",
    name: "Google Calendar",
    description: "Sync events and meetings",
    icon: <Calendar className="w-8 h-8" />,
    category: "Calendar",
    status: "planned"
  },
  {
    id: "4",
    name: "Slack",
    description: "Send notifications to your team",
    icon: <MessageSquare className="w-8 h-8" />,
    category: "Communication",
    status: "coming-soon",
    popular: true
  },
  {
    id: "5",
    name: "Google Docs",
    description: "Create and manage documents",
    icon: <FileText className="w-8 h-8" />,
    category: "Documents",
    status: "planned"
  },
  {
    id: "6",
    name: "Zoom",
    description: "Schedule and manage video meetings",
    icon: <Video className="w-8 h-8" />,
    category: "Video Conferencing",
    status: "coming-soon"
  },
  {
    id: "7",
    name: "Stripe",
    description: "Process payments and subscriptions",
    icon: <Coins className="w-8 h-8" />,
    category: "Payments",
    status: "coming-soon",
    popular: true
  },
  {
    id: "8",
    name: "Google Analytics",
    description: "Track and analyze community metrics",
    icon: <BarChart className="w-8 h-8" />,
    category: "Analytics",
    status: "planned"
  }
]

export default function IntegrationsPage() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      console.log("Notify email:", email)
      setTimeout(() => {
        setEmail("")
        setIsSubscribed(false)
      }, 3000)
    }
  }

  return (
    <PageShell className="container mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-chabaqa-primary/10 rounded-full mb-4">
          <Rocket className="w-10 h-10 text-chabaqa-primary" />
        </div>
        <h1 className="text-4xl font-bold">Integrations</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect your favorite tools and automate your community management workflows
        </p>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          Coming Soon
        </Badge>
      </div>

      {/* Features Preview */}
      <Card className="p-8 bg-gradient-to-r from-chabaqa-primary/5 to-purple-50">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-chabaqa-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-chabaqa-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Automated Workflows</h3>
              <p className="text-sm text-gray-600">
                Set up triggers and actions to automate repetitive tasks
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-chabaqa-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-chabaqa-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Secure Connections</h3>
              <p className="text-sm text-gray-600">
                Enterprise-grade security for all your integrations
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-chabaqa-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-chabaqa-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">No-Code Setup</h3>
              <p className="text-sm text-gray-600">
                Easy configuration without technical knowledge
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Available Integrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Available Integrations</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {integrations.filter(i => i.status === "coming-soon").length} Coming Soon
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Clock className="w-3 h-3 mr-1" />
              {integrations.filter(i => i.status === "planned").length} Planned
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((integration) => (
            <Card
              key={integration.id}
              className="p-6 hover:shadow-lg transition-all relative overflow-hidden group"
            >
              {integration.popular && (
                <Badge className="absolute top-3 right-3 bg-chabaqa-primary text-xs">
                  Popular
                </Badge>
              )}
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 group-hover:bg-chabaqa-primary/10 group-hover:text-chabaqa-primary transition-colors">
                  {integration.icon}
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">{integration.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {integration.description}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    {integration.category}
                  </Badge>
                </div>

                <div className="pt-4 border-t">
                  {integration.status === "coming-soon" ? (
                    <Badge variant="outline" className="w-full justify-center bg-green-50 text-green-700 border-green-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Coming Soon
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-full justify-center bg-blue-50 text-blue-700 border-blue-200">
                      <Calendar className="w-3 h-3 mr-1" />
                      Planned
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Notify Me Section */}
      <Card className="p-8 bg-gradient-to-br from-chabaqa-primary to-purple-600 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Bell className="w-12 h-12 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Get Notified When We Launch</h2>
            <p className="text-white/90">
              Be the first to know when integrations go live. We'll send you an email as soon as they're available.
            </p>
          </div>
          
          {!isSubscribed ? (
            <form onSubmit={handleNotifyMe} className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white text-gray-900"
                required
              />
              <Button
                type="submit"
                variant="secondary"
                className="whitespace-nowrap"
              >
                Notify Me
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-center space-x-2 bg-white/20 rounded-lg p-4 max-w-md mx-auto">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">You're on the list! We'll notify you soon.</span>
            </div>
          )}
        </div>
      </Card>

      {/* Request Integration */}
      <Card className="p-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-semibold">Don't See Your Tool?</h2>
          <p className="text-gray-600">
            Let us know which integrations you'd like to see next. We're always listening to our community.
          </p>
          <Button variant="outline" size="lg">
            Request an Integration
          </Button>
        </div>
      </Card>
    </PageShell>
  )
}
