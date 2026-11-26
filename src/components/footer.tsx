import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";

export default function Footer() {
  return (
    <footer data-theme="ink" className="bg-surface-0 text-text-secondary">
      <div className="mx-auto max-w-[1120px] px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Logo size={28} />
            <p className="mt-4 text-sm">Every deal, one step ahead.</p>
          </div>
          <Link to="/login" className="text-sm font-medium text-signal-text hover:underline">
            Sign in
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 text-xs text-text-muted md:flex-row md:justify-between">
          <p>© 2026 360IQ. All rights reserved.</p>
          <p>Designed and developed by Chisomo Mutale</p>
        </div>
      </div>
    </footer>
  );
}
