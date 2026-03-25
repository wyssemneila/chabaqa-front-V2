import { redirect } from "next/navigation"

export default async function FeaturePage({
  params,
}: {
  params: { creator: string; feature: string }
}) {
  redirect(`/${params.creator}/${params.feature}/home`)
}
