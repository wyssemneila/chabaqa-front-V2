"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Trash2, Edit2, Loader2 } from "lucide-react"
import type { Post } from "@/lib/api/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PostsListProps {
  posts: Post[]
  onPostDeleted: () => void
  onEdit: (post: Post) => void
}

export function PostsList({ posts, onPostDeleted, onEdit }: PostsListProps) {
  const { toast } = useToast()
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (postId: string) => {
    setIsDeleting(true)
    try {
      await api.posts.delete(postId)
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      setDeletePostId(null)
      onPostDeleted()
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete post",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {post.title && (
                  <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                )}
                <p className="text-sm text-gray-600">
                  {new Date(post.createdAt).toLocaleDateString()} at{" "}
                  {new Date(post.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(post)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletePostId(post.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Content Preview */}
            <p className="text-gray-800 mb-3 line-clamp-3">{post.content}</p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 text-sm text-gray-600 border-t pt-3">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{post.likesCount ?? post.likes ?? 0} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.commentsCount ?? post.comments?.length ?? 0} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                <span>{post.shareCount ?? 0} shares</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && handleDelete(deletePostId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
