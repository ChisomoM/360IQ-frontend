import { Toaster as Sonner } from "sonner"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "@/components/icons"

type ToasterProps = React.ComponentProps<typeof Sonner>

/** Sonner reads these variables, so toasts follow the paper and ink tokens. */
const tokenStyle = {
  "--normal-bg": "var(--surface-1)",
  "--normal-border": "var(--line)",
  "--normal-text": "var(--text-primary)",
  "--border-radius": "12px",
} as React.CSSProperties

/** Top right, 6s, token colours. The icon colour carries the tone (no richColors). */
const Toaster = ({ style, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      duration={6000}
      className="toaster group"
      style={{ ...tokenStyle, ...style }}
      icons={{
        success: <CheckCircle size={16} className="text-positive" />,
        error: <XCircle size={16} className="text-risk" />,
        warning: <AlertTriangle size={16} className="text-caution" />,
        info: <AlertCircle size={16} className="text-signal-text" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast !font-sans !shadow-raised",
          title: "!font-semibold",
          description: "!text-text-secondary",
          actionButton:
            "!h-8 !rounded-sm !bg-signal !px-3 !font-semibold !text-on-signal hover:!bg-signal-hover",
          cancelButton:
            "!h-8 !rounded-sm !bg-field !px-3 !font-semibold !text-text-primary hover:!bg-field-hover",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
