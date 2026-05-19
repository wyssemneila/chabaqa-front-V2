import type { IconType } from "react-icons"
import {
  FaBullhorn,
  FaCalendarCheck,
  FaChartLine,
  FaCrown,
  FaGraduationCap,
  FaRegCreditCard,
  FaUsers,
} from "react-icons/fa6"
import { HiOutlineSparkles } from "react-icons/hi2"
import { PiChalkboardTeacherBold, PiPackageBold, PiPaletteBold, PiRocketLaunchBold, PiStorefrontBold } from "react-icons/pi"
import { RiMoneyDollarCircleLine, RiShieldCheckLine } from "react-icons/ri"
import { TbBrandDatabricks, TbChecklist, TbPhotoUp, TbProgressCheck } from "react-icons/tb"

export type LaunchIcon = IconType

export const launchIcons = {
  activity: FaChartLine,
  audience: FaUsers,
  branding: TbBrandDatabricks,
  challenge: FaCrown,
  checklist: TbChecklist,
  community: PiStorefrontBold,
  cover: TbPhotoUp,
  course: FaGraduationCap,
  event: FaCalendarCheck,
  launch: PiRocketLaunchBold,
  payout: FaRegCreditCard,
  post: FaBullhorn,
  pricing: RiMoneyDollarCircleLine,
  product: PiPackageBold,
  protection: RiShieldCheckLine,
  session: PiChalkboardTeacherBold,
  style: PiPaletteBold,
  success: TbProgressCheck,
  sparkle: HiOutlineSparkles,
} as const

export type LaunchIconName = keyof typeof launchIcons
