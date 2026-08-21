"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  MessageSquare, 
  Users, 
  Eye, 
  Star,
  Loader2,
  ThumbsUp,
  MessageCircle,
  Trash2,
  EyeOff,
  Calendar,
  Flag
} from "lucide-react"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  user: { id: string; name: string; email: string; avatar?: string }
  createdAt: string
  updatedAt: string
}

interface Post {
  id: string
  title?: string
  content: string
  excerpt: string
  thumbnail?: string
  status: string
  author: { id: string; name: string; email: string; avatar?: string }
  community: { id: string; name: string; slug: string }
  likeCount: number
  commentCount: number
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

export default function PostDetailPage() {
  const t = useTranslations("admin.content.posts.detail")
  const params = useParams()
  const pathname = usePathname()
  const postId = params.id as string
  const internalPath = stripLocaleFromPath(pathname)

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await adminApi.content.getPostById(postId)
        if (response.success) {
          setPost(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch post:", error)
        toast.error(t("fetchError"))
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId, t])

  const handleModerate = async (action: 'hide' | 'delete' | 'restore') => {
    try {
      await adminApi.content.moderatePost(postId, action)
      const messages: Record<string, string> = {
        hide: t("hideSuccess"),
        delete: t("deleteSuccess"),
        restore: t("restoreSuccess"),
      }
      toast.success(messages[action])
      if (action === 'delete') {
        // Redirect back to posts list
        window.location.href = localizeHref(pathname, "/admin/content/posts")
      } else {
        const response = await adminApi.content.getPostById(postId)
        if (response.success) setPost(response.data)
      }
    } catch (error) {
      toast.error(t("moderateError"))
    }
  }

  const handleFeature = async () => {
    try {
      const newFeatured = !post?.isFeatured
      await adminApi.content.featurePost(postId, newFeatured)
      toast.success(newFeatured ? t("featureSuccess") : t("unfeatureSuccess"))
      const response = await adminApi.content.getPostById(postId)
      if (response.success) setPost(response.data)
    } catch (error) {
      toast.error(t("featureError"))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await adminApi.content.deleteComment(postId, commentId)
      toast.success(t("deleteCommentSuccess"))
      const response = await adminApi.content.getPostById(postId)
      if (response.success) setPost(response.data)
    } catch (error) {
      toast.error(t("deleteCommentError"))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{t("notFound")}</h3>
        <p className="text-muted-foreground">{t("notFoundDescription")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={localizeHref(pathname, "/admin/content/posts")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{post.title || t("untitledPost")}</h1>
            <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button 
            variant={post.isFeatured ? "default" : "outline"} 
            onClick={handleFeature}
          >
            <Star className="h-4 w-4 mr-2" />
            {post.isFeatured ? t("actions.unfeature") : t("actions.feature")}
          </Button>
          {post.isPublished ? (
            <Button variant="outline" onClick={() => handleModerate('hide')}>
              <EyeOff className="h-4 w-4 mr-2" />
              {t("actions.hide")}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleModerate('restore')}>
              <Eye className="h-4 w-4 mr-2" />
              {t("actions.restore")}
            </Button>
          )}
          <Button variant="destructive" onClick={() => handleModerate('delete')}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("actions.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            {post.thumbnail && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img 
                  src={post.thumbnail} 
                  alt={post.title || "Post"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {!post.isPublished && (
                  <Badge variant="destructive">{t("status.hidden")}</Badge>
                )}
                {post.isFeatured && (
                  <Badge className="bg-primary">{t("status.featured")}</Badge>
                )}
                {post.isPublished && !post.isFeatured && (
                  <Badge variant="secondary">{t("status.published")}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <p className="text-lg whitespace-pre-wrap">{post.content}</p>
              </div>
              
              <Separator />

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {post.likeCount} {t("engagement.likes")}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.commentCount} {t("engagement.comments")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t("comments.title")} ({post.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {post.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t("comments.empty")}</p>
              ) : (
                <div className="space-y-4">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-4 border rounded-lg">
                      {comment.user.avatar ? (
                        <img 
                          src={comment.user.avatar} 
                          alt={comment.user.name}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-medium text-primary">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{comment.user.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="flex-shrink-0 text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("author.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {post.author.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {post.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground">{post.author.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("community.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{post.community.name}</p>
                  <Link 
                    href={localizeHref(pathname, `/admin/communities/${post.community.id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("community.viewCommunity")}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("stats.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                  <span>{t("stats.likes")}</span>
                </div>
                <span className="font-medium">{post.likeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{t("stats.comments")}</span>
                </div>
                <span className="font-medium">{post.commentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{t("stats.created")}</span>
                </div>
                <span className="font-medium">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{t("stats.updated")}</span>
                </div>
                <span className="font-medium">
                  {new Date(post.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
