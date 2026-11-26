import type { ReactNode, Ref } from 'react'
import { AccountMenu } from '@/components/account/AccountMenu'
import { Lock, Menu, Sparkles } from '@/components/icons'

interface TopBarProps {
  title: string
  roleName: string | null
  menuOpen: boolean
  onOpenMenu: () => void
  menuButtonRef?: Ref<HTMLButtonElement>
  isChatOpen: boolean
  onToggleChat: () => void
  /** Extra shortcuts, shown before the AI assistant button. */
  actions?: ReactNode
  onLogout: () => void
}

/** 64px bar: page title on the left; role pill, AI assistant and account menu on the right. */
export function TopBar({
  title,
  roleName,
  menuOpen,
  onOpenMenu,
  menuButtonRef,
  isChatOpen,
  onToggleChat,
  actions,
  onLogout,
}: TopBarProps) {
  return (
    <header className="flex h-[64px] shrink-0 items-center gap-2 border-b border-line bg-surface-1 px-4 lg:px-8">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-primary hover:bg-surface-2 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <p className="min-w-0 flex-1 truncate text-[1.286rem] font-semibold tracking-[-0.01em] text-text-primary">{title}</p>

      {roleName && (
        <span className="hidden max-w-[220px] items-center gap-1.5 rounded-pill bg-field px-3 py-1.5 text-xs font-medium text-text-secondary sm:inline-flex">
          <Lock size={14} className="shrink-0" />
          <span className="sr-only">Your role: </span>
          <span className="truncate">{roleName}</span>
        </span>
      )}

      {actions}

      <button
        type="button"
        onClick={onToggleChat}
        aria-label={isChatOpen ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={isChatOpen}
        title={isChatOpen ? 'Close AI assistant' : 'Open AI assistant'}
        className="iq-grad-border flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold text-text-primary transition-shadow duration-150 hover:shadow-raised md:px-3 lg:h-10"
      >
        <Sparkles size={18} className="text-signal-text" />
        <span className="hidden md:inline">AI assistant</span>
      </button>

      <AccountMenu onLogout={onLogout} />
    </header>
  )
}
