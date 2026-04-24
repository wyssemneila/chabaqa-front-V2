"use client"

import { PageShell } from "@/components/creator-dashboard"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Search,
  BookOpen,
  Video,
  FileText,
  MessageCircle,
  Mail,
  Users,
  Trophy,
  Calendar,
  ShoppingBag,
  Bell,
  Settings,
  CreditCard,
  Lock,
  Zap,
  TrendingUp,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  PlayCircle,
  Download,
  Star
} from "lucide-react"

interface HelpArticle {
  id: string
  title: string
  category: string
  description: string
  views: number
  helpful: number
  isPopular?: boolean
}

interface VideoTutorial {
  id: string
  title: string
  duration: string
  thumbnail: string
  category: string
}

const categories = [
  { id: "getting-started", name: "Getting Started", icon: BookOpen, count: 12 },
  { id: "community", name: "Community Management", icon: Users, count: 18 },
  { id: "courses", name: "Courses & Content", icon: Video, count: 15 },
  { id: "challenges", name: "Challenges", icon: Trophy, count: 10 },
  { id: "events", name: "Events", icon: Calendar, count: 8 },
  { id: "products", name: "Products & Payments", icon: ShoppingBag, count: 14 },
  { id: "notifications", name: "Notifications", icon: Bell, count: 7 },
  { id: "analytics", name: "Analytics & Reports", icon: TrendingUp, count: 9 }
]

const popularArticles: HelpArticle[] = [
  {
    id: "1",
    title: "How to create your first community",
    category: "Getting Started",
    description: "Step-by-step guide to setting up and launching your community",
    views: 5420,
    helpful: 489,
    isPopular: true
  },
  {
    id: "2",
    title: "Setting up automated email campaigns",
    category: "Notifications",
    description: "Learn how to create effective email campaigns for member engagement",
    views: 3210,
    helpful: 312,
    isPopular: true
  },
  {
    id: "3",
    title: "Creating engaging course content",
    category: "Courses & Content",
    description: "Best practices for structuring and delivering course materials",
    views: 2890,
    helpful: 267,
    isPopular: true
  },
  {
    id: "4",
    title: "Understanding analytics and metrics",
    category: "Analytics & Reports",
    description: "How to read and use your community analytics effectively",
    views: 2540,
    helpful: 234
  },
  {
    id: "5",
    title: "Setting up payment and subscriptions",
    category: "Products & Payments",
    description: "Configure payment methods and subscription plans",
    views: 2120,
    helpful: 198
  },
  {
    id: "6",
    title: "Running successful challenges",
    category: "Challenges",
    description: "Tips and strategies for creating engaging community challenges",
    views: 1890,
    helpful: 176
  }
]

