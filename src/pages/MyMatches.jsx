import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Clock, MapPin, Loader2, User } from "lucide-react";
import { motion } from "framer-motion";
import MatchCard from "@/components/MatchCard";

export default function MyMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const authenticated = await base44.auth.isAuthenticated();
    if (!authenticated) {
      setLoading(false);
      return;
    }
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const allMatches = await base44.entities.Match.list("-created_date", 100);
    const myMatches = allMatches.filter(
      (m) => m.player1_email === currentUser.email || m.player2_email === currentUser.email
    );
    setMatches(myMatches);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcoming = matches.filter((m) => m.status === "programado" || m.status === "en_curso");
  const completed = matches.filter((m) => m.status === "completado");
  const cancelled = matches.filter((m) => m.status === "cancelado");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Mis Partidos</h1>
          <p className="text-muted-foreground">Historial y próximos partidos</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="upcoming" className="flex-1">
              Próximos ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Completados ({completed.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1">
              Cancelados ({cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <MatchList matches={upcoming} user={user} emptyMessage="No tienes partidos programados" onUpdate={loadMatches} />
          </TabsContent>
          <TabsContent value="completed">
            <MatchList matches={completed} user={user} emptyMessage="Aún no has completado partidos" />
          </TabsContent>
          <TabsContent value="cancelled">
            <MatchList matches={cancelled} user={user} emptyMessage="No hay partidos cancelados" />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function MatchList({ matches, user, emptyMessage, onUpdate }) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match, i) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <MatchCard match={match} user={user} onUpdate={onUpdate} />
        </motion.div>
      ))}
    </div>
  );
}