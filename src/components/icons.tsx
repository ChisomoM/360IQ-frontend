/**
 * 360IQ icons: Iconsax Linear only (design system section 8).
 * Import every icon from here, never from 'iconsax-react' directly. iconsax-react sets its
 * defaults with `defaultProps`, which React 19 ignores, so unwrapped icons render invisible.
 * AI is always the IqGlyph (exported here as `Sparkles` and `Bot`).
 */
import { forwardRef, type ReactNode, type RefAttributes, type ForwardRefExoticComponent, type SVGProps } from 'react'
import {
  Activity as IxActivity, Add, Archive as IxArchive, ArchiveBox, ArrowDown2, ArrowLeft as IxArrowLeft,
  ArrowLeft2, ArrowRight as IxArrowRight, ArrowRight2, ArrowSwapHorizontal, ArrowUp2, Back, Book1,
  Briefcase as IxBriefcase, Brush2, Building, Calendar as IxCalendar, CalendarTick, Call,
  Camera as IxCamera, Card, Category, Chart, Chart1, ClipboardText, ClipboardTick, Clock as IxClock,
  CloseCircle, Copy as IxCopy, Crown1, Data, Diagram, DirectboxReceive, Document, DocumentFilter,
  DocumentText, DocumentUpload, Edit, Edit2 as IxEdit2, Element3, EmojiHappy, Eraser as IxEraser,
  Export, ExportSquare, Eye as IxEye, EyeSlash, Facebook as IxFacebook, Filter as IxFilter,
  FilterEdit, Flash, GalleryImport, Global, Grid2, HambergerMenu, Hashtag, Hierarchy, Hierarchy2,
  Import, InfoCircle, Key as IxKey, LampOn, Link, Location, Lock as IxLock, Login, LogoutCurve,
  Message, MessageQuestion, MessageText, Microphone2, MicrophoneSlash, Moon as IxMoon, More,
  MusicSquare, NoteText, Notification, People, Play as IxPlay, Printer as IxPrinter, Profile2User,
  ProfileCircle, Refresh2, RotateLeft, RotateRight, Routing, RowVertical, Save2, Scan,
  SearchNormal1, Send2, Setting2, Setting4, Share, Shield as IxShield, ShieldCross, ShieldTick,
  SidebarLeft, Sms, Star1, StarSlash, StatusUp, Stop, Sun1, Tag as IxTag, TaskSquare, Teacher,
  Text, TickCircle, TickSquare, Timer, Timer1, ToggleOffCircle, Trash as IxTrash, TrendUp,
  User as IxUser, UserAdd, UserEdit, UserTick, Wallet as IxWallet, Warning2,
  type Icon as IconsaxGlyph,
} from 'iconsax-react'
import { cn } from '@/lib/utils'
import { LOGO } from '@/components/brand/logo-paths'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string
}
export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>
/** Alias so code that typed icons as `LucideIcon` keeps reading naturally. */
export type LucideIcon = IconComponent

function wrap(Glyph: IconsaxGlyph, base?: string): IconComponent {
  return forwardRef<SVGSVGElement, IconProps>(({ size = 20, color = 'currentColor', className, ...props }, ref) => (
    <Glyph
      aria-hidden="true"
      {...(props as object)}
      ref={ref}
      size={size}
      color={color}
      variant="Linear"
      className={cn(base, className)}
    />
  ))
}

