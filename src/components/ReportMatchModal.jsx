import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trophy, UserX, Calendar, Minus, Plus, Loader2 } from "lucide-react";
import { calculateEloChange, getSkillLevelByElo } from "@/utils/elo";
import { toast } from "sonner";

function SetsCounter({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-muted transition-colors">
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-2xl font-bold w-8 text-center">{value}</span>
        <button onClick={() => onChange(Math.min(3, value + 1))} className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-muted transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ReportMatchModal({ match, currentUser, onClose, onDone }) {
  const [route, setRoute] = useState(null); // 'played' | 'noshow' | 'reschedule'
  const [winnerEmail, setWinnerEmail] = useState(currentUser.email);
  const [mySets, setMySets] = useState(3);
  const [opponentSets, setOpponentSets] = useState(0);
  const [isRetirement, setIsRetirement] = useState(false);
  const [retiredEmail, setRetiredEmail] = useState("");
  const [retirementProgress, setRetirementProgress] = useState(0.6);
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);

  const isPlayer1 = match.player1_email === currentUser.email;
  const opponentEmail = isPlayer1 ? match.player2_email : match.player1_email;
  const opponentName = isPlayer1 ? match.player2_name : match.player1_name;
  const myName = isPlayer1 ? match.player1_name : match.player2_name;

  const handlePlayed = async () => {
    if (winnerEmail === currentUser.email && mySets < 3) {
      toast.error("Si ganaste debes tener 3 sets"); return;
    }
    if (winnerEmail === opponentEmail && opponentSets < 3) {
      toast.error("Si ganó el rival debe tener 3 sets"); return;
    }
    setSaving(true);

    const actualWinnerEmail = winnerEmail;
    const actualLoserEmail = winnerEmail === currentUser.email ? opponentEmail : currentUser.email;
    const winnerSets = winnerEmail === currentUser.email ? mySets : opponentSets;
    const loserSets = winnerEmail === currentUser.email ? opponentSets : mySets;

    // Fetch both players' ratings
    const [winnerPlayers, loserPlayers] = await Promise.all([
      base44.entities.Player.filter({ user_email: actualWinnerEmail }),
      base44.entities.Player.filter({ user_email: actualLoserEmail }),
    ]);
    const winnerPlayer = winnerPlayers[0];
    const loserPlayer = loserPlayers[0];

    if (winnerPlayer && loserPlayer) {
      const { winnerDelta, loserDelta } = calculateEloChange({
        winnerRating: winnerPlayer.elo_rating ?? 1000,
        loserRating: loserPlayer.elo_rating ?? 1000,
        winnerSets,
        loserSets,
        matchType: match.match_type || 'competitivo',
        winnerIsValidator: winnerPlayer.role === 'validator',
        loserIsValidator: loserPlayer.role === 'validator',
        isRetirement,
        retirementProgress,
      });

      const newWinnerElo = (winnerPlayer.elo_rating ?? 1000) + winnerDelta;
      const newLoserElo = Math.max(100, (loserPlayer.elo_rating ?? 1000) + loserDelta);

      // Update ELO + skill_level + matches_played
      await Promise.all([
        base44.entities.Player.update(winnerPlayer.id, {
          elo_rating: newWinnerElo,
          skill_level: getSkillLevelByElo(newWinnerElo),
          matches_played: (winnerPlayer.matches_played || 0) + 1,
          matches_won: (winnerPlayer.matches_won || 0) + 1,
          consecutive_matches: (winnerPlayer.consecutive_matches || 0) + 1,
        }),
        base44.entities.Player.update(loserPlayer.id, {
          elo_rating: newLoserElo,
          skill_level: getSkillLevelByElo(newLoserElo),
          matches_played: (loserPlayer.matches_played || 0) + 1,
          consecutive_matches: (loserPlayer.consecutive_matches || 0) + 1,
        }),
      ]);
    }

    const score = `${winnerEmail === currentUser.email ? mySets : opponentSets}-${winnerEmail === currentUser.email ? opponentSets : mySets}`;
    await base44.entities.Match.update(match.id, {
      status: "pendiente_resultado",
      score,
      winner_email: actualWinnerEmail,
      result_reported_by: currentUser.email,
    });

    toast.success("Resultado reportado. Esperando confirmación del rival.");
    setSaving(false);
    onDone?.();
    onClose();
  };

  const handleNoShow = async () => {
    setSaving(true);
    await base44.entities.Match.update(match.id, {
      status: "pendiente_resultado",
      score: "W.O.",
      winner_email: currentUser.email,
      result_reported_by: currentUser.email,
    });

    // Update trust stars for no-show opponent
    const [opponentPlayers] = await Promise.all([
      base44.entities.Player.filter({ user_email: opponentEmail }),
    ]);
    if (opponentPlayers[0]) {
      const newStars = Math.max(0, (opponentPlayers[0].trust_stars ?? 5) - 1.0);
      await base44.entities.Player.update(opponentPlayers[0].id, { trust_stars: newStars });
    }

    toast.success("No-Show registrado. ELO del rival afectado.");
    setSaving(false);
    onDone?.();
    onClose();
  };

  const handleReschedule = async () => {
    if (!newDate) { toast.error("Elige una nueva fecha"); return; }
    setSaving(true);
    await base44.entities.Match.update(match.id, {
      date: newDate,
      status: "programado",
    });
    toast.success("Partido reprogramado.");
    setSaving(false);
    onDone?.();
    onClose();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Resultado</DialogTitle>
          <p className="text-sm text-muted-foreground">vs {opponentName}</p>
        </DialogHeader>

        {!route && (
          <div className="space-y-3 py-2">
            <button onClick={() => setRoute("played")} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary transition-colors text-left">
              <Trophy className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="font-medium text-sm">Jugamos el partido</div>
                <div className="text-xs text-muted-foreground">Ingresar sets y ganador</div>
              </div>
            </button>
            <button onClick={() => setRoute("noshow")} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-destructive transition-colors text-left">
              <UserX className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <div className="font-medium text-sm">Rival no se presentó</div>
                <div className="text-xs text-muted-foreground">W.O. técnico — afecta confianza del rival</div>
              </div>
            </button>
            <button onClick={() => setRoute("reschedule")} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-secondary transition-colors text-left">
              <Calendar className="w-5 h-5 text-secondary shrink-0" />
              <div>
                <div className="font-medium text-sm">No pudimos jugar</div>
                <div className="text-xs text-muted-foreground">Proponer nueva fecha</div>
              </div>
            </button>
          </div>
        )}

        {route === "played" && (
          <div className="space-y-5 py-2">
            {/* Winner selector */}
            <div className="space-y-2">
              <Label>¿Quién ganó?</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { email: currentUser.email, name: "Yo (" + myName + ")" },
                  { email: opponentEmail, name: opponentName },
                ].map((opt) => (
                  <button key={opt.email} onClick={() => setWinnerEmail(opt.email)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${winnerEmail === opt.email ? "border-primary bg-primary/5" : "border-border"}`}>
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sets */}
            <div>
              <Label className="mb-3 block">Marcador (Sets)</Label>
              <div className="flex items-center justify-around bg-muted rounded-xl p-4">
                <SetsCounter label={myName} value={mySets} onChange={setMySets} />
                <span className="text-2xl font-bold text-muted-foreground">—</span>
                <SetsCounter label={opponentName} value={opponentSets} onChange={setOpponentSets} />
              </div>
            </div>

            {/* Retirement */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <Switch checked={isRetirement} onCheckedChange={setIsRetirement} id="retirement" />
              <Label htmlFor="retirement" className="cursor-pointer">¿Alguien se retiró?</Label>
            </div>
            {isRetirement && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>¿Quién se retiró?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { email: currentUser.email, name: "Yo" },
                      { email: opponentEmail, name: opponentName },
                    ].map((opt) => (
                      <button key={opt.email} onClick={() => setRetiredEmail(opt.email)}
                        className={`p-2 rounded-xl border-2 text-sm transition-colors ${retiredEmail === opt.email ? "border-destructive bg-destructive/5" : "border-border"}`}>
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fracción del partido jugado</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 0.3, l: "< 50% (puntos x0.6)" }, { v: 0.7, l: "> 50% (puntos completos)" }].map((opt) => (
                      <button key={opt.v} onClick={() => setRetirementProgress(opt.v)}
                        className={`p-2 rounded-lg border text-xs transition-colors ${retirementProgress === opt.v ? "border-primary bg-primary/5" : "border-border"}`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRoute(null)} className="flex-1">Atrás</Button>
              <Button onClick={handlePlayed} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {route === "noshow" && (
          <div className="space-y-4 py-2">
            <div className="bg-destructive/5 rounded-xl p-4 text-sm text-destructive">
              Esto registrará un <strong>W.O. técnico</strong>. El rival perderá 1 estrella de confianza. ¿Confirmas?
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRoute(null)} className="flex-1">Atrás</Button>
              <Button variant="destructive" onClick={handleNoShow} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirmar W.O.
              </Button>
            </div>
          </div>
        )}

        {route === "reschedule" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nueva fecha</Label>
              <Input type="date" min={today} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRoute(null)} className="flex-1">Atrás</Button>
              <Button onClick={handleReschedule} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Reprogramar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}