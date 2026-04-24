"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Star,
  AlertCircle,
  Loader2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  ThumbsUp,
  Trash2,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"

interface Post {
  id: string
  title?: string
  content: string
  excerpt: string
  thumbnail?: string
  status: string
  author: { id: string; name: string; email: string }
  community: { id: string; name: string }
  likeCount: number
  commentCount: number
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
}

interface PaginatedPosts {
  data: Post[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function PostsManagementPage() {
  const t = useTranslations("admin.content.posts")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const internalPath = stripLocaleFromPath(pathname)

  const [posts, setPosts] = useState<PaginatedPosts | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")

  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = 20

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = { page, limit }
      if (searchTerm) filters.searchTerm = searchTerm
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "published") filters.status = "approved"
        else if (statusFilter === "hidden") filters.status = "suspended"
        else filters.status = statusFilter
      }
      
      const response = await adminApi.content.getPosts(filters)
      if (response.success) {
        setPosts(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      toast.error(t("fetchError"))
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, t])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts()
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleModerate = async (postId: string, action: 'hide' | 'delete' | 'restore') => {
    try {
      await adminApi.content.moderatePost(postId, action)
      const messages: Record<string, string> = {
        hide: t("hideSuccess"),
        delete: t("deleteSuccess"),
        restore: t("restoreSuccess"),
      }
      toast.success(messages[action])
      fetchPosts()
    } catch (error) {
      toast.error(t("moderateError"))
    }
  }

  const handleFeature = async (postId: string, featured: boolean) => {
    try {
      await adminApi.content.featurePost(postId, featured)
      toast.success(featured ? t("featureSuccess") : t("unfeatureSuccess"))
      fetchPosts()
    } catch (error) {
      toast.error(t("featureError"))
    }
  }

  const getStatusBadge = (isPublished: boolean, isFeatured: boolean) => {
    if (isFeatured) {
      return <Badge className="bg-primary">{t("status.featured")}</Badge>
    }
    if (!isPublished) {
      return <Badge variant="destructive">{t("status.hidden")}</Badge>
    }
    return <Badge variant="secondary">{t("status.published")}</Badge>
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="published">{t("status.published")}</SelectItem>
                  <SelectItem value="hidden">{t("status.hidden")}</SelectItem>
                  <SelectItem value="featured">{t("status.featured")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="admin-table-shell border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts?.data.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t("noPosts")}</h3>
              <p className="text-muted-foreground">{t("noPostsDescription")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.post")}</TableHead>
                    <TableHead>{t("table.author")}</TableHead>
                    <TableHead>{t("table.community")}</TableHead>
                    <TableHead>{t("table.engagement")}</TableHead>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="w-[100px]">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts?.data.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {post.thumbnail && (
                            <img 
                              src={post.thumbnail} 
                              alt={post.title || "Post"}
                              className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <Link 
                              href={localizeHref(pathname, `/admin/content/posts/${post.id}`)}
                              className="font-medium hover:underline line-clamp-1"
                            >
                              {post.title || post.excerpt.substring(0, 50) + "..."}
                            </Link>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {post.content.substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{post.author.name}</p>
                          <p className="text-muted-foreground">{post.author.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{post.community.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                            {post.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            {post.commentCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.isPublished, post.isFeatured)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={localizeHref(pathname, `/admin/content/posts/${post.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t("actions.view")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFeature(post.id, !post.isFeatured)}>
                              <Star className="h-4 w-4 mr-2" />
                              {post.isFeatured ? t("actions.unfeature") : t("actions.feature")}
                            </DropdownMenuItem>
                            {post.isPublished ? (
                              <DropdownMenuItem onClick={() => handleModerate(post.id, 'hide')}>
                                <EyeOff className="h-4 w-4 mr-2" />
                                {t("actions.hide")}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleModerate(post.id, 'restore')}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t("actions.restore")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleModerate(post.id, 'delete')}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {posts && posts.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("showing")} {(page - 1) * limit + 1} - {Math.min(page * limit, posts.total)} {t("of")} {posts.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!posts.hasPrevPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page - 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!posts.hasNextPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page + 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
