export type { Explore } from './explore-types'

export interface CommunitiesData {
  categories: string[]
  sortOptions: { value: string; label: string }[]
  communities: never[]
}

export interface ExploreStaticShape {
  categories: string[]
  sortOptions: { value: string; label: string }[]
  communities: never[]
}
