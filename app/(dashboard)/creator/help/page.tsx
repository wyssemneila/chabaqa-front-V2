'use client'

import { useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  Search, PlayCircle, MessageSquare, Mail, BookOpen,
  Video, HelpCircle, FileText, ChevronDown, ChevronUp,
  ExternalLink, Download, Clock, Tag, ArrowRight, Zap,
  CheckCircle, Users, Globe, Shield,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'articles' | 'videos' | 'faqs' | 'resources'

// ─── Data ─────────────────────────────────────────────────────────────────────

const ARTICLES = [
  { id: 1,  category: 'Getting Started', title: 'Getting started with Chabaqa',                          readTime: 4,  featured: true  },
  { id: 2,  category: 'Getting Started', title: 'How to create your first community',                    readTime: 6,  featured: true  },
  { id: 3,  category: 'Courses',         title: 'Creating and structuring a course',                     readTime: 8,  featured: false },
  { id: 4,  category: 'Courses',         title: 'Managing course enrollments and access',                readTime: 5,  featured: false },
  { id: 5,  category: 'Revenue',         title: 'Understanding your payouts and revenue',                readTime: 7,  featured: false },
  { id: 6,  category: 'Revenue',         title: 'Setting up subscription plans',                        readTime: 6,  featured: false },
  { id: 7,  category: 'Marketing',       title: 'How to run an email campaign',                         readTime: 5,  featured: false },
  { id: 8,  category: 'Marketing',       title: 'Setting up affiliate links for your community',        readTime: 9,  featured: false },
  { id: 9,  category: 'Analytics',       title: 'Reading your analytics dashboard',                     readTime: 6,  featured: false },
  { id: 10, category: 'Settings',        title: 'Managing team roles and permissions',                  readTime: 4,  featured: false },
  { id: 11, category: 'Settings',        title: 'Integrating third-party tools with Chabaqa',           readTime: 7,  featured: false },
  { id: 12, category: 'Challenges',      title: 'Creating challenges that drive engagement',            readTime: 5,  featured: false },
]

const VIDEOS = [
  { id: 1,  title: 'Complete Platform Walkthrough',        duration: '12:30', views: '4.2k', category: 'Getting Started', featured: true  },
  { id: 2,  title: 'Creating Your First Course',           duration: '8:45',  views: '3.1k', category: 'Courses',         featured: true  },
  { id: 3,  title: 'Setting Up Your Community',           duration: '6:20',  views: '2.8k', category: 'Communities',     featured: false },
  { id: 4,  title: 'Analytics Deep Dive',                  duration: '10:15', views: '1.9k', category: 'Analytics',       featured: false },
  { id: 5,  title: 'Email Marketing Best Practices',       duration: '7:30',  views: '1.5k', category: 'Marketing',       featured: false },
  { id: 6,  title: 'Revenue & Payout Setup',               duration: '5:50',  views: '2.2k', category: 'Revenue',         featured: false },
  { id: 7,  title: 'Managing Challenges & Events',         duration: '9:00',  views: '1.1k', category: 'Content',         featured: false },
  { id: 8,  title: 'WhatsApp Campaign Tutorial',           duration: '6:45',  views: '980',  category: 'Marketing',       featured: false },
]

const FAQS = [
  {
    id: 1, category: 'Billing',
    q: 'When do I receive my payouts?',
    a: 'Payouts are processed every 15 days. Funds are transferred to your connected bank account or Stripe within 2–5 business days after processing.',
  },
  {
    id: 2, category: 'Courses',
    q: 'How many students can enroll in my course?',
    a: 'There is no limit on the number of students that can enroll in a course. Chabaqa scales automatically to handle any volume of enrollments.',
  },
  {
    id: 3, category: 'Communities',
    q: 'Can I have multiple communities on one account?',
    a: 'Yes. You can create and manage multiple communities from a single creator account. Each community has its own members, content, and analytics.',
  },
  {
    id: 4, category: 'Billing',
    q: 'What payment methods do subscribers use?',
    a: 'Subscribers can pay using credit/debit cards (Visa, Mastercard), bank transfers (for Tunisian banks), and mobile payment integrations. More methods are being added.',
  },
  {
    id: 5, category: 'Settings',
    q: 'How do I add a team member to my account?',
    a: 'Go to Settings → Team & Roles. Click "Invite Member", enter their email, and assign a role (Admin, Moderator, or Analyst). They will receive an invitation email.',
  },
  {
    id: 6, category: 'Marketing',
    q: 'What is the open rate for email campaigns?',
    a: 'Average open rates vary by community niche, but Chabaqa creators typically see 28–45% open rates. Using personalization tokens and sending at optimal times can improve this.',
  },
  {
    id: 7, category: 'Content',
    q: 'What video formats are supported for courses?',
    a: 'We support MP4, MOV, AVI, and MKV files. Maximum file size per video is 2 GB. We recommend MP4 with H.264 encoding for best quality and loading speed.',
  },
  {
    id: 8, category: 'Communities',
    q: 'Can members access content from multiple communities?',
    a: 'Yes. A member can join multiple communities. Each community has its own subscription, so members pay separately unless you create a bundle offer.',
  },
]

const RESOURCES = [
  { id: 1,  title: 'Creator Starter Kit',            type: 'PDF',      size: '2.4 MB',  category: 'Getting Started', icon: FileText   },
  { id: 2,  title: 'Course Curriculum Template',     type: 'DOCX',     size: '340 KB',  category: 'Courses',         icon: FileText   },
  { id: 3,  title: 'Community Growth Playbook',      type: 'PDF',      size: '3.1 MB',  category: 'Communities',     icon: FileText   },
  { id: 4,  title: 'Email Templates Pack (10)',       type: 'ZIP',      size: '180 KB',  category: 'Marketing',       icon: Mail       },
  { id: 5,  title: 'Analytics Metrics Glossary',     type: 'PDF',      size: '890 KB',  category: 'Analytics',       icon: FileText   },
  { id: 6,  title: 'Chabaqa API Documentation',      type: 'Link',     size: null,      category: 'Integrations',    icon: Globe      },
  { id: 7,  title: 'Branding & Logo Assets',          type: 'ZIP',      size: '4.8 MB',  category: 'Branding',        icon: Download   },
  { id: 8,  title: 'Affiliate Program Guide',         type: 'PDF',      size: '1.2 MB',  category: 'Marketing',       icon: Users      },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Getting Started': '#7c3aed', 'Courses': '#0891b2', 'Revenue': '#16a34a',
  'Marketing': '#ea580c', 'Analytics': '#6366f1', 'Settings': '#64748b',
  'Communities': '#db2777', 'Challenges': '#d97706', 'Billing': '#16a34a',
  'Content': '#0891b2', 'Integrations': '#6366f1', 'Branding': '#7c3aed',
}

// ─── Search filter helper ─────────────────────────────────────────────────────

function filterByQuery<T extends { title: string; category: string }>(items: T[], q: string) {
  if (!q.trim()) return items
  const lq = q.toLowerCase()
  return items.filter(i => i.title.toLowerCase().includes(lq) || i.category.toLowerCase().includes(lq))
}

function filterFaqs(items: typeof FAQS, q: string) {
  if (!q.trim()) return items
  const lq = q.toLowerCase()
  return items.filter(i => i.q.toLowerCase().includes(lq) || i.a.toLowerCase().includes(lq) || i.category.toLowerCase().includes(lq))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'var(--p)'
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: color + '18', color }}>
      {category}
    </span>
  )
}

