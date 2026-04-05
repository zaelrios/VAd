import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Lock, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function TrustStars({ value = 5 }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= rounded ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{(value ?? 5).toFixed(1)}</span>
    </div>
  );
}

function PlayerRow({ player, rank, isMe }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03 }}
    >
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? "border-primary bg-primary/5" : "bg-card"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
          rank === 1 ? "bg-yellow-400 text-yellow-900" :
          rank === 2 ? "bg-slate-300 text-slate-700" :
          rank === 3 ? "bg-amber-600 text-white" :
          "bg-muted text-muted-foreground"
        }`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm truncate">{player.full_name}</span>
            {isMe && <Badge className="text-[10px] py-0 px-1.5">Tú</Badge>}
            {player.subscription_tier === "pro" && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">✓ Verificado</Badge>
            )}
          </div>
          <TrustStars value={player.trust_stars ?? 5} />
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-primary text-sm">{player.elo_rating ?? 1000} ELO</div>
          <div className="text-[10px] text-muted-foreground capitalize">{player.skill_level}</div>
        </div>
      </div>
    </motion.div>
  );
}

const MOCK_PLAYERS = [
  { id: 'm1', full_name: 'Sergio R.', elo_rating: 1420, trust_stars: 4.8, skill_level: 'avanzado', gender: 'hombre', matches_played: 12, subscription_tier: 'premium' },
  { id: 'm2', full_name: 'Laura M.', elo_rating: 1310, trust_stars: 5.0, skill_level: 'avanzado', gender: 'mujer', matches_played: 8, subscription_tier: 'pro' },
  { id: 'm3', full_name: 'Carlos P.', elo_rating: 1180, trust_stars: 4.2, skill_level: 'intermedio', gender: 'hombre', matches_played: 6, subscription_tier: 'free' },
  { id: 'm4', full_name: 'Ana G.', elo_rating: 1050, trust_stars: 4.9, skill_level: 'intermedio', gender: 'mujer', matches_played: 4, subscription_tier: 'free' },
  { id: 'm5', full_name: 'Miguel T.', elo_rating: 980, trust_stars: 3.8, skill_level: 'principiante', gender: 'hombre', matches_played: 5, subscription_tier: 'free' },
];

export default function Leaderboard() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const authenticated = await base44.auth.isAuthenticated();
    if (!authenticated) {
      setAllPlayers(MOCK_PLAYERS);
      setIsGuest(true);
      setLoading(false);
      return;
    }
    const user = await base44.auth.me();
    const [players, myPlayers] = await Promise.all([
      base44.entities.Player.list("-elo_rating", 200),
      base44.entities.Player.filter({ user_email: user.email }),
    ]);
    setAllPlayers(players);
    if (myPlayers.length > 0) setCurrentPlayer(myPlayers[0]);
    setLoading(false);
  };

  const canSeeFullLeaderboard = ["premium", "pro"].includes(currentPlayer?.subscription_tier);
  const myMatchesPlayed = currentPlayer?.matches_played || 0;
  const inCalibration = myMatchesPlayed < 3;

  // Only players with >= 3 matches appear in ranking
  const rankedPlayers = allPlayers.filter((p) => (p.matches_played || 0) >= 3);

  const renderList = (list) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12">
          <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Aún no hay jugadores en este ranking</p>
        </div>
      );
    }

    const myPosition = list.findIndex((p) => p.user_email === currentPlayer?.user_email);
    const visibleList = canSeeFullLeaderboard ? list : list.slice(0, 3);

    return (
      <div className="space-y-2">
        {visibleList.map((player, idx) => (
          <PlayerRow
            key={player.id}
            player={player}
            rank={idx + 1}
            isMe={player.user_email === currentPlayer?.user_email}
          />
        ))}

        {!canSeeFullLeaderboard && list.length > 3 && (
          <div className="mt-4 p-4 rounded-xl border border-dashed text-center space-y-2">
            <Lock className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Ver el Top 100 completo</p>
            <Link to="/plans">
              <Badge className="cursor-pointer hover:opacity-80 transition-opacity">
                Suscribirse a Premium — $99 MXN/mes
              </Badge>
            </Link>
          </div>
        )}

        {!canSeeFullLeaderboard && myPosition > 2 && currentPlayer && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground text-center mb-1">Tu posición</div>
            <PlayerRow player={currentPlayer} rank={myPosition + 1} isMe={true} />
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const general = rankedPlayers;
  const varonil = rankedPlayers.filter((p) => p.gender === "hombre");
  const femenil = rankedPlayers.filter((p) => p.gender === "mujer");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-7 h-7 text-primary" />
            <h1 className="font-display text-3xl font-bold">Ranking ELO</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {canSeeFullLeaderboard
              ? "Top 100 jugadores ordenados por Rating ELO"
              : "Solo tu posición — activa Premium para ver el Top 100"}
          </p>
        </div>

        {inCalibration && currentPlayer && (
          <div className="mb-5 p-4 bg-secondary/10 rounded-xl border border-secondary/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Fase de Calibración</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Necesitas {3 - myMatchesPlayed} partido(s) más para aparecer en el ranking público. Tu ELO ya está siendo calculado.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="general">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="varonil" className="flex-1">Varonil</TabsTrigger>
            <TabsTrigger value="femenil" className="flex-1">Femenil</TabsTrigger>
          </TabsList>
          <TabsContent value="general">{renderList(general)}</TabsContent>
          <TabsContent value="varonil">{renderList(varonil)}</TabsContent>
          <TabsContent value="femenil">{renderList(femenil)}</TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}