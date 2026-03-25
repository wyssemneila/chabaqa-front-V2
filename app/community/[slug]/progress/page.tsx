import { redirect } from "next/navigation"

export default async function CommunityRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Redirect /community/{slug} to /{slug}/{slug}
  redirect(`/${slug}/${slug}`)
}
