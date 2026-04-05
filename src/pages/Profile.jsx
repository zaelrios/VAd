import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Target, Save, CheckCircle, Loader2, ShieldCheck, Star, TrendingUp } from "lucide-react";
import PhoneVerification from "@/components/PhoneVerification";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SKILL_LEVELS = [
  { value: "principiante", label: "Principiante", description: "Estoy aprendiendo" },
  { value: "intermedio", label: "Intermedio", description: "Juego con regularidad" },
  { value: "avanzado", label: "Avanzado", description: "Nivel competitivo" },
  { value: "profesional", label: "Profesional", description: "Nivel profesional" },
];

const PLAY_STYLES = [
  { value: "singles", label: "Singles" },
  { value: "dobles", label: "Dobles" },
  { value: "ambos", label: "Ambos" },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    gender: "",
    skill_level: "",
    preferred_play_style: "",
    bio: "",
  });
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const authenticated = await base44.auth.isAuthenticated();
    if (!authenticated) {
      // Show sample profile for guests
      setForm({ full_name: 'Jugador Pro', phone: '', gender: 'hombre', skill_level: 'intermedio', preferred_play_style: 'singles', bio: 'Jugador apasionado del tenis. Aquí aparecería tu perfil.' });
      setLoading(false);
      return;
    }
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const players = await base44.entities.Player.filter({ user_email: currentUser.email });
    if (players.length > 0) {
      const p = players[0];
      setPlayer(p);
      setPhoneVerified(!!p.phone_verified);
      setForm({
        full_name: p.full_name || "",
        phone: p.phone || "",
        gender: p.gender || "",
        skill_level: p.skill_level || "",
        preferred_play_style: p.preferred_play_style || "",
        bio: p.bio || "",
      });
    } else {
      setForm((prev) => ({ ...prev, full_name: currentUser.full_name || "" }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.full_name) { toast.error("El nombre es obligatorio"); return; }
    if (!form.skill_level) { toast.error("Selecciona tu nivel de juego"); return; }
    if (!form.preferred_play_style) { toast.error("Selecciona tu estilo de juego"); return; }
    setSaving(true);
    const data = { ...form, user_email: user.email };
    if (!player) data.subscription_tier = "free";
    if (player) {
      await base44.entities.Player.update(player.id, data);
    } else {
      await base44.entities.Player.create(data);
    }
    toast.success(player ? "✅ ¡Perfil actualizado con éxito!" : "✅ ¡Registro completado!");
    setSaving(false);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {player ? "Mi Perfil" : "Registro de Jugador"}
          </h1>
          <p className="text-muted-foreground">
            {player ? "Actualiza tu información y nivel de juego" : "Completa tu perfil para empezar a buscar partidos"}
          </p>
        </div>

        {player && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{player.matches_played || 0} partidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{player.matches_won || 0} victorias</span>
                </div>
                <Badge variant="secondary" className="capitalize">{player.skill_level}</Badge>
                {player.subscription_tier === "pro" && (
                  <Badge className="gap-1"><ShieldCheck className="w-3 h-3" /> Verificado</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{player.elo_rating ?? 1000} ELO</span>
                  {(player.matches_played || 0) < 3 && (
                    <span className="text-xs text-muted-foreground">(calibrando)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(player.trust_stars ?? 5) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{(player.trust_stars ?? 5).toFixed(1)} confianza</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-2">
              <Label>Género</Label>
              <div className="grid grid-cols-3 gap-3">
                {[{ value: "hombre", label: "Hombre" }, { value: "mujer", label: "Mujer" }, { value: "otro", label: "Otro" }].map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setForm({ ...form, gender: g.value })}
                    className={`p-3 rounded-xl border-2 text-center font-medium text-sm transition-all ${
                      form.gender === g.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Teléfono (WhatsApp)</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+52 55 1234 5678"
              />
              <p className="text-xs text-muted-foreground">Opcional. Tu número de WhatsApp para coordinación de partidos.</p>
            </div>

            {/* After calibration (3+ matches) skill level is auto-managed by ELO */}
            {(player?.matches_played || 0) < 3 ? (
              <div className="space-y-2">
                <Label>Nivel de juego * {!(player) && <span className="text-xs text-muted-foreground">(referencia inicial)</span>}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setForm({ ...form, skill_level: level.value })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.skill_level === level.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="font-medium text-sm">{level.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-4 bg-muted rounded-xl">
                <Label>Nivel de juego (automático por ELO)</Label>
                <p className="text-sm font-semibold capitalize">{form.skill_level}</p>
                <p className="text-xs text-muted-foreground">Tu nivel se actualiza automáticamente según tu ELO. No es editable tras la calibración.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Estilo de juego preferido *</Label>
              <Select value={form.preferred_play_style} onValueChange={(v) => setForm({ ...form, preferred_play_style: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estilo" />
                </SelectTrigger>
                <SelectContent>
                  {PLAY_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sobre mí</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Cuéntanos sobre ti como jugador..."
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full py-6 rounded-xl text-base">
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : player ? (
                <Save className="w-5 h-5 mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              {saving ? "Guardando..." : player ? "Actualizar Perfil" : "Completar Registro"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}