function ArticleCard({ article }: { article: typeof ARTICLES[number] }) {
  return (
    <div className="group flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-sm"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--p2)' }}>
        <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-snug mb-1.5 group-hover:text-[var(--p)] transition-colors"
          style={{ color: 'var(--t1)' }}>
          {article.title}
        </p>
        <div className="flex items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
            <Clock className="w-3 h-3" strokeWidth={1.7} />
            {article.readTime} min read
          </span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
    </div>
  )
}

function VideoCard({ video }: { video: typeof VIDEOS[number] }) {
  return (
    <div className="group rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)' }}>
      {/* Thumbnail — 16:9 (YouTube/1920×1080) */}
      <div className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, var(--p2) 0%, var(--bg) 100%)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ background: 'var(--p)', boxShadow: '0 4px 16px rgba(124,58,237,.3)' }}>
          <PlayCircle className="w-6 h-6 text-white" strokeWidth={1.7} />
        </div>
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-white"
          style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}>
          {video.duration}
        </span>
      </div>
      {/* Info */}
      <div className="p-3.5">
        <p className="text-[13px] font-semibold leading-snug mb-2 group-hover:text-[var(--p)] transition-colors"
          style={{ color: 'var(--t1)' }}>
          {video.title}
        </p>
        <div className="flex items-center justify-between">
          <CategoryBadge category={video.category} />
          <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{video.views} views</span>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ faq, open, onToggle }: {
  faq: typeof FAQS[number]; open: boolean; onToggle: () => void
}) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--white)', border: `1.5px solid ${open ? 'var(--p)' : 'var(--bd)'}` }}>
      <button className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
        onClick={onToggle}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: open ? 'var(--p2)' : 'var(--bg)' }}>
            <HelpCircle className="w-3.5 h-3.5" style={{ color: open ? 'var(--p)' : 'var(--t3)' }} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug" style={{ color: open ? 'var(--p)' : 'var(--t1)' }}>
              {faq.q}
            </p>
            {!open && <CategoryBadge category={faq.category} />}
          </div>
        </div>
        <div className="shrink-0" style={{ color: open ? 'var(--p)' : 'var(--t3)' }}>
          {open ? <ChevronUp className="w-4 h-4" strokeWidth={1.7} /> : <ChevronDown className="w-4 h-4" strokeWidth={1.7} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="ml-9">
            <div className="mb-2"><CategoryBadge category={faq.category} /></div>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--t2)' }}>{faq.a}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ResourceCard({ resource }: { resource: typeof RESOURCES[number] }) {
  const Icon = resource.icon
  const isLink = resource.type === 'Link'
  return (
    <div className="group flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-sm"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
        <Icon className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{resource.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <CategoryBadge category={resource.category} />
          {resource.size && (
            <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{resource.size}</span>
          )}
        </div>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        style={{ background: 'var(--p2)' }}>
        {isLink
          ? <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
          : <Download     className="w-3.5 h-3.5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
        }
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [tab, setTab]         = useState<Tab>('articles')
  const [query, setQuery]     = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const filteredArticles  = filterByQuery(ARTICLES,  query)
  const filteredVideos    = filterByQuery(VIDEOS,    query)
  const filteredFaqs      = filterFaqs(FAQS,         query)
  const filteredResources = filterByQuery(RESOURCES,  query)

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'articles',  label: 'Articles',  icon: <BookOpen  className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredArticles.length  },
    { id: 'videos',    label: 'Videos',    icon: <Video     className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredVideos.length    },
    { id: 'faqs',      label: 'FAQs',      icon: <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredFaqs.length      },
    { id: 'resources', label: 'Resources', icon: <Download  className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredResources.length },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Help & Support" subtitle="Guides, tutorials, FAQs and resources" />

          <main className="p-7 flex-1" style={{ animation: 'fadeUp .4s ease both' }}>

            {/* ── Search bar ── */}
            <div className="relative mb-7 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search articles, videos, FAQs…"
                className="w-full h-12 pl-11 pr-4 rounded-2xl text-[14px] outline-none"
                style={{ background: 'var(--white)', border: '1.5px solid var(--bd)', color: 'var(--t1)', transition: 'border-color .15s' }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--p)' }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'var(--bd)' }}
              />
            </div>

            {/* ── Quick support cards ── */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Tutorials */}
              <div className="rounded-2xl p-5 cursor-pointer group transition-all hover:shadow-md"
                style={{ background: 'var(--p)', border: '1px solid var(--p)' }}
                onClick={() => setTab('videos')}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(255,255,255,.2)' }}>
                  <PlayCircle className="w-5 h-5 text-white" strokeWidth={1.7} />
                </div>
                <p className="text-[14px] font-bold text-white">Video Tutorials</p>
                <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.75)' }}>
                  Step-by-step walkthroughs for every feature
                </p>
                <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold text-white">
                  Watch now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.7} />
                </div>
              </div>

              {/* Live chat */}
              <div className="rounded-2xl p-5 cursor-pointer group transition-all hover:shadow-md"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#25d366' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#25d36618' }}>
                  <MessageSquare className="w-5 h-5" style={{ color: '#25d366' }} strokeWidth={1.7} />
                </div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Live Chat</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>
                  Chat with our team in real time
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[12px] font-semibold" style={{ color: '#25d366' }}>Online now</span>
                </div>
              </div>

              {/* Email support */}
              <div className="rounded-2xl p-5 cursor-pointer group transition-all hover:shadow-md"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0077B5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bd)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#0077B518' }}>
                  <Mail className="w-5 h-5" style={{ color: '#0077B5' }} strokeWidth={1.7} />
                </div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Email Support</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>
                  We reply within 24 hours
                </p>
                <div className="flex items-center gap-1 mt-3 text-[12px] font-semibold" style={{ color: '#0077B5' }}>
                  Send email <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={1.7} />
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 p-1 rounded-2xl mb-5 w-fit"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={tab === t.id
                    ? { background: 'var(--p)', color: '#fff' }
                    : { color: 'var(--t3)' }}>
                  {t.icon}
                  {t.label}
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                    style={{
                      background: tab === t.id ? 'rgba(255,255,255,.25)' : 'var(--bg)',
                      color: tab === t.id ? '#fff' : 'var(--t3)',
                    }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Articles tab ── */}
            {tab === 'articles' && (
              <div>
                {query && (
                  <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
                    {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                )}
                {/* Featured */}
                {!query && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>Featured</p>
                    <div className="grid grid-cols-2 gap-3">
                      {ARTICLES.filter(a => a.featured).map(a => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </div>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>
                  {query ? 'Results' : 'All Articles'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(query ? filteredArticles : ARTICLES.filter(a => !a.featured)).map(a => <ArticleCard key={a.id} article={a} />)}
                </div>
                {filteredArticles.length === 0 && (
                  <div className="text-center py-16">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--t3)' }} />
                    <p className="text-[14px] font-medium" style={{ color: 'var(--t2)' }}>No articles found for "{query}"</p>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>Try different keywords or browse by category</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Videos tab ── */}
            {tab === 'videos' && (
              <div>
                {query && (
                  <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
                    {filteredVideos.length} result{filteredVideos.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                )}
                {!query && (
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>Featured</p>
                    <div className="grid grid-cols-2 gap-4">
                      {VIDEOS.filter(v => v.featured).map(v => <VideoCard key={v.id} video={v} />)}
                    </div>
                  </div>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>
                  {query ? 'Results' : 'All Videos'}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {(query ? filteredVideos : VIDEOS.filter(v => !v.featured)).map(v => <VideoCard key={v.id} video={v} />)}
                </div>
                {filteredVideos.length === 0 && (
                  <div className="text-center py-16">
                    <Video className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--t3)' }} />
                    <p className="text-[14px] font-medium" style={{ color: 'var(--t2)' }}>No videos found for "{query}"</p>
                  </div>
                )}
              </div>
            )}

            {/* ── FAQs tab ── */}
            {tab === 'faqs' && (
              <div>
                {query && (
                  <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
                    {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                )}
                <div className="space-y-3 max-w-2xl">
                  {filteredFaqs.map(faq => (
                    <FaqItem
                      key={faq.id}
                      faq={faq}
                      open={openFaq === faq.id}
                      onToggle={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    />
                  ))}
                </div>
                {filteredFaqs.length === 0 && (
                  <div className="text-center py-16">
                    <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--t3)' }} />
                    <p className="text-[14px] font-medium" style={{ color: 'var(--t2)' }}>No FAQs found for "{query}"</p>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>
                      Still have a question?{' '}
                      <button className="underline cursor-pointer" style={{ color: 'var(--p)' }}>
                        Contact support
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Resources tab ── */}
            {tab === 'resources' && (
              <div>
                {query && (
                  <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
                    {filteredResources.length} result{filteredResources.length !== 1 ? 's' : ''} for "{query}"
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {filteredResources.map(r => <ResourceCard key={r.id} resource={r} />)}
                </div>
                {filteredResources.length === 0 && (
                  <div className="text-center py-16">
                    <Download className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--t3)' }} />
                    <p className="text-[14px] font-medium" style={{ color: 'var(--t2)' }}>No resources found for "{query}"</p>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  )
}
