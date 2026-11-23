import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-1 group-[.toaster]:text-text-primary group-[.toaster]:border-line group-[.toaster]:rounded-md group-[.toaster]:shadow-raised",
          description: "group-[.toast]:text-text-secondary",
          actionButton:
            "group-[.toast]:bg-signal group-[.toast]:text-on-signal",
          cancelButton:
            "group-[.toast]:bg-surface-2 group-[.toast]:text-text-secondary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
