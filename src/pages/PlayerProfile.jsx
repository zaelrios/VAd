import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Target, TrendingUp, Star, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const LEVEL_LABELS = { principiante: "Principiante", intermedio: "Intermedio", avanzado: "Avanzado", profesional: "Profesional" };

export default function PlayerProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    base44.entities.Player.filter({ user_email: email })
      .then((data) => setPlayer(data[0] || null))
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!player) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
      <h2 className="font-display text-2xl font-bold mb-3">Jugador no encontrado</h2>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.full_name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{player.full_name}</h1>
            <Badge variant="secondary" className="capitalize mt-1">{LEVEL_LABELS[player.skill_level] || player.skill_level}</Badge>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <div>
                <div className="text-lg font-bold">{player.matches_played || 0}</div>
                <div className="text-xs text-muted-foreground">Partidos</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <div>
                <div className="text-lg font-bold">{player.matches_won || 0}</div>
                <div className="text-xs text-muted-foreground">Victorias</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div>
                <div className="text-lg font-bold">{player.elo_rating ?? 1000}</div>
                <div className="text-xs text-muted-foreground">ELO</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <div>
                <div className="text-lg font-bold">{(player.trust_stars ?? 5).toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Confianza</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {player.bio && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground leading-relaxed">{player.bio}</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}