import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Star, Zap, Crown, Lock, Trophy, Calendar, BarChart2, Award, ShieldCheck, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    color: "border-border",
    badge: null,
    icon: Users,
    description: "Empieza a competir en VAd",
    booking_label: "1 semana de antelación",
    features: [
      { text: "Perfil de jugador + ELO Rating", included: true },
      { text: "Matchmaking automático por nivel y género", included: true },
      { text: "Reserva con 1 semana de antelación", included: true },
      { text: "Tu posición propia en el ranking", included: true },
      { text: "Estadísticas básicas (W/L)", included: true },
      { text: "Leaderboard completo Top 100", included: false },
      { text: "Reserva con 2+ semanas de antelación", included: false },
      { text: "Historial de rivalidades 1 vs 1", included: false },
      { text: "Badge Jugador Verificado", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 99,
    color: "border-primary",
    badge: "Más popular",
    icon: Zap,
    description: "Para el jugador que quiere competir en serio",
    booking_label: "2 semanas de antelación",
    features: [
      { text: "Todo lo de Free", included: true },
      { text: "Reserva con 2 semanas de antelación", included: true },
      { text: "Leaderboard completo (Top 100)", included: true },
      { text: "Filtros por nivel y género", included: true },
      { text: "Estadísticas avanzadas de partidos", included: true },
      { text: "Préstamo de Pelotas en clubes aliados", included: false },
      { text: "Historial de rivalidades 1 vs 1", included: false },
      { text: "Badge Jugador Verificado", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 249,
    color: "border-secondary",
    badge: "Prioridad Total",
    icon: Crown,
    description: "El nivel máximo de la comunidad VAd",
    booking_label: "4 semanas de antelación",
    features: [
      { text: "Todo lo de Premium", included: true },
      { text: "Reserva con 4 semanas de antelación", included: true },
      { text: "Préstamo de Pelotas en clubes aliados", included: true },
      { text: "Historial de Rivalidades 1 vs 1", included: true },
      { text: "Badge 'Jugador Verificado' en perfil", included: true },
      { text: "Acceso prioritario a torneos exclusivos", included: true },
      { text: "Soporte prioritario VAd", included: true },
    ],
  },
];

const VAD_FEATURES = [
  { icon: BarChart2, title: "Ranking ELO", description: "Sistema de rating basado en probabilidad de victoria según el nivel del oponente." },
  { icon: Award, title: "Sistema de Confianza", description: "5 estrellas basadas en asistencia. Un No-Show = 1.0 estrella. Recupérate con rachas consecutivas." },
  { icon: Calendar, title: "Reservas por Tier", description: "Mayor suscripción = más días de antelación. Hasta 4 semanas para usuarios Pro." },
  { icon: Trophy, title: "Leaderboards Segmentados", description: "Rankings General, Varonil y Femenil. Visible completo para Premium y Pro." },
];

export default function Plans() {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const authenticated = await base44.auth.isAuthenticated();
    if (!authenticated) { setLoading(false); return; }
    const user = await base44.auth.me();
    const players = await base44.entities.Player.filter({ user_email: user.email });
    if (players.length > 0) setPlayer(players[0]);
    setLoading(false);
  };

  const handleUpgrade = async (planId) => {
    if (!player) { toast.error("Primero crea tu perfil de jugador"); return; }
    setUpgrading(planId);
    await base44.entities.Player.update(player.id, { subscription_tier: planId });
    setPlayer({ ...player, subscription_tier: planId });
    const msgs = {
      free: "Has vuelto al plan Free",
      premium: "🎾 ¡Bienvenido a Premium!",
      pro: "👑 ¡Bienvenido a Pro! Prioridad Total activada.",
    };
    toast.success(msgs[planId]);
    setUpgrading(null);
  };

  const currentTier = player?.subscription_tier || "free";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 pb-28 md:pb-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-0 px-4 py-1.5 text-sm">
            <Star className="w-3.5 h-3.5 mr-1.5" /> Planes VAd
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Elige tu <span className="text-primary">nivel de juego</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Más plan = más ventajas en cancha. Sin contratos, cancela cuando quieras.
          </p>
          {currentTier !== "free" && (
            <Badge variant="secondary" className="mt-4 capitalize">Plan actual: {currentTier}</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.id;
            const isPopular = plan.badge === "Más popular";
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`relative border-2 h-full flex flex-col ${plan.color} ${isPopular ? "shadow-xl shadow-primary/10" : ""}`}>
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold ${
                      isPopular ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {plan.badge}
                    </div>
                  )}
                  <CardHeader className="pb-4 pt-8">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isPopular ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`w-6 h-6 ${isPopular ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <h2 className="font-display text-2xl font-bold">{plan.name}</h2>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                    <div className="mt-4">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold">Gratis</span>
                      ) : (
                        <div>
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground text-sm ml-1">MXN/mes</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5 w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      {plan.booking_label}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className={`flex items-start gap-2.5 text-sm ${f.included ? "text-foreground" : "text-muted-foreground"}`}>
                          {f.included ? (
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <Lock className="w-4 h-4 shrink-0 mt-0.5 opacity-40" />
                          )}
                          <span className={!f.included ? "opacity-50" : ""}>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>Plan actual</Button>
                    ) : plan.id === "free" ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={!!upgrading}
                      >
                        {upgrading === plan.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Cambiar a Free
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Próximamente
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="mb-12">
          <h2 className="font-display text-2xl font-bold text-center mb-8">El sistema VAd</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VAD_FEATURES.map((feat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 p-5 bg-card rounded-2xl border hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-muted rounded-2xl p-6 md:p-8 text-center">
          <h3 className="font-semibold text-lg mb-2">Sin contratos. Cancela cuando quieras.</h3>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Tu ELO y tu rating de Confianza se mantienen independientemente de tu plan. Tu reputación es tuya.
          </p>
        </div>
      </motion.div>
    </div>
  );
}