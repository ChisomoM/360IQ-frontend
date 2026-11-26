import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "./ui/button";

/** Header of the public layout. */
export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-line bg-surface-1">
            <div className="mx-auto flex h-[64px] max-w-[1120px] items-center justify-between gap-4 px-6 lg:px-8">
                <Link to="/" aria-label="360IQ home" className="flex shrink-0">
                    <Logo size={28} />
                </Link>
                <Button asChild>
                    <Link to="/login">Sign in</Link>
                </Button>
            </div>
        </header>
    );
}
