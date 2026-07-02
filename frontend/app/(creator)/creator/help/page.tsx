'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { dmApi } from '@/lib/api/dm.api'
import {
  HELP_ARTICLES,
  HELP_CATEGORY_COLORS,
  HELP_FAQ_FOOTNOTE,
  HELP_FAQS,
  HELP_RESOURCES,
  HELP_STATIC_DISCLAIMER,
  HELP_VIDEOS,
  SUPPORT_EMAIL,
  type HelpArticle,
  type HelpFaq,
  type HelpResource,
  type HelpVideo,
} from '@/lib/help-content'
import {
  Search, PlayCircle, MessageSquare, Mail, BookOpen,
  Video, HelpCircle, FileText, ChevronDown, ChevronUp,
  ExternalLink, Clock, Tag, ArrowRight, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'articles' | 'videos' | 'faqs' | 'resources'

function filterByQuery<T extends { title: string; category: string }>(items: T[], q: string) {
  if (!q.trim()) return items
  const lq = q.toLowerCase()
  return items.filter(i => i.title.toLowerCase().includes(lq) || i.category.toLowerCase().includes(lq))
}

function filterFaqs(items: HelpFaq[], q: string) {
  if (!q.trim()) return items
  const lq = q.toLowerCase()
  return items.filter(i => i.q.toLowerCase().includes(lq) || i.a.toLowerCase().includes(lq) || i.category.toLowerCase().includes(lq))
}

function CategoryBadge({ category }: { category: string }) {
  const color = HELP_CATEGORY_COLORS[category] ?? 'var(--p)'
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: color + '18', color }}>
      {category}
    </span>
  )
}

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'var(--p2)' }}>
        <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-snug mb-1.5" style={{ color: 'var(--t1)' }}>
          {article.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={article.category} />
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
            <Clock className="w-3 h-3" strokeWidth={1.7} />
            {article.readTime} min read
          </span>
          <span className="text-[11px] font-medium" style={{ color: 'var(--t3)' }}>Coming soon</span>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video }: { video: HelpVideo }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="relative w-full flex items-center justify-center"
        style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, var(--p2) 0%, var(--bg) 100%)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center opacity-60"
          style={{ background: 'var(--p)' }}>
          <PlayCircle className="w-6 h-6 text-white" strokeWidth={1.7} />
        </div>
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-white"
          style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}>
          {video.duration}
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-[13px] font-semibold leading-snug mb-2" style={{ color: 'var(--t1)' }}>
          {video.title}
        </p>
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={video.category} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--t3)' }}>Coming soon</span>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ faq, open, onToggle }: {
  faq: HelpFaq; open: boolean; onToggle: () => void
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

