import React, { useState } from 'react'

export default function App() {
  const [nombre, setNombre] = useState("");

  return (
    <div className="min-h-screen bg-white text-[#0A193F] font-sans antialiased">
      {/* Fondo con degradado de "Tenis" (Toque Base44) */}
      <div className="absolute inset-0 z-0 opacity-10 blur-[100px]"
        style={{
          background: "radial-gradient(circle at 70% 30%, #00E676 0%, #1565C0 100%)" // Mezcla de Verde Pelota y Azul Cancha
        }}
      />

      {/* 1. NAVBAR (Limpia y Minimalista) */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-1.5 text-2xl font-black tracking-tighter text-[#0A193F]">
          VAd<span className="text-[#00E676]">.</span>
        </div>
        <div className="flex gap-8 text-sm font-medium text-[#475569]">
          <a href="#" className="hover:text-[#0A193F] transition-colors">Ranking</a>
          <a href="#" className="hover:text-[#0A193F] transition-colors">Retos</a>
          <a href="#" className="hover:text-[#0A193F] transition-colors">Reglas</a>
          <a href="#" className="hover:text-[#0A193F] transition-colors">CART Rosarito</a>
        </div>
        <button className="text-sm font-medium text-[#0A193F] hover:text-[#1565C0]">Iniciar Sesión</button>
      </nav>

      {/* 2. MAIN HERO SECTION */}
      <main className="relative z-10 grid md:grid-cols-2 gap-16 items-center px-8 pt-20 pb-32 max-w-7xl mx-auto">
        
        {/* Columna Izquierda: Texto y CTAs */}
        <div className="text-left">
          <div className="inline-flex items-center gap-1.5 text-[#1565C0] font-medium text-sm mb-6">
            <div className="p-1.5 rounded-full bg-[#1565C0]/5 border border-[#1565C0]/10">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" fill="#1565C0" stroke="#1565C0" strokeWidth="0.5"/>
              </svg>
            </div>
            <span>Rosarito Tennis Tour</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-[#0A193F] mb-6 leading-tight">
            Eleva tu tenis<span className="text-[#00E676]">.</span><br />
            Domina <span className="bg-gradient-to-r from-[#1565C0] to-[#00E676] bg-clip-text text-transparent">CART.</span>
          </div>

          <p className="text-[#475569] text-lg max-w-xl mb-12 font-light leading-relaxed">
            El sistema oficial de ELO y Matchmaking para Rosarito. Encuentra tu nivel, desafía a tus amigos, y escala el ranking oficial.
          </p>

          <div className="flex gap-4">
            <button className="px-8 py-4 bg-[#00E676] text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-[#00E676]/30 active:scale-[0.98]">
              Registrar mi "Fuerza"
            </button>
            <button className="px-8 py-4 bg-[#1565C0] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-[#1565C0]/30 active:scale-[0.98]">
              Ver Ranking ELO
            </button>
          </div>
        </div>

        {/* Columna Derecha: El "VAd Player Card" (Idéntica estructura Base44) */}
        <div className="w-full max-w-lg p-1 rounded-3xl"
          style={{
            background: "linear-gradient(to bottom right, #00E676, #1565C0)" // Borde de degradado Pro
          }}
        >
          <div className="bg-white p-8 rounded-[calc(1.5rem-1px)] text-left shadow-2xl">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-lg">Mi Estado VAd</div>
              <div className="text-xs font-bold text-[#1565C0] uppercase tracking-widest bg-[#1565C0]/5 px-3 py-1 rounded-full">Actualizado</div>
            </div>

            <div className="flex gap-6 items-center mb-10">
              <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-inner flex items-center justify-center text-slate-400 font-bold text-3xl">Z</div>
              <div>
                <div className="text-4xl font-extrabold tracking-tighter text-[#0A193F]">Zael R.</div>
                <div className="text-[#475569] font-light">Rosarito, B.C. <span className="text-slate-300">|</span> Club CART</div>
              </div>
              <div className="ml-auto flex items-center gap-2 p-3 bg-[#00E676]/5 rounded-xl border border-[#00E676]/10">
                <div className="text-[#00E676] text-xl font-bold">1250</div>
                <div className="text-xs font-bold text-[#00E676] uppercase">ELO</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="text-slate-500 text-sm">Último Partido</div>
                <div className="text-slate-900 font-bold">v. Diego S. <span className="text-[#00E676]">(W)</span></div>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="text-slate-500 text-sm">Forma</div>
                <div className="text-slate-900 font-bold space-x-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#00E676] text-slate-950 font-bold text-xs">W</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#00E676] text-slate-950 font-bold text-xs">W</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 font-bold text-xs">L</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#00E676] text-slate-950 font-bold text-xs">W</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <div className="text-slate-500 text-sm">Próximo Reto</div>
                <div className="text-[#1565C0] font-bold">Sin Retos Activos</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM FEATURES SECTION (Estructura Base44) */}
      <footer className="relative z-10 px-8 py-20 bg-slate-50 border-t border-slate-100 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-left space-y-4">
            <div className="text-sm font-bold text-[#1565C0] uppercase tracking-widest">Estadísticas</div>
            <p className="text-slate-600 font-light">Descubre las métricas clave de la comunidad de tenis en CART Rosarito.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow border border-slate-100 text-center">
            <p className="text-4xl font-extrabold text-[#0A193F] tracking-tighter">4ta</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Fuerza Popular</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow border border-slate-100 text-center">
            <p className="text-4xl font-extrabold text-[#0A193F] tracking-tighter">+50</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Jugadores Activos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
