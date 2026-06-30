'use client'

import Link from 'next/link'
import { BookOpen, Clock, Users, Star, Zap, Globe, Lock, Settings, Eye } from 'lucide-react'
import { resolveImageUrl } from '@/lib/resolve-image-url'

export interface CourseCardData {
  _id?: string
  id?: string
  mongoId?: string
  publicId?: string
  title: string
  description?: string
  thumbnail?: string
  level?: 'beginner' | 'intermediate' | 'advanced' | string
  duration?: number
  priceType?: 'free' | 'paid'
  price?: number
  isPublished?: boolean
  sectionsCount?: number
  chaptersCount?: number
  enrollmentsCount?: number
}

const LEVEL_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  beginner:     { bg: 'var(--cyan)',   color: '#fff', label: 'Beginner'     },
  intermediate: { bg: 'var(--orange)', color: '#fff', label: 'Intermediate' },
  advanced:     { bg: 'var(--pink)',   color: '#fff', label: 'Advanced'     },
}

const LEVEL_ICONS: Record<string, React.ElementType> = {
  beginner: BookOpen,
  intermediate: Zap,
  advanced: Star,
}

export function CourseCard({ course }: { course: CourseCardData }) {
  const id = course.mongoId ?? course._id ?? course.id ?? ''
  const lvl = LEVEL_COLORS[course.level ?? '']
  const LvlIcon = LEVEL_ICONS[course.level ?? ''] ?? BookOpen
  const thumbnail = resolveImageUrl(course.thumbnail) || course.thumbnail

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 group"
      style={{
        background: 'var(--white)',
        border: '1px solid var(--bd)',
        boxShadow: '0 2px 8px rgba(0,0,0,.04)',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(142,120,251,.16)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'}
    >
      {/* thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--bg)' }}>
        {thumbnail
          ? <img src={thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          : <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 opacity-20" style={{ color: 'var(--t3)' }} />
            </div>
        }

        {/* level badge */}
        {lvl && (
          <span
            className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: lvl.bg, color: lvl.color }}
          >
            <LvlIcon className="w-3 h-3" />
            {lvl.label}
          </span>
        )}

        {/* published badge */}
        <span
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: course.isPublished ? 'rgba(16,185,129,.15)' : 'rgba(0,0,0,.4)',
            color: course.isPublished ? '#10b981' : '#fff',
            backdropFilter: 'blur(4px)',
          }}
        >
          {course.isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {course.isPublished ? 'Live' : 'Draft'}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-col flex-1 p-5">
        <h3
          className="text-[14px] font-bold leading-snug mb-1.5 line-clamp-2"
          style={{ color: 'var(--t1)' }}
        >
          {course.title}
        </h3>

        {course.description && (
          <p className="text-[12px] leading-relaxed mb-4 line-clamp-2 flex-1" style={{ color: 'var(--t3)' }}>
            {course.description}
          </p>
        )}

        {/* stats row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {course.duration != null && course.duration > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
              <Clock className="w-3 h-3" /> {course.duration}h
            </span>
          )}
          {course.chaptersCount != null && (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
              <BookOpen className="w-3 h-3" /> {course.chaptersCount} chapters
            </span>
          )}
          {course.enrollmentsCount != null && (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
              <Users className="w-3 h-3" /> {course.enrollmentsCount} enrolled
            </span>
          )}
        </div>

        {/* price + actions */}
        <div className="flex items-center justify-between pt-3.5 border-t" style={{ borderColor: 'var(--bd)' }}>
          <span
            className="text-[13px] font-bold"
            style={{ color: course.priceType === 'free' ? '#10b981' : 'var(--p)' }}
          >
            {course.priceType === 'free' ? 'Free' : `${course.price ?? 0} TND`}
          </span>

          <div className="flex items-center gap-2">
            <Link
              href={`/creator/courses/${id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{ border: '1.5px solid var(--bd)', color: 'var(--t2)', background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <Eye className="w-3.5 h-3.5" /> View
            </Link>
            <Link
              href={`/creator/courses/${id}/manage`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--p)', boxShadow: '0 2px 8px rgba(142,120,251,.3)' }}
            >
              <Settings className="w-3.5 h-3.5" /> Manage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
