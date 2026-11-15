"use client";

import { memo, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLogout, useMe } from "@/hooks/use-auth";
import { Brand } from "./brand";
import { NAV_ITEMS } from "./nav-items";

/** Pure list of links; `pathname` decides which one is highlighted */
function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavList pathname={pathname} onNavigate={onNavigate} />;
}

/**
 * usePathname() is runtime data on dynamic routes (e.g. /doctors/[id]), so under
 * Cache Components it must sit inside <Suspense>. The fallback is the same nav
 * without the active highlight, so the sidebar never flashes empty.
 */
const NavLinks = memo(function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavList pathname="" onNavigate={onNavigate} />}>
      <ActiveNavList onNavigate={onNavigate} />
    </Suspense>
  );
});

function UserCard() {
  const { data: user, isLoading } = useMe();
  const logout = useLogout();
  const initials = (user?.name ?? "A").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-28 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Log out"
        title="Log out"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Close the mobile drawer with Escape and lock page scroll while it's open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r bg-background p-4 lg:flex">
        <div className="px-2 pt-1">
          <Brand />
        </div>
        <div className="flex-1">
          <NavLinks />
        </div>
        <UserCard />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <Button type="button" variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col gap-6 bg-background p-4 shadow-xl transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-2 pt-1">
            <Brand />
            <Button type="button" variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>
          <div className="flex-1">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <UserCard />
        </aside>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
