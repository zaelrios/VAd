import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { UserPlus, X } from "lucide-react";

export default function GuestGate({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-8 text-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">¡Únete a la comunidad!</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Crea tu cuenta en segundos para participar en la comunidad.
        </p>
        <Button
          className="w-full py-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base"
          onClick={() => base44.auth.redirectToLogin()}
        >
          Entrar / Registrarse
        </Button>
      </div>
    </div>
  );
}