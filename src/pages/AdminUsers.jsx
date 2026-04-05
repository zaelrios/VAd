import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, ShieldAlert, Loader2, Pencil, Phone, Mail, Trophy, Star, Ban, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const TIER_COLORS = { free: "secondary", premium: "default", pro: "outline" };
const LEVEL_LABELS = { principiante: "Principiante", intermedio: "Intermedio", avanzado: "Avanzado", profesional: "Profesional" };

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      players.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.user_email?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
      )
    );
  }, [search, players]);

  const loadData = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const data = await base44.entities.Player.list("-created_date", 200);
    setPlayers(data);
    setFiltered(data);
    setLoading(false);
  };

  const handleBlock = async (player) => {
    const newBlocked = !player.is_blocked;
    await base44.entities.Player.update(player.id, { is_blocked: newBlocked });
    toast.success(newBlocked ? "Usuario bloqueado" : "Usuario desbloqueado");
    await loadData();
  };

  const handleDelete = async (player) => {
    if (!confirm(`¿Eliminar permanentemente a ${player.full_name}? Esta acción no se puede deshacer.`)) return;
    await base44.entities.Player.delete(player.id);
    toast.success("Usuario eliminado");
    await loadData();
  };

  const openEdit = (player) => {
    setEditingPlayer(player);
    setEditForm({
      full_name: player.full_name || "",
      phone: player.phone || "",
      gender: player.gender || "",
      skill_level: player.skill_level || "",
      preferred_play_style: player.preferred_play_style || "",
      subscription_tier: player.subscription_tier || "free",
    });
  };

  const handleSave = async () => {
    if (!editForm.full_name) { toast.error("El nombre es obligatorio"); return; }
    if (editForm.phone) {
      const cleaned = editForm.phone.replace(/\D/g, "");
      if (cleaned.length < 10 || cleaned.length > 13) {
        toast.error("El teléfono debe tener entre 10 y 13 dígitos");
        return;
      }
      const existing = await base44.entities.Player.filter({ phone: editForm.phone });
      const duplicate = existing.find((p) => p.id !== editingPlayer.id);
      if (duplicate) {
        toast.error("Este número ya está registrado por otro jugador");
        return;
      }
    }
    setSaving(true);
    await base44.entities.Player.update(editingPlayer.id, editForm);
    toast.success("Jugador actualizado");
    setEditingPlayer(null);
    await loadData();
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (user?.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold mb-3">Acceso restringido</h2>
        <p className="text-muted-foreground">Solo los administradores pueden ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">Administrar Usuarios</h1>
            <p className="text-muted-foreground">{players.length} jugadores registrados</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: players.length, icon: Users, color: "text-primary" },
            { label: "Free", value: players.filter((p) => (p.subscription_tier || "free") === "free").length, icon: Users, color: "text-muted-foreground" },
            { label: "Premium", value: players.filter((p) => p.subscription_tier === "premium").length, icon: Star, color: "text-primary" },
            { label: "Pro", value: players.filter((p) => p.subscription_tier === "pro").length, icon: Trophy, color: "text-secondary" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jugador</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Teléfono</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Nivel</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Partidos</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {p.user_email}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {p.phone ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" /> {p.phone}
                          </span>
                        ) : (
                          <span className="text-destructive text-xs">Sin teléfono</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell capitalize">
                        {LEVEL_LABELS[p.skill_level] || p.skill_level}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={TIER_COLORS[p.subscription_tier || "free"]} className="capitalize">
                          {p.subscription_tier || "free"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {p.matches_played || 0} / {p.matches_won || 0}W
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Editar">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleBlock(p)} title={p.is_blocked ? "Desbloquear" : "Bloquear"} className={p.is_blocked ? "text-orange-500" : "text-muted-foreground"}>
                            <Ban className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} title="Eliminar" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        No se encontraron jugadores
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit dialog */}
      <Dialog open={!!editingPlayer} onOpenChange={(v) => !v && setEditingPlayer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Jugador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={editForm.full_name || ""} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono (WhatsApp)</Label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+52 55 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={editForm.gender || ""} onValueChange={(v) => setEditForm({ ...editForm, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hombre">Hombre</SelectItem>
                  <SelectItem value="mujer">Mujer</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={editForm.skill_level || ""} onValueChange={(v) => setEditForm({ ...editForm, skill_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="principiante">Principiante</SelectItem>
                  <SelectItem value="intermedio">Intermedio</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estilo de juego</Label>
              <Select value={editForm.preferred_play_style || ""} onValueChange={(v) => setEditForm({ ...editForm, preferred_play_style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">Singles</SelectItem>
                  <SelectItem value="dobles">Dobles</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan de suscripción</Label>
              <Select value={editForm.subscription_tier || "free"} onValueChange={(v) => setEditForm({ ...editForm, subscription_tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}