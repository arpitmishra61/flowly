"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LogOut, Menu } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "My Zaps" },
  { href: "/builder", label: "Builder" },
  { href: "/chat", label: "Chat" },
  { href: "/trigger", label: "Trigger" },
  { href: "/settings", label: "Settings" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const userBlock = session?.user && (
    <div className="flex items-center gap-2">
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt={session.user.name ?? "User avatar"}
          referrerPolicy="no-referrer"
          className="h-8 w-8 rounded-full shrink-0"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
          {session.user.name?.[0] ?? "U"}
        </div>
      )}
      <span className="text-sm font-medium truncate max-w-[10rem]">
        {session.user.name}
      </span>
    </div>
  );

  return (
    <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent shrink-0">
            Flowly
          </span>
          <nav className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:block">{userBlock}</div>

          {session?.user && (
            <Button
              variant="ghost"
              size="icon"
              title="Sign out"
              className="hidden md:inline-flex"
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            title="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" onClose={() => setMenuOpen(false)} className="w-4/5 max-w-xs">
          <div className="p-6 pt-16 flex flex-col gap-1 h-full">
            {session?.user && <div className="pb-4 mb-2 border-b">{userBlock}</div>}

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {session?.user && (
              <Button
                variant="outline"
                className="mt-auto gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/signin" });
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
