import type { SVGProps } from "react"
import {
  ArrowLeft as ArrowLeftIconoir,
  ArrowRight as ArrowRightIconoir,
  Bookmark as BookmarkIconoir,
  BookmarkBook,
  Calendar as CalendarIconoir,
  Camera as CameraIconoir,
  Check as CheckIconoir,
  CheckCircle as CheckCircleIconoir,
  Circle as CircleIconoir,
  Clock as ClockIconoir,
  ClockRotateRight,
  Crown as CrownIconoir,
  Drag,
  Eye as EyeIconoir,
  EyeClosed,
  Group,
  Heart as HeartIconoir,
  Home,
  InfoCircle,
  Lock as LockIconoir,
  LogIn as LogInIconoir,
  Mail as MailIconoir,
  MediaImage,
  MoreHoriz,
  MultiplePages,
  NavArrowDown,
  NavArrowLeft,
  NavArrowRight,
  NavArrowUp,
  Page,
  Plus as PlusIconoir,
  Refresh,
  ScanBarcode,
  Search as SearchIconoir,
  Send as SendIconoir,
  Shield as ShieldIconoir,
  ShieldAlert as ShieldAlertIconoir,
  ShoppingBag as ShoppingBagIconoir,
  SidebarCollapse,
  Sparks,
  Star as StarIconoir,
  StatUp,
  Trash as TrashIconoir,
  Upload as UploadIconoir,
  User as UserIconoir,
  WarningCircle,
  Weight,
  Xmark,
  XmarkCircle,
} from "iconoir-react"

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
}

type IconoirIcon = React.ComponentType<SVGProps<SVGSVGElement>>

function icon(Icon: IconoirIcon, defaultStrokeWidth = 1.75) {
  const Wrapped = ({ size = 24, strokeWidth = defaultStrokeWidth, className, ...props }: IconProps) => (
    <Icon
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  )
  Wrapped.displayName = Icon.displayName ?? "Icon"
  return Wrapped
}

/** Lucide-compatible names — backed by Iconoir */
export const X = icon(Xmark)
export const ChevronDown = icon(NavArrowDown)
export const ChevronUp = icon(NavArrowUp)
export const ChevronLeft = icon(NavArrowLeft)
export const ChevronRight = icon(NavArrowRight)
export const ChevronDownIcon = ChevronDown
export const ChevronLeftIcon = ChevronLeft
export const ChevronRightIcon = ChevronRight
export const MoreHorizontal = icon(MoreHoriz)
export const PanelLeft = icon(SidebarCollapse)
export const GripVertical = icon(Drag)
export const ArrowLeft = icon(ArrowLeftIconoir)
export const ArrowRight = icon(ArrowRightIconoir)
export const Check = icon(CheckIconoir)
export const Circle = icon(CircleIconoir)
export const Search = icon(SearchIconoir)
export const Plus = icon(PlusIconoir)
export const Calendar = icon(CalendarIconoir)
export const Camera = icon(CameraIconoir)
export const Upload = icon(UploadIconoir)
export const Send = icon(SendIconoir)
export const Heart = icon(HeartIconoir)
export const Star = icon(StarIconoir)
export const Trash2 = icon(TrashIconoir)
export const User = icon(UserIconoir)
export const Mail = icon(MailIconoir)
export const Lock = icon(LockIconoir)
export const Crown = icon(CrownIconoir)
export const ShoppingBag = icon(ShoppingBagIconoir)
export const Eye = icon(EyeIconoir)
export const EyeOff = icon(EyeClosed)
export const LogIn = icon(LogInIconoir)
export const AlertCircle = icon(WarningCircle)
export const CheckCircle = icon(CheckCircleIconoir)
export const Sparkles = icon(Sparks)
export const Scale = icon(Weight)
export const FileText = icon(Page)
export const Layers3 = icon(MultiplePages)
export const RefreshCw = icon(Refresh)
export const ShieldAlert = icon(ShieldAlertIconoir)
export const History = icon(ClockRotateRight)
export const TrendingUp = icon(StatUp)
export const Shield = icon(ShieldIconoir)
export const XCircle = icon(XmarkCircle)
export const ScanLine = icon(ScanBarcode)
export const BookmarkCheck = icon(BookmarkBook)
export const BookmarkPlus = icon(BookmarkIconoir)
export const CalendarDays = icon(CalendarIconoir)
export const Clock = icon(ClockIconoir)
export const Clock3 = Clock
export const Info = icon(InfoCircle)

export function Dot({ size = 8, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

/** Bottom nav */
export const NavHome = icon(Home, 1.8)
export const NavCommunity = icon(Group, 1.8)
export const NavCamera = icon(CameraIconoir, 2)
export const NavHistory = icon(ClockIconoir, 1.8)
export const NavProfile = icon(UserIconoir, 1.8)
