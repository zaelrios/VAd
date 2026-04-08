import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Luces de fondo estilo Base44 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00E676] opacity-[0.08] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1565C0] opacity-[0.08] blur-[120px] rounded-full"></div>
      </div>

      <nav className="relative z-10 flex justify-between items-center max-w-7xl mx-auto px-8 py-10">
        <div className="text-3xl font-[900] tracking-tighter text-[#0A193F]">
          VAd<span className="text-[#00E676]">.</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {['Ranking', 'Torneos', 'Reglamento'].map((item) => (
            <a key={item} href="#" className="text-sm font-bold text-slate-400 hover:text-[#1565C0] transition-colors tracking-wide uppercase">{item}</a>
          ))}
          <button className="bg-[#0A193F] text-white px-8 py-3 rounded-2xl text-xs font-black tracking-widest hover:bg-[#1565C0] transition-all shadow-xl shadow-blue-900/10">
            ENTRAR
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-20 items-center pt-10 pb-24">
        
        {/* Lado Izquierdo: Copy Pro */}
        <div className="space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
            <span className="flex h-2 w-2 rounded-full bg-[#00E676] animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Circuito CART Rosarito</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-[950] tracking-[-0.06em] leading-[0.85] text-[#0A193F]">
            TU JUEGO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1565C0] to-[#00E676]">EVOLUCIONA.</span>
          </h1>
          
          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg">
            La plataforma definitiva para el tenis en Baja California. Gestiona tu ELO, encuentra rivales y domina el ranking local.
          </p>

          <div className="flex flex-wrap gap-5 pt-4">
            <button className="px-10 py-5 bg-[#00E676] text-slate-950 font-[900] text-sm rounded-[24px] shadow-2xl shadow-[#00E676]/30 hover:-translate-y-1 transition-all">
              REGÍSTRATE GRATIS
            </button>
            <button className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 font-[900] text-sm rounded-[24px] hover:border-[#1565C0] hover:text-[#1565C0] transition-all">
              VER RANKING
            </button>
          </div>
        </div>

        {/* Lado Derecho: La "Visual Card" Premium */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#1565C0]/20 to-[#00E676]/20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
          
          <div className="relative bg-white/70 backdrop-blur-2xl border border-white rounded-[48px] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between items-start mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200 flex items-center justify-center shadow-inner">
                <span className="text-slate-300 font-black text-4xl italic">ZR</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nivel Actual</div>
                <div className="text-4xl font-black text-[#1565C0]">1,000</div>
              </div>
            </div>

            <div className="space-y-2 mb-10">
              <h2 className="text-4xl font-black tracking-tight text-[#0A193F]">Zael Rios</h2>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Miembro Fundador CART</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm text-center">
                <div className="text-[10px] font-black text-slate-300 uppercase mb-2">Partidos</div>
                <div className="text-2xl font-black text-[#0A193F]">0</div>
              </div>
              <div className="bg-[#00E676] p-6 rounded-[32px] text-center shadow-lg shadow-[#00E676]/20">
                <div className="text-[10px] font-black text-slate-950/40 uppercase mb-2">Victorias</div>
                <div className="text-2xl font-black text-slate-950">0</div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 p-5 bg-slate-950 rounded-[28px] text-white">
              <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></div>
              <span className="text-[11px] font-black uppercase tracking-tighter opacity-80">Listo para tu primer match</span>
            </div>
          </div>
        </div>

      </main>

      <footer className="relative z-10 max-w-7xl mx-auto px-8 py-10 border-t border-slate-100 flex justify-between items-center">
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2026 VAd // Ventaja Adentro</div>
        <div className="text-[10px] font-black text-[#1565C0] uppercase tracking-widest">Rosarito, Baja California</div>
      </footer>
    </div>
  )
}
