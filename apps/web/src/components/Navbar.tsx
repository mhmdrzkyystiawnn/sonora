import { NavLink, Link } from "react-router-dom";
import { Music2, User, Compass, LogOut, Library, Tags, BarChart3 } from "lucide-react";
import { useAuth } from "../context/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "./NotificationBell";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { to: "/", end: true, label: "Discover", icon: Compass },
  { to: "/genre", end: false, label: "Genres", icon: Tags },
  { to: "/music", end: false, label: "Search Music", icon: Music2 },
  { to: "/artists", end: false, label: "Search Artists", icon: User },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6 sm:px-8">
        <Link
          to="/"
          className="font-script text-3xl leading-none text-primary transition hover:opacity-80 sm:text-4xl"
        >
          Sonora
        </Link>

        <div className="flex items-center gap-6 sm:gap-9">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className="group relative py-2">
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-2">
                    <Icon
                      className={`size-3.5 shrink-0 transition ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                      }`}
                    />
                    <span
                      className={`hidden text-xs uppercase tracking-[0.2em] transition sm:inline ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </span>
                  <span
                    className={`absolute -bottom-[1px] left-0 h-px bg-primary transition-all duration-300 ease-out ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}

          <div className="hidden h-4 w-px bg-border sm:block" />

          {loading ? (
            <Skeleton className="h-4 w-16 rounded" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <NavLink to="/library" className="group relative py-2">
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-2">
                      <Library
                        className={`size-3.5 shrink-0 transition ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                      <span
                        className={`hidden text-xs uppercase tracking-[0.2em] transition sm:inline ${
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        Library
                      </span>
                    </span>
                    <span
                      className={`absolute -bottom-[1px] left-0 h-px bg-primary transition-all duration-300 ease-out ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </>
                )}
              </NavLink>
              <NavLink to="/stats" className="group relative py-2">
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-2">
                      <BarChart3
                        className={`size-3.5 shrink-0 transition ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                      <span
                        className={`hidden text-xs uppercase tracking-[0.2em] transition sm:inline ${
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        Stats
                      </span>
                    </span>
                    <span
                      className={`absolute -bottom-[1px] left-0 h-px bg-primary transition-all duration-300 ease-out ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </>
                )}
              </NavLink>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Avatar className="size-7">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate text-sm text-muted-foreground lg:inline">
                  {user.displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground transition hover:text-primary"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs uppercase tracking-widest text-muted-foreground transition hover:text-primary"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}