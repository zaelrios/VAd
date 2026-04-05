import { useState } from "react";
import { base44 } from "@/api/base44Client";
import ReportMatchModal from "@/components/ReportMatchModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, XCircle, CheckCircle2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STATUS_LABELS = {
  programado: { label: "Programado", variant: "default" },
  en_curso: { label: "En curso", variant: "default" },
  pendiente_resultado: { label: "Pendiente resultado", variant: "secondary" },
  completado: { label: "Completado", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  en_disputa: { label: "En disputa", variant: "destructive" },
};

export default function MatchCard({ match, user, onUpdate }) {
  const [showReport, setShowReport] = useState(false);
  const opponent = match.player1_email === user?.email ? match.player2_name : match.player1_name;
  const opponentEmail = match.player1_email === user?.email ? match.player2_email : match.player1_email;
  const isPlayer1 = match.player1_email === user?.email;
  const myCheckin = isPlayer1 ? match.player1_checkin : match.player2_checkin;

  // Is it time to register result? Match datetime has passed.
  const isMatchTime = (() => {
    const startTime = match.time?.split(" ")[0];
    if (!match.date || !startTime) return false;
    const matchDt = new Date(`${match.date}T${startTime}:00`);
    return new Date() >= matchDt;
  })();

  // Check if within 15 min before match start
  const canCheckin = (() => {
    if (match.status !== "programado" || myCheckin) return false;
    const startTime = match.time?.split(" ")[0];
    if (!match.date || !startTime) return false;
    const matchDt = new Date(`${match.date}T${startTime}:00`);
    const now = new Date();
    const diff = (matchDt - now) / 60000;
    return diff >= 0 && diff <= 15;
  })();

  const handleCheckin = async () => {
    const field = isPlayer1 ? "player1_checkin" : "player2_checkin";
    await base44.entities.Match.update(match.id, { [field]: true });
    toast.success("✅ ¡Check-in registrado! Tu confianza está protegida.");
    onUpdate?.();
  };

  const statusInfo = STATUS_LABELS[match.status] || STATUS_LABELS.programado;

  const handleCancel = async () => {
    await base44.entities.Match.update(match.id, { status: "cancelado" });
    toast.success("Partido cancelado");
    onUpdate?.();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
            <h3 className="font-semibold text-foreground">vs <Link to={`/player-profile?email=${encodeURIComponent(opponentEmail)}`} className="hover:text-primary hover:underline transition-colors">{opponent}</Link></h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs capitalize">{match.skill_level}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{match.play_style}</Badge>
              </div>
            </div>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {match.date}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {match.time}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {match.court_name || "Por definir"}
          </div>
        </div>

        {match.score && (
          <div className="mt-3 pt-3 border-t">
            <span className="text-sm font-medium">Marcador: {match.score}</span>
          </div>
        )}

        {showReport && user && (
          <ReportMatchModal
            match={match}
            currentUser={user}
            onClose={() => setShowReport(false)}
            onDone={onUpdate}
          />
        )}

        {(match.status === "programado" || match.status === "en_curso") && onUpdate && (
          <div className="mt-4 pt-3 border-t flex items-center gap-3 flex-wrap">
            {isMatchTime ? (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white border-primary"
                onClick={() => setShowReport(true)}
              >
                <Trophy className="w-4 h-4 mr-1" />
                Registrar Resultado
              </Button>
            ) : (
              <>
                {canCheckin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/40 hover:bg-primary/5"
                    onClick={handleCheckin}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Ya estoy en la cancha
                  </Button>
                )}
                {myCheckin && (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Check-in confirmado
                  </span>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive ml-auto"
              onClick={handleCancel}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}

        {match.status === "pendiente_resultado" && (
          <div className="mt-3 pt-3 border-t">
            <span className="text-xs text-muted-foreground">⏳ Esperando confirmación del rival</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}