const videoTutorials: VideoTutorial[] = [
  {
    id: "1",
    title: "Platform Overview - Complete Walkthrough",
    duration: "12:45",
    thumbnail: "overview",
    category: "Getting Started"
  },
  {
    id: "2",
    title: "Creating Your First Course",
    duration: "8:30",
    thumbnail: "course",
    category: "Courses"
  },
  {
    id: "3",
    title: "Setting Up Notifications",
    duration: "6:15",
    thumbnail: "notifications",
    category: "Notifications"
  },
  {
    id: "4",
    title: "Community Engagement Strategies",
    duration: "10:20",
    thumbnail: "engagement",
    category: "Community"
  }
]

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "How do I get started with Chabaqa?",
        a: "Getting started is easy! First, create your creator account, then set up your community profile. You can start by inviting members, creating your first content, and customizing your community settings. Check out our 'Getting Started' guide for detailed steps."
      },
      {
        q: "What's included in the free plan?",
        a: "The free plan includes basic community features, up to 100 members, email notifications, basic analytics, and access to community discussions. You can upgrade anytime to unlock advanced features like courses, challenges, and custom branding."
      },
      {
        q: "Can I migrate my existing community?",
        a: "Yes! We offer migration assistance for communities moving from other platforms. Contact our support team to discuss your specific needs and we'll help you transition smoothly."
      }
    ]
  },
  {
    category: "Community Management",
    questions: [
      {
        q: "How do I moderate my community?",
        a: "As a creator, you have full moderation controls. You can set community guidelines, approve/reject posts, manage member roles, and use automated moderation tools. Access these settings from your Community Settings page."
      },
      {
        q: "Can I have multiple moderators?",
        a: "Yes! You can assign moderator roles to trusted community members. They'll be able to help manage posts, respond to member queries, and maintain community standards."
      },
      {
        q: "How do I handle inactive members?",
        a: "Use our automated re-engagement notifications to reach out to inactive members. You can also create targeted campaigns based on inactivity periods (7, 15, 30 days) to encourage members to return."
      }
    ]
  },
  {
    category: "Content & Courses",
    questions: [
      {
        q: "What file formats are supported for courses?",
        a: "We support video (MP4, MOV), audio (MP3, WAV), documents (PDF, DOCX), and images (JPG, PNG, GIF). Maximum file size is 500MB per file."
      },
      {
        q: "Can I drip-release course content?",
        a: "Yes! You can schedule content to be released over time. Set specific dates or release content based on member enrollment dates for a structured learning experience."
      },
      {
        q: "How do I track student progress?",
        a: "Access detailed progress reports from your Course Analytics dashboard. You can see completion rates, quiz scores, time spent, and individual student progress."
      }
    ]
  },
  {
    category: "Payments & Subscriptions",
    questions: [
      {
        q: "What payment methods do you support?",
        a: "We support all major credit cards, debit cards, and digital wallets through Stripe. You can also set up bank transfers for certain regions."
      },
      {
        q: "When do I receive payouts?",
        a: "Payouts are processed weekly. Funds are typically available in your bank account 2-5 business days after processing, depending on your bank."
      },
      {
        q: "What are the platform fees?",
        a: "Our platform fee is 5% of transaction value, plus standard payment processing fees. The free plan has higher fees (10%), while Pro and Enterprise plans get reduced rates. Check our pricing page for detailed information."
      }
    ]
  },
  {
    category: "Notifications",
    questions: [
      {
        q: "How many notification types can I create?",
        a: "There's no limit! Create as many notification rules as you need for different scenarios - welcome messages, course updates, event reminders, challenge notifications, and more."
      },
      {
        q: "Can I customize notification timing?",
        a: "Yes! You can set notifications to trigger immediately, schedule them for specific times, or set up conditional triggers based on user actions (e.g., 24 hours before an event, after course completion)."
      },
      {
        q: "What's the difference between in-app and email notifications?",
        a: "In-app notifications appear within the platform when members log in. Email notifications are sent directly to members' inboxes. We recommend using both channels for important updates."
      }
    ]
  }
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredArticles = popularArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || article.category.toLowerCase().includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <PageShell className="container mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-chabaqa-primary/10 rounded-full mb-4">
          <HelpCircle className="w-8 h-8 text-chabaqa-primary" />
        </div>
        <h1 className="text-4xl font-bold">How can we help you?</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find answers, tutorials, and guides to help you succeed with your community
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search for help articles, guides, and tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg"
          />
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-chabaqa-primary">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Video Tutorials</h3>
              <p className="text-sm text-gray-600 mb-3">Watch step-by-step guides</p>
              <Button variant="link" className="p-0 h-auto text-chabaqa-primary">
                Browse Videos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-chabaqa-primary">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Live Chat Support</h3>
              <p className="text-sm text-gray-600 mb-3">Get instant help from our team</p>
              <Button variant="link" className="p-0 h-auto text-chabaqa-primary">
                Start Chat <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-chabaqa-primary">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email Support</h3>
              <p className="text-sm text-gray-600 mb-3">Send us a detailed message</p>
              <Button variant="link" className="p-0 h-auto text-chabaqa-primary">
                Contact Us <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="articles">
            <FileText className="w-4 h-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="w-4 h-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="faqs">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Download className="w-4 h-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              className={selectedCategory === "all" ? "bg-chabaqa-primary" : ""}
              onClick={() => setSelectedCategory("all")}
            >
              All Topics
            </Button>
            {categories.slice(0, 7).map((cat) => {
              const Icon = cat.icon
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className={selectedCategory === cat.id ? "bg-chabaqa-primary" : ""}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.name}
                </Button>
              )
            })}
          </div>

          {/* Popular Articles */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
            <div className="grid gap-4">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{article.title}</h3>
                        {article.isPopular && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{article.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <Badge variant="outline">{article.category}</Badge>
                        <span>{article.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{article.helpful} found helpful</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Browse by Category */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-chabaqa-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-chabaqa-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-xs text-gray-500">{category.count} articles</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Video Tutorials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoTutorials.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-chabaqa-primary/20 to-purple-100 flex items-center justify-center relative">
                    <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                    <Badge className="absolute bottom-3 right-3 bg-black/70 text-white">
                      {video.duration}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{video.title}</h3>
                    <Badge variant="outline">{video.category}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            {faqs.map((section, idx) => (
              <Card key={idx} className="p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4 text-chabaqa-primary">{section.category}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((item, qIdx) => (
                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Creator's Handbook</h3>
                  <p className="text-sm text-gray-600 mb-3">Complete guide to building and growing your community</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Best Practices Guide</h3>
                  <p className="text-sm text-gray-600 mb-3">Proven strategies for community engagement</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Content Creation Templates</h3>
                  <p className="text-sm text-gray-600 mb-3">Ready-to-use templates for courses and posts</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download ZIP
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Growth Playbook</h3>
                  <p className="text-sm text-gray-600 mb-3">Strategies to grow and monetize your community</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Still Need Help */}
      <Card className="p-8 bg-gradient-to-br from-chabaqa-primary to-purple-600 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <MessageCircle className="w-12 h-12 mx-auto" />
          <h2 className="text-2xl font-bold">Still need help?</h2>
          <p className="text-white/90">
            Our support team is here to help you succeed. Get in touch and we'll respond within 24 hours.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" size="lg">
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Live Chat
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
          </div>
        </div>
      </Card>
    </PageShell>
  )
}
