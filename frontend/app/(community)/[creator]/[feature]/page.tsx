import { redirect } from "next/navigation"

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ creator: string; feature: string }>
}) {
  const { creator, feature } = await params
  redirect(`/${creator}/${feature}/home`)
}
