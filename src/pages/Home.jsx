import { Link } from "react-router-dom";
import { Link } from "react-router-dom";
import { Search, Trophy, ArrowRight, Star, TrendingUp, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const features = [
  {
    icon: Search,
    title: "Busca Partido",
    description: "Matchmaking por nivel, género y disponibilidad",
  },
  {
    icon: TrendingUp,
    title: "Ranking ELO",
    description: "Sistema de rating basado en probabilidad de victoria",
  },
  {
    icon: Star,
    title: "Sistema de Confianza",
    description: "5 estrellas por asistencia. Sin No-Shows.",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Rankings General, Varonil y Femenil segmentados",
  },
];

export default function Home() {
  const [player, setPlayer] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [todayMatch, setTodayMatch] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authenticated) => {
      if (!authenticated) {
        setIsLoggedIn(false);
        setLoadingUser(false);
        return;
      }
      setIsLoggedIn(true);
      const u = await base44.auth.me();
      const [players, allMatches] = await Promise.all([
        base44.entities.Player.filter({ user_email: u.email }),
        base44.entities.Match.list("-created_date", 50),
      ]);
      setPlayer(players[0] || null);
      const today = new Date().toISOString().split("T")[0];
      const mine = allMatches.find(
        (m) => (m.player1_email === u.email || m.player2_email === u.email)
          && m.status === "programado"
          && m.date === today
      );
      setTodayMatch(mine || null);
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, []);

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4 tracking-wide">
              <Star className="w-4 h-4" />
              VAd: Ventaja Adentro
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Tu juego, tu nivel,<br />tu comunidad.
              <span className="block text-primary text-xl sm:text-2xl md:text-3xl mt-3 font-medium">La app para encontrar pareja de tenis y subir en el ranking</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Matchmaking por ELO y género, ranking de confianza y reservas inteligentes. La comunidad de tenis que premia a los que sí aparecen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!loadingUser && (
                isLoggedIn && player ? (
                  <>
                    <Link to="/find-match">
                      <Button size="lg" className="text-base px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all">
                        Buscar Partido
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0">
                        <User className="w-5 h-5 mr-2" /> Mi Perfil
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      className="inline-flex items-center text-base px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium shadow-lg transition-all"
                    >
                      Buscar Partido
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      className="inline-flex items-center text-base px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg transition-all"
                    >
                      Entrar / Registrarse
                    </button>
                  </>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">
            El sistema VAd
          </h2>
          <p className="text-muted-foreground text-lg">
            Competencia real. Reputación real.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            ¿Listo para jugar?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Únete a la comunidad de tenistas y encuentra tu próximo rival ahora mismo.
          </p>
          <Link to="/find-match">
            <Button size="lg" variant="secondary" className="text-base px-8 py-6 rounded-xl font-semibold">
              Comenzar Ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
