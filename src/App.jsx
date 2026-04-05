import React, { useState } from 'react'

export default function App() {
  const [nombre, setNombre] = useState("");

  return (
    <div className="min-h-screen bg-white text-[#0A193F] font-sans antialiased relative overflow-x-hidden">
      {/* Fondo con degradado sutil de tenis */}
      <div className="absolute inset-0 z-0 opacity-5 blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(circle at 80% 20%, #00E676 0%, #1565C0 100%)"
        }}
      />

      {/* NAVBAR */}
      <nav className="relative z-10 flex justify-between items-center px-10 py-8 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tighter">
          VAd<span className="text-[#00E676]">.</span>
        </div>
        <div className="hidden md:flex gap-10 text-sm font-semibold text-slate-500">
          <a href="#" className="hover:text-[#1565C0] transition-colors">Ranking</a>
          <a href="#" className="hover:text-[#1565C0] transition-colors">Torneos</a>
          <a href="#" className="hover:text-[#1565C0] transition-colors">CART</a>
        </div>
        <button className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          Entrar
        </button>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 grid md:grid-cols-2 gap-20 items-center px-10 pt-16 pb-32 max-w-7xl mx-auto">
        
        {/* Lado Izquierdo: El Gancho */}
        <div className="max-w-xl">
          <h1 className="text-7xl font-black tracking-tighter leading-[0.9] mb-8">
            Tu ventaja <br />
            <span className="bg-gradient-to-r from-[#1565C0] to-[#00E676] bg-clip-text text-transparent italic">
              adentro.
            </span>
          </h1>
          <p className="text-slate-500 text-xl font-light leading-relaxed mb-10">
            La plataforma de gestión y ranking ELO para la comunidad de tenis en Rosarito. Registra tus partidos y escala niveles.
          </p>
          <div className="flex gap-4">
            <button className="px-10 py-5 bg-[#00E676] text-slate-950 font-black rounded-2xl shadow-xl shadow-[#00E676]/20 hover:-translate-y-1 transition-all">
              REGISTRARSE
            </button>
            <button className="px-10 py-5 bg-[#1565C0] text-white font-black rounded-2xl shadow-xl shadow-[#1565C0]/20 hover:-translate-y-1 transition-all">
              RANKING
            </button>
          </div>
        </div>

        {/* Lado Derecho: Preview del Perfil (Estilo Base44) */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00E676] to-[#1565C0] rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-white border border-slate-100 p-10 rounded-[2rem] shadow-2xl">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl font-bold text-slate-400">
                ?
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Nuevo Jugador</h3>
                <p className="text-slate-400 text-sm tracking-wide uppercase font-bold">Pendiente de ELO</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="h-14 w-full bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center px-4 text-slate-400 text-sm font-medium">
                Próximo partido no programado...
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Victorias</p>
                  <p className="text-xl font-black text-[#1565C0]">0</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fuerza</p>
                  <p className="text-xl font-black text-[#00E676]">--</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER SIMPLE */}
      <footer className="relative z-10 px-10 py-12 border-t border-slate-100 flex justify-between items-center max-w-7xl mx-auto text-slate-400 text-xs font-bold uppercase tracking-widest">
        <div>© 2026 VAd ROSARITO</div>
        <div className="flex gap-6">
          <span>Términos</span>
          <span>Privacidad</span>
        </div>
      </footer>
    </div>
  )
}
