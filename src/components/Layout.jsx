import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Home, Search, Trophy, MapPin, User, Menu, X, Star, Users, TrendingUp, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TodayMatchBanner from "./TodayMatchBanner";

const navItems = [
  { path: "/", label: "Inicio", icon: Home },
  { path: "/find-match", label: "Buscar Partido", icon: Search },
  { path: "/book-court", label: "Reservar", icon: MapPin },
  { path: "/my-matches", label: "Mis Partidos", icon: Trophy },
  { path: "/leaderboard", label: "Ranking", icon: TrendingUp },
  { path: "/profile", label: "Perfil", icon: User },
  { path: "/plans", label: "Planes", icon: Star },
];

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUpcoming, setHasUpcoming] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setIsAdmin(u?.role === "admin");
      const allMatches = await base44.entities.Match.list("-created_date", 50);
      const mine = allMatches.filter(
        (m) => (m.player1_email === u.email || m.player2_email === u.email) && m.status === "programado"
      );
      setHasUpcoming(mine.length > 0);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-lg">🎾</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">VAd</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const showDot = item.path === "/my-matches" && hasUpcoming;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {showDot && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
                  </Link>
                );
              })}
              {isAdmin && (
                <>
                  <Link to="/admin/users" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === "/admin/users" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                    <Users className="w-4 h-4" /> Usuarios
                  </Link>
                  <Link to="/admin/courts" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === "/admin/courts" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                    <MapPin className="w-4 h-4" /> Canchas
                  </Link>
                </>
              )}
            </nav>

            {/* Right side: logout + hamburger */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => base44.auth.logout()}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <nav className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  const showDot = item.path === "/my-matches" && hasUpcoming;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                      {showDot && <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <>
                    <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${location.pathname === "/admin/users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                      <Users className="w-5 h-5" /> Usuarios (Admin)
                    </Link>
                    <Link to="/admin/courts" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${location.pathname === "/admin/courts" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                      <MapPin className="w-5 h-5" /> Canchas (Admin)
                    </Link>
                  </>
                )}
                <button
                  onClick={() => base44.auth.logout()}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
                >
                  <LogOut className="w-5 h-5" /> Cerrar Sesión
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <TodayMatchBanner />

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}