/** For the few shapes Iconsax Linear has no equivalent of. Same 24px grid and 1.5 stroke. */
function draw(children: ReactNode): IconComponent {
  return forwardRef<SVGSVGElement, IconProps>(({ size = 20, color = 'currentColor', ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  ))
}

const Glyph = forwardRef<SVGSVGElement, IconProps>(({ size = 20, color = 'currentColor', ...props }, ref) => (
  <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
    <path d={LOGO.q} />
  </svg>
))

// AI
export const Sparkles = Glyph
export const Bot = Glyph

// Drawn
export const Check = draw(<path d="M5 12.5l4.5 4.5L19 7.5" />)
export const X = draw(<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />)
export const Circle = draw(<circle cx="12" cy="12" r="9" />)
export const Dot = draw(<circle cx="12" cy="12" r="1.5" />)
export const Loader2 = draw(<path d="M21 12a9 9 0 1 1-6.2-8.56" />)
export const ArrowUpRight = draw(<path d="M7 17L17 7M8 7h9v9" />)
export const CornerDownRight = draw(<path d="M5 5v6a3 3 0 0 0 3 3h11M15 10l4 4-4 4" />)
export const GripVertical = draw(<path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />)

// Iconsax Linear
export const Activity = wrap(IxActivity)
export const AlertCircle = wrap(InfoCircle)
export const AlertTriangle = wrap(Warning2)
export const Archive = wrap(IxArchive)
export const AreaChart = wrap(Chart1)
export const ArrowLeft = wrap(IxArrowLeft)
export const ArrowRight = wrap(IxArrowRight)
export const ArrowRightLeft = wrap(ArrowSwapHorizontal)
export const BarChart2 = wrap(Chart)
export const BarChart3 = wrap(Chart)
export const Bell = wrap(Notification)
export const BookOpen = wrap(Book1)
export const Briefcase = wrap(IxBriefcase)
export const Building2 = wrap(Building)
export { Building2 as Building }
export const Calendar = wrap(IxCalendar)
export { Calendar as CalendarDays, Calendar as CalendarIcon }
export const CalendarClock = wrap(CalendarTick)
export const Camera = wrap(IxCamera)
export const CheckCircle = wrap(TickCircle)
export { CheckCircle as CheckCircle2 }
export const CheckSquare = wrap(TickSquare)
export const ChevronDown = wrap(ArrowDown2)
export const ChevronLeft = wrap(ArrowLeft2)
export const ChevronRight = wrap(ArrowRight2)
export const ChevronUp = wrap(ArrowUp2)
export const ClipboardCheck = wrap(ClipboardTick)
export const ClipboardList = wrap(ClipboardText)
export const Clock = wrap(IxClock)
export const Copy = wrap(IxCopy)
export const CreditCard = wrap(Card)
export const Crown = wrap(Crown1)
export { Crown as Gem }
export const Database = wrap(Data)
export const Wallet = wrap(IxWallet)
export { Wallet as DollarSign }
export const Download = wrap(Import)
export const Edit2 = wrap(IxEdit2)
export { Edit2 as Pencil, Edit2 as PenLine, Edit2 as FilePen }
export const FileSignature = wrap(Edit)
export { FileSignature as Edit }
export const Eraser = wrap(IxEraser)
export const ExternalLink = wrap(ExportSquare)
export const Eye = wrap(IxEye)
export const EyeOff = wrap(EyeSlash)
export { EyeOff as EyeClosed }
export const Facebook = wrap(IxFacebook)
export const FileArchive = wrap(ArchiveBox)
export const FileAudio = wrap(MusicSquare)
export const FileCheck = wrap(ClipboardTick)
export const FileSearch = wrap(DocumentFilter)
export const FileSpreadsheet = wrap(Document)
export { FileSpreadsheet as FileType }
export const FileText = wrap(DocumentText)
export const FileUp = wrap(DocumentUpload)
export const Filter = wrap(IxFilter)
export const GitBranch = wrap(Hierarchy)
export const GitCompare = wrap(ArrowSwapHorizontal)
export const GitMerge = wrap(Hierarchy2)
export const Globe = wrap(Global)
export { Globe as Twitter }
export const GraduationCap = wrap(Teacher)
export { GraduationCap as School }
export const Handshake = wrap(People)
export const Hash = wrap(Hashtag)
export const HelpCircle = wrap(MessageQuestion)
export const History = wrap(Timer1)
export const Hourglass = wrap(Timer)
export const ImageUp = wrap(GalleryImport)
export const Inbox = wrap(DirectboxReceive)
export const Key = wrap(IxKey)
export { Key as KeyRound }
export const LayoutDashboard = wrap(Category)
export const LayoutGrid = wrap(Grid2)
export const Lightbulb = wrap(LampOn)
export const LineChart = wrap(StatusUp)
export const Link2 = wrap(Link)
export const List = wrap(RowVertical)
export const ListFilter = wrap(FilterEdit)
export const ListTodo = wrap(TaskSquare)
export const Lock = wrap(IxLock)
export const LogIn = wrap(Login)
export const LogOut = wrap(LogoutCurve)
export const Mail = wrap(Sms)
export const MapPin = wrap(Location)
export const Menu = wrap(HambergerMenu)
export const MessageCircle = wrap(Message)
export const MessageSquare = wrap(MessageText)
export const Mic = wrap(Microphone2)
export const MicOff = wrap(MicrophoneSlash)
export const Moon = wrap(IxMoon)
export const Sun = wrap(Sun1)
export const MoreHorizontal = wrap(More)
export const MoreVertical = wrap(More, 'rotate-90')
export const Palette = wrap(Brush2)
export const PanelLeft = wrap(SidebarLeft)
export const Phone = wrap(Call)
export const PieChart = wrap(Diagram)
export const Play = wrap(IxPlay)
export const Plus = wrap(Add)
export const Printer = wrap(IxPrinter)
export const RefreshCw = wrap(Refresh2)
export const RotateCcw = wrap(RotateLeft)
export const RotateCw = wrap(RotateRight)
export const Save = wrap(Save2)
export const ScanLine = wrap(Scan)
export const ScrollText = wrap(NoteText)
export const Search = wrap(SearchNormal1)
export const Send = wrap(Send2)
export const Settings = wrap(Setting2)
export const Settings2 = wrap(Setting4)
export const Share2 = wrap(Share)
export const Shield = wrap(IxShield)
export const ShieldAlert = wrap(ShieldCross)
export const ShieldCheck = wrap(ShieldTick)
export const Smile = wrap(EmojiHappy)
export const Square = wrap(Stop)
export const Star = wrap(Star1)
export const StarOff = wrap(StarSlash)
export const TableIcon = wrap(Element3)
export { TableIcon as TableProperties }
export const Tag = wrap(IxTag)
export const ToggleLeft = wrap(ToggleOffCircle)
export const Trash2 = wrap(IxTrash)
export { Trash2 as Trash }
export const TrendingUp = wrap(TrendUp)
export const Type = wrap(Text)
export const Undo2 = wrap(Back)
export const Upload = wrap(Export)
export const User = wrap(IxUser)
export const UserCheck = wrap(UserTick)
export const UserCircle = wrap(ProfileCircle)
export const UserCog = wrap(UserEdit)
export const UserPlus = wrap(UserAdd)
export const Users = wrap(Profile2User)
export const Workflow = wrap(Routing)
export const XCircle = wrap(CloseCircle)
export const Zap = wrap(Flash)
