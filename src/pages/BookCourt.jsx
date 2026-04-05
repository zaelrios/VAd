import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, CreditCard, CheckCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";
import GuestGate from "@/components/GuestGate";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const TIME_OPTIONS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];
const COURT_PRICE = 150; // price per hour in pesos

function rangesOverlap(s1, e1, s2, e2) {
  return s1 < e2 && e1 > s2;
}

export default function BookCourt() {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [courts, setCourts] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuestGate, setShowGuestGate] = useState(false);
  const [step, setStep] = useState("form"); // form | payment | success
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ court_id: "", date: "", time_start: "", time_end: "" });
  const [paymentForm, setPaymentForm] = useState({ card: "", expiry: "", cvv: "", name: "" });
  const [pendingBookingData, setPendingBookingData] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const courtsData = await base44.entities.Court.filter({ is_available: true });
    setCourts(courtsData);
    const auth = await base44.auth.isAuthenticated();
    if (!auth) { setLoading(false); return; }
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const [players, bookings] = await Promise.all([
      base44.entities.Player.filter({ user_email: currentUser.email }),
      base44.entities.CourtBooking.filter({ user_email: currentUser.email, status: "confirmada" }),
    ]);
    if (players.length > 0) setPlayer(players[0]);
    setMyBookings(bookings);
    setLoading(false);
  };

  const handleFormSubmit = async () => {
    if (!form.court_id || !form.date || !form.time_start || !form.time_end) {
      toast.error("Completa todos los campos");
      return;
    }
    if (form.time_start >= form.time_end) {
      toast.error("La hora fin debe ser mayor a la de inicio");
      return;
    }

    // Check user doesn't have overlapping bookings
    const overlapping = myBookings.find(
      (b) => b.date === form.date && rangesOverlap(form.time_start, form.time_end, b.time_start, b.time_end)
    );
    if (overlapping) {
      toast.error(`Ya tienes una reserva ese día de ${overlapping.time_start} a ${overlapping.time_end}`);
      return;
    }

    // Check court availability (no other booking in that slot)
    const courtBookings = await base44.entities.CourtBooking.filter({
      court_id: form.court_id,
      date: form.date,
      status: "confirmada",
    });
    const courtConflict = courtBookings.find((b) =>
      rangesOverlap(form.time_start, form.time_end, b.time_start, b.time_end)
    );
    if (courtConflict) {
      toast.error(`La cancha no está disponible de ${courtConflict.time_start} a ${courtConflict.time_end}`);
      return;
    }

    const court = courts.find((c) => c.id === form.court_id);
    const hours = (parseInt(form.time_end) - parseInt(form.time_start));
    const amount = COURT_PRICE * Math.max(1, hours);
    setPendingBookingData({ ...form, court_name: court?.name, amount });
    setStep("payment");
  };

  const handlePayment = async () => {
    if (!paymentForm.card || !paymentForm.expiry || !paymentForm.cvv || !paymentForm.name) {
      toast.error("Completa los datos de pago");
      return;
    }
    if (paymentForm.card.replace(/\s/g, "").length < 16) {
      toast.error("Número de tarjeta inválido");
      return;
    }
    setSubmitting(true);
    await base44.entities.CourtBooking.create({
      user_email: user.email,
      player_name: player?.full_name || user.full_name,
      court_id: pendingBookingData.court_id,
      court_name: pendingBookingData.court_name,
      date: pendingBookingData.date,
      time_start: pendingBookingData.time_start,
      time_end: pendingBookingData.time_end,
      status: "confirmada",
      payment_status: "pagado",
      amount_paid: pendingBookingData.amount,
    });
    setStep("success");
    setSubmitting(false);
    await loadData();
  };

  const cancelBooking = async (id) => {
    await base44.entities.CourtBooking.update(id, { status: "cancelada" });
    toast.success("Reserva cancelada");
    await loadData();
  };

  const today = new Date().toISOString().split("T")[0];
  const advanceDays = { free: 7, premium: 14, pro: 28 };
  const tierDays = advanceDays[player?.subscription_tier || "free"];
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + tierDays);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 md:pb-8">
      {showGuestGate && <GuestGate onClose={() => setShowGuestGate(false)} />}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Reservar Cancha</h1>
          <p className="text-muted-foreground">Practica en solitario — reserva y paga para confirmar tu lugar</p>
        </div>

        {/* My active bookings */}
        {myBookings.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mis Reservas Activas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-card rounded-xl border">
                  <div className="text-sm">
                    <div className="font-medium">{b.court_name}</div>
                    <div className="text-muted-foreground">{b.date} · {b.time_start} – {b.time_end}</div>
                    <Badge variant="secondary" className="mt-1 text-xs">Pagado ${b.amount_paid}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => cancelBooking(b.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Selecciona Cancha y Horario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Cancha *</Label>
                    <Select value={form.court_id} onValueChange={(v) => setForm({ ...form, court_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Elige una cancha" /></SelectTrigger>
                      <SelectContent>
                        {courts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name} — {c.location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" />Fecha *</Label>
                    <Input type="date" min={today} max={maxDate} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  <p className="text-xs text-muted-foreground">
                    Plan <span className="capitalize font-medium">{player?.subscription_tier || "free"}</span>: hasta {tierDays} días de antelación.
                    {player?.subscription_tier !== "pro" && <> <a href="/plans" className="text-primary underline">Mejora tu plan</a> para más días.</>}
                  </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Clock className="w-4 h-4" />Rango de horario *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Desde</p>
                        <Select value={form.time_start} onValueChange={(v) => setForm({ ...form, time_start: v, time_end: "" })}>
                          <SelectTrigger><SelectValue placeholder="Inicio" /></SelectTrigger>
                          <SelectContent>{TIME_OPTIONS.slice(0, -1).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Hasta</p>
                        <Select value={form.time_end} onValueChange={(v) => setForm({ ...form, time_end: v })} disabled={!form.time_start}>
                          <SelectTrigger><SelectValue placeholder="Fin" /></SelectTrigger>
                          <SelectContent>{TIME_OPTIONS.filter((t) => t > form.time_start).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  {form.time_start && form.time_end && form.time_end > form.time_start && (
                    <div className="bg-muted rounded-xl p-4 text-sm">
                      <span className="font-medium">Total estimado: </span>
                      <span className="text-primary font-bold">${COURT_PRICE} / hora</span>
                      <span className="text-muted-foreground"> — aprox. ${COURT_PRICE * Math.max(1, parseInt(form.time_end) - parseInt(form.time_start))} MXN</span>
                    </div>
                  )}
                  <Button onClick={() => !user ? setShowGuestGate(true) : handleFormSubmit()} className="w-full py-6 rounded-xl text-base">
                    Continuar al Pago <CreditCard className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Pago de Reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="bg-muted rounded-xl p-4 text-sm space-y-1">
                    <div><span className="font-medium">Cancha:</span> {pendingBookingData?.court_name}</div>
                    <div><span className="font-medium">Fecha:</span> {pendingBookingData?.date}</div>
                    <div><span className="font-medium">Horario:</span> {pendingBookingData?.time_start} – {pendingBookingData?.time_end}</div>
                    <div className="text-lg font-bold text-primary mt-2">Total: ${pendingBookingData?.amount} MXN</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre en la tarjeta</Label>
                    <Input value={paymentForm.name} onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })} placeholder="Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <Label>Número de tarjeta</Label>
                    <Input
                      value={paymentForm.card}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                        const formatted = v.match(/.{1,4}/g)?.join(" ") || v;
                        setPaymentForm({ ...paymentForm, card: formatted });
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Vencimiento</Label>
                      <Input
                        value={paymentForm.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                          setPaymentForm({ ...paymentForm, expiry: v });
                        }}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input value={paymentForm.cvv} onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" maxLength={4} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">🔒 Pago simulado — no se realizará ningún cargo real</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep("form")} className="flex-1 py-6 rounded-xl">Regresar</Button>
                    <Button onClick={handlePayment} disabled={submitting} className="flex-1 py-6 rounded-xl">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                      {submitting ? "Procesando..." : "Confirmar Pago"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-3">¡Reserva Confirmada!</h2>
              <p className="text-muted-foreground mb-8">Tu cancha está apartada. ¡A practicar!</p>
              <Button onClick={() => { setStep("form"); setForm({ court_id: "", date: "", time_start: "", time_end: "" }); setPaymentForm({ card: "", expiry: "", cvv: "", name: "" }); }} className="rounded-xl px-8">
                Nueva Reserva
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}