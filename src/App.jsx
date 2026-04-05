import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased selection:bg-[#00E676]/30">
      
      {/* Navbar Minimalista estilo SaaS */}
      <nav className="flex justify-between items-center px-6 py-5 max-w-6xl mx-auto border-b border-slate-100">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-1">
          <div className="w-8 h-8 bg-[#1565C0] rounded-lg flex items-center justify-center text-white text-xs italic">V</div>
          VAd<span className="text-[#00E676]">.</span>
        </div>
        <div className="hidden md:flex gap-8 text-[13px] font-bold uppercase tracking-wider text-slate-400">
          <a href="#" className="hover:text-[#1565C0] transition-all">Ranking</a>
          <a href="#" className="hover:text-[#1565C0] transition-all">Torneos</a>
          <a href="#" className="hover:text-[#1565C0] transition-all">Club CART</a>
        </div>
        <button className="bg-[#0f172a] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#1565C0] transition-all shadow-lg shadow-black/10">
          ENTRAR
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Columna Izquierda: Mensaje Central */}
        <div className="space-y-8">
          <div className="inline-block px-3 py-1 rounded-full bg-[#00E676]/10 border border-[#00E676]/20 text-[#008a46] text-[10px] font-black uppercase tracking-widest">
            🎾 Rosarito Tennis Network
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-[ -0.05em] leading-[0.85]">
            DOMINA <br />
            <span className="text-[#1565C0]">LA CANCHA.</span>
          </h1>
          
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
            Registra tus victorias, analiza tu progreso y escala en el ranking oficial de <span className="text-[#0f172a] font-bold">VAd</span>. El estándar de ELO para Rosarito.
          </p>

          <div className="flex gap-4 pt-4">
            <button className="bg-[#00E676] text-slate-950 px-8 py-4 rounded-2xl font-black text-sm shadow-[0_10px_20px_rgba(0,230,118,0.3)] hover:-translate-y-1 transition-all">
              CREAR PERFIL
            </button>
            <button className="bg-white border-2 border-slate-100 text-slate-400 px-8 py-4 rounded-2xl font-black text-sm hover:border-[#1565C0] hover:text-[#1565C0] transition-all">
              EXPLORAR
            </button>
          </div>
        </div>

        {/* Columna Derecha: El "Hero Card" (Inspirado en tu imagen) */}
        <div className="relative">
          {/* Adorno de fondo (Círculo difuso) */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1565C0] rounded-full blur-[100px] opacity-10"></div>
          
          <div className="relative bg-white rounded-[2.5rem] p-1 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
            <div className="bg-[#1565C0] h-32 w-full absolute top-0 left-0"></div>
            
            <div className="relative pt-16 px-8 pb-10 flex flex-col items-center">
              <div className="w-32 h-32 rounded-[2rem] bg-white shadow-xl mb-6 p-1">
                <div className="w-full h-full bg-slate-50 rounded-[1.8rem] flex items-center justify-center border border-dashed border-slate-200">
                  <span className="text-slate-300 font-black text-4xl">?</span>
                </div>
              </div>
              
              <h2 className="text-3xl font-black tracking-tighter mb-1">Tu Nombre Aquí</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">Rosarito, B.C.</p>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-slate-50 p-5 rounded-3xl text-center border border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Ranking</p>
                  <p className="text-2xl font-black text-[#1565C0]">#--</p>
                </div>
                <div className="bg-[#00E676]/5 p-5 rounded-3xl text-center border border-[#00E676]/10">
                  <p className="text-[10px] font-black text-[#00E676] uppercase mb-1">Puntos ELO</p>
                  <p className="text-2xl font-black text-[#00E676]">1000</p>
                </div>
              </div>

              <div className="mt-6 w-full p-4 bg-slate-900 rounded-2xl flex justify-between items-center text-white">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">Próximo Match</span>
                <span className="text-xs font-bold">Buscando rival...</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      <footer className="max-w-6xl mx-auto px-6 py-10 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest border-t border-slate-50">
        <div>© 2026 VAd PROJECT</div>
        <div className="flex gap-8">
          <span>Matchmaking</span>
          <span>Ranking System</span>
        </div>
      </footer>
    </div>
  )
}
