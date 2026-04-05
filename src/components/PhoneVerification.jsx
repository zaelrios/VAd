import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

// Simulated verification - generates a fake 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function PhoneVerification({ phone, onVerified }) {
  const [step, setStep] = useState("send"); // send | verify
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulate delay
    const generated = generateCode();
    setSentCode(generated);
    setSending(false);
    setStep("verify");
    // In production this would be sent via SMS/WhatsApp
    toast.info(`Código simulado: ${generated}`, { duration: 30000, description: "En producción llegaría por WhatsApp/SMS" });
  };

  const handleVerify = async () => {
    if (input.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 800));
    if (input === sentCode) {
      toast.success("¡Teléfono verificado!");
      onVerified();
    } else {
      toast.error("Código incorrecto, intenta de nuevo");
    }
    setVerifying(false);
  };

  return (
    <div className="border rounded-xl p-4 bg-muted/40 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageCircle className="w-4 h-4 text-primary" />
        Verificar número: <span className="text-primary">{phone}</span>
      </div>

      {step === "send" && (
        <Button onClick={handleSend} disabled={sending} variant="outline" size="sm" className="w-full">
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
          {sending ? "Enviando código..." : "Enviar código por WhatsApp/SMS"}
        </Button>
      )}

      {step === "verify" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Ingresa el código de 6 dígitos que recibiste</Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
            />
            <Button onClick={handleVerify} disabled={verifying || input.length !== 6}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
            </Button>
          </div>
          <button
            onClick={() => { setStep("send"); setInput(""); }}
            className="text-xs text-muted-foreground hover:text-primary underline"
          >
            Reenviar código
          </button>
        </div>
      )}
    </div>
  );
}