function ResourceCard({ resource }: { resource: HelpResource }) {
  const Icon = resource.icon
  const content = (
  <>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
        <Icon className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{resource.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <CategoryBadge category={resource.category} />
          {resource.comingSoon
            ? <span className="text-[11px] font-medium" style={{ color: 'var(--t3)' }}>Coming soon</span>
            : resource.url
              ? <span className="text-[11px]" style={{ color: 'var(--t3)' }}>External link</span>
              : null}
        </div>
      </div>
      {!resource.comingSoon && resource.url && (
        <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
      )}
  </>
  )

  if (!resource.comingSoon && resource.url) {
    return (
      <a href={resource.url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:shadow-sm"
        style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        {content}
      </a>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      {content}
    </div>
  )
}

export default function HelpPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('articles')
  const [query, setQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [startingChat, setStartingChat] = useState(false)

  const filteredArticles = filterByQuery(HELP_ARTICLES, query)
  const filteredVideos = filterByQuery(HELP_VIDEOS, query)
  const filteredFaqs = filterFaqs(HELP_FAQS, query)
  const filteredResources = filterByQuery(HELP_RESOURCES, query)

  const startLiveChat = async () => {
    setStartingChat(true)
    try {
      await dmApi.startHelpConversation()
      router.push('/creator/messages')
    } catch (error: any) {
      toast.error(error?.message || 'Unable to start live chat. Try email support instead.')
    } finally {
      setStartingChat(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'articles', label: 'Articles', icon: <BookOpen className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredArticles.length },
    { id: 'videos', label: 'Videos', icon: <Video className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredVideos.length },
    { id: 'faqs', label: 'FAQs', icon: <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredFaqs.length },
    { id: 'resources', label: 'Resources', icon: <FileText className="w-3.5 h-3.5" strokeWidth={1.7} />, count: filteredResources.length },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Help & Support" subtitle="Static guides, FAQs, and live support" />

          <main id="main-content" className="p-7 flex-1" style={{ animation: 'fadeUp .4s ease both' }}>

            <div className="mb-6 flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.22)' }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--p)' }} />
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--t2)' }}>{HELP_STATIC_DISCLAIMER}</p>
            </div>

            <div className="relative mb-7 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search articles, videos, FAQs…"
                className="w-full h-12 pl-11 pr-4 rounded-2xl text-[14px] outline-none"
                style={{ background: 'var(--white)', border: '1.5px solid var(--bd)', color: 'var(--t1)' }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <button type="button" onClick={() => setTab('videos')}
                className="rounded-2xl p-5 text-left cursor-pointer transition-all hover:shadow-md"
                style={{ background: 'var(--p)', border: '1px solid var(--p)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(255,255,255,.2)' }}>
                  <PlayCircle className="w-5 h-5 text-white" strokeWidth={1.7} />
                </div>
                <p className="text-[14px] font-bold text-white">Video Tutorials</p>
                <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.75)' }}>
                  Walkthroughs are being published
                </p>
              </button>

              <button type="button" onClick={startLiveChat} disabled={startingChat}
                className="rounded-2xl p-5 text-left cursor-pointer transition-all hover:shadow-md disabled:opacity-60"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#25d36618' }}>
                  <MessageSquare className="w-5 h-5" style={{ color: '#25d366' }} strokeWidth={1.7} />
                </div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Live Chat</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>
                  Start a help conversation with our team
                </p>
                <p className="text-[12px] font-semibold mt-3" style={{ color: '#25d366' }}>
                  {startingChat ? 'Connecting…' : 'Open messages'}
                </p>
              </button>

              <a href={`mailto:${SUPPORT_EMAIL}`}
                className="rounded-2xl p-5 block transition-all hover:shadow-md"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: '#0077B518' }}>
                  <Mail className="w-5 h-5" style={{ color: '#0077B5' }} strokeWidth={1.7} />
                </div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Email Support</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>{SUPPORT_EMAIL}</p>
              </a>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-2xl mb-5 w-fit"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={tab === t.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                  {t.icon}
                  {t.label}
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[11px]"
                    style={{ background: tab === t.id ? 'rgba(255,255,255,.25)' : 'var(--bg)', color: tab === t.id ? '#fff' : 'var(--t3)' }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {tab === 'articles' && (
              <div>
                {!query && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>Featured</p>
                    <div className="grid grid-cols-2 gap-3">
                      {HELP_ARTICLES.filter(a => a.featured).map(a => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </div>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>
                  {query ? 'Results' : 'All Articles'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(query ? filteredArticles : HELP_ARTICLES.filter(a => !a.featured)).map(a => <ArticleCard key={a.id} article={a} />)}
                </div>
              </div>
            )}

            {tab === 'videos' && (
              <div>
                {!query && (
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--t3)' }}>Featured</p>
                    <div className="grid grid-cols-2 gap-4">
                      {HELP_VIDEOS.filter(v => v.featured).map(v => <VideoCard key={v.id} video={v} />)}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  {(query ? filteredVideos : HELP_VIDEOS.filter(v => !v.featured)).map(v => <VideoCard key={v.id} video={v} />)}
                </div>
              </div>
            )}

            {tab === 'faqs' && (
              <div>
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
                <p className="mt-6 max-w-2xl text-[11px] leading-relaxed" style={{ color: 'var(--t3)' }}>
                  {HELP_FAQ_FOOTNOTE}
                </p>
              </div>
            )}

            {tab === 'resources' && (
              <div className="grid grid-cols-2 gap-3">
                {filteredResources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
