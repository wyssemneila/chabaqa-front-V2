'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  Eye,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Star,
  Users,
} from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { communitiesApi, type Community } from '@/lib/api'

const unwrapCommunities = (response: any): Community[] => {
  const source =
    response?.data?.communities ||
    response?.data?.data?.communities ||
    response?.data ||
    response?.communities ||
    response

  return Array.isArray(source) ? source : []
}

const getCommunityId = (community: any) => String(community?._id || community?.id || community?.slug || '')
const getCommunityName = (community: any) => String(community?.name || 'Untitled community')
const getCommunityDescription = (community: any) =>
  String(community?.shortDescription || community?.short_description || community?.description || community?.bio || 'No description yet.')
const getCommunityImage = (community: any) =>
  String(community?.coverImage || community?.coverUrl || community?.thumbnailUrl || community?.image || community?.logoUrl || community?.logo || '')
const getCommunityLogo = (community: any) =>
  String(community?.logoUrl || community?.logo || community?.image || '')
const getMembersCount = (community: any) => {
  const value = community?.membersCount ?? community?.members
  if (Array.isArray(value)) return value.length
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const getRating = (community: any) => {
  const parsed = Number(community?.averageRating ?? community?.rating)
  return Number.isFinite(parsed) ? parsed : 0
}
const getPriceLabel = (community: any) => {
  const type = String(community?.priceType || community?.joinFee || '').toLowerCase()
  const amount = Number(community?.price ?? community?.feeAmount ?? community?.fees_of_join ?? 0)
  const currency = String(community?.currency || 'TND')
  if (type === 'free' || !amount) return 'Free'
  const cadence = type === 'monthly' || type === 'yearly' ? `/${type === 'monthly' ? 'mo' : 'yr'}` : ''
  return `${amount} ${currency}${cadence}`
}
const getVisibility = (community: any) => {
  if (typeof community?.isPrivate === 'boolean') return community.isPrivate ? 'Private' : 'Public'
  if (typeof community?.isPublic === 'boolean') return community.isPublic ? 'Public' : 'Private'
  return String(community?.status || community?.settings?.visibility || 'Public')
}
const getCreatorName = (community: any) =>
  String(community?.creator?.name || community?.creatorName || 'Creator')

function CommunityMedia({ community }: { community: any }) {
  const image = getCommunityImage(community)
  const logo = getCommunityLogo(community)
  const name = getCommunityName(community)

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-slate-100">
      {image ? (
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover outline outline-1 -outline-offset-1 outline-black/10 transition-transform duration-300 group-hover:scale-[1.025]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#eef2ff,#f8fafc_48%,#ecfeff)]">
          <span className="text-4xl font-black text-slate-300">{name.slice(0, 2).toUpperCase()}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white text-[16px] font-black text-indigo-700 shadow-lg">
          {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="max-w-[220px] truncate text-[15px] font-black text-white drop-shadow">{name}</p>
          <p className="max-w-[220px] truncate text-[12px] font-semibold text-white/80">{getCreatorName(community)}</p>
        </div>
      </div>
    </div>
  )
}

export default function CreatorCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadCommunities = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await communitiesApi.getMyManageable()
      setCommunities(unwrapCommunities(response))
    } catch (err: any) {
      setCommunities([])
      setError(err?.message || 'Failed to load communities.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCommunities()
  }, [])

  const filteredCommunities = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return communities
    return communities.filter((community: any) =>
      [getCommunityName(community), getCommunityDescription(community), community?.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }, [communities, search])

  const totals = useMemo(() => {
    return communities.reduce(
      (acc, community: any) => {
        acc.members += getMembersCount(community)
        if (String(getVisibility(community)).toLowerCase().includes('private')) acc.private += 1
        return acc
      },
      { communities: communities.length, members: 0, private: 0 },
    )
  }, [communities])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar title="Communities" subtitle="Manage the communities connected to your creator dashboard." />

        <main id="main-content" className="flex-1 p-6 lg:p-8 space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {[
                ['Communities', totals.communities],
                ['Members', totals.members],
                ['Private', totals.private],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-[12px] font-semibold text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-black tabular-nums text-slate-900">{value}</div>
                </div>
              ))}
            </div>

            <Link
              href="/creator/communities/create"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-[13px] font-bold text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Create community
            </Link>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search communities"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] outline-none transition-[border-color,box-shadow] duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>
            <button
              type="button"
              onClick={loadCommunities}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-[13px] font-bold text-slate-600 transition-colors duration-150 hover:bg-slate-50 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-[14px] font-semibold text-rose-700">{error}</div>
          ) : filteredCommunities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="text-[15px] font-black text-slate-800">No communities found</p>
              <p className="mt-2 text-[13px] text-slate-500">Create or join a manageable community to see it here.</p>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {filteredCommunities.map((community: any) => {
                const id = getCommunityId(community)
                const slug = String(community?.slug || id)
                const visibility = getVisibility(community)
                const isPrivate = visibility.toLowerCase().includes('private')
                const rating = getRating(community)
                return (
                  <article
                    key={id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                  >
                    <CommunityMedia community={community} />

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black ${isPrivate ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {visibility}
                        </span>
                        {community?.verified && (
                          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-[11px] font-black text-blue-700">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        )}
                        {community?.category && (
                          <span className="h-7 rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-black text-slate-600">
                            {String(community.category)}
                          </span>
                        )}
                      </div>

                      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-[13px] leading-6 text-slate-600" style={{ textWrap: 'pretty' }}>
                        {getCommunityDescription(community)}
                      </p>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                            <Users className="h-3.5 w-3.5" />
                            Members
                          </div>
                          <div className="mt-1 text-[15px] font-black tabular-nums text-slate-900">{getMembersCount(community)}</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                            <Star className="h-3.5 w-3.5" />
                            Rating
                          </div>
                          <div className="mt-1 text-[15px] font-black tabular-nums text-slate-900">{rating ? rating.toFixed(1) : '-'}</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                          <div className="text-[11px] font-bold text-slate-500">Access</div>
                          <div className="mt-1 truncate text-[15px] font-black tabular-nums text-slate-900">{getPriceLabel(community)}</div>
                        </div>
                      </div>

                      {Array.isArray(community?.tags) && community.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {community.tags.slice(0, 4).map((tag: string) => (
                            <span key={tag} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <Link
                          href={`/Creator/${slug}/home`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-[12px] font-black text-slate-600 transition-colors duration-150 hover:bg-slate-50 active:scale-[0.98]"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                        <Link
                          href={`/creator/community/${slug}/customize`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-[12px] font-black text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700 active:scale-[0.98]"
                        >
                          <Settings className="h-4 w-4" />
                          Customize
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
