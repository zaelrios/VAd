import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#00E676]/30">
      
      {/* --- NAVEGACIÓN --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#0A193F] text-[#00E676] w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-900/20">V</div>
            <span className="text-2xl font-[900] tracking-tighter text-[#0A193F]">VAd<span className="text-[#00E676]">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-[#1565C0] transition-colors">Ranking</a>
            <a href="#" className="hover:text-[#1565C0] transition-colors">Torneos</a>
            <button className="bg-[#0A193F] text-white px-6 py-2.5 rounded-xl hover:bg-[#1565C0] transition-all shadow-md">ENTRAR</button>
          </div>
        </div>
      </nav>

      {/* --- CUERPO DE LA PÁGINA --- */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Sección de Bienvenida */}
        <section className="grid lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-block px-4 py-1.5 bg-[#00E676]/10 border border-[#00E676]/20 rounded-full">
              <span className="text-[#00C853] text-[10px] font-black uppercase tracking-[0.2em]">Circuito CART Rosarito</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-[950] tracking-[-0.04em] leading-[0.9] text-[#0A193F]">
              Domina la <br />
              <span className="text-[#1565C0]">Cancha.</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed">
              La plataforma oficial para medir tu nivel, encontrar rivales y escalar en el ranking de Baja California.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-[#0A193F] text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform">Ver Ranking</button>
              <button className="px-8 py-4 bg-white border-2 border-slate-200 font-bold rounded-2xl hover:border-[#1565C0] transition-all">Reglas ELO</button>
            </div>
          </div>

          {/* Tarjeta de Perfil Rápido (Preview) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E676]/10 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-slate-100 rounded-[24px] flex items-center justify-center text-3xl font-black text-slate-300 border-2 border-dashed border-slate-200">ZR</div>
                <div>
                  <h3 className="text-2xl font-black text-[#0A193F]">Zael Rios</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Nivel: Avanzado</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Puntos ELO</span>
                  <span className="text-4xl font-black text-[#1565C0]">1,000</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#1565C0] to-[#00E676] w-[60%]"></div>
                </div>
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4">Próximo objetivo: 1,200 pts</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Estadísticas Rápidas o Acciones */}
        <section className="grid md:grid-cols-3 gap-6">
           {['Top Ranking', 'Últimos Matches', 'Torneos Activos'].map((title, i) => (
             <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer">
               <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-xl">
                 {i === 0 ? '🏆' : i === 1 ? '🎾' : '📅'}
               </div>
               <h4 className="font-black text-[#0A193F] text-lg mb-1">{title}</h4>
               <p className="text-sm text-slate-400 font-medium">Explora las estadísticas y mantente al día con el club.</p>
             </div>
           ))}
        </section>

      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 text-center">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">VAd © 2026 // Ventaja Adentro</p>
      </footer>
    </div>
  )
}