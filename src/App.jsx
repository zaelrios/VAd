import React, { useState } from 'react'
import logo from './assets/logo.png'

export default function App() {
  // Las primeras 10 líneas de lógica se mantienen intactas
  const [tab, setTab] = useState('home');

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans selection:bg-[#B7FF00]/30">
      
      {/* --- MENÚ SUPERIOR (Navegación fija) --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0A0F1C] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-1 h-16 flex justify-between items-center">
          
          {/* Logo VAd con el fondo igualado al menú */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab('home')}>
          <img 
    src={logo} 
    alt="Logo VAd" 
    className="w-11 h-11 rounded-full object-cover" 
  />
  <span className="text-2xl font-black tracking-tighter italic">VAd<span className="text-[#B7FF00]">.</span></span>
</div>

          {/* Opciones del Menú con efecto "Resaltado/Relleno" */}
          <div className="hidden lg:flex items-center gap-1 font-bold text-[14px] uppercase tracking-widest text-gray-400">
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'buscar', label: 'Buscar Partido', icon: '🔍' },
              { id: 'reservar', label: 'Reservar Cancha', icon: '🎾' },
              { id: 'mis-partidos', label: 'Mis Partidos', icon: '📅' },
              { id: 'ranking', label: 'Ranking', icon: '📊' },
              { id: 'perfil', label: 'Perfil', icon: '👤' },
              { id: 'planes', label: 'Planes', icon: '💎' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                  ${tab === item.id 
                    ? 'bg-[#B7FF00] text-black scale-110 shadow-[0_0_20px_rgba(183,255,0,0.4)]' 
                    : 'hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Botón de Login */}
          <button className="bg-white text-black px-5 py-2 rounded-full font-black text-[14px] uppercase tracking-widest hover:bg-[#B7FF00] transition-all">
            LOGIN
          </button>
        </div>
      </nav>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="pt-32 px-6 max-w-7xl mx-auto">
        
        {/* VISTA: HOME */}
        {tab === 'home' && (
          <div className="animate-in fade-in duration-700">
            
            {/* Cabecera Hero */}
            <div className="mb-24 mt-10">
              <h2 className="text-[#B7FF00] font-black uppercase tracking-[0.4em] text-[10px] mb-4">
                Circuito CART Rosarito
              </h2>
              <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter leading-[0.8] uppercase mb-8">
                VENTAJA <br /> 
                <span className="text-transparent" style={{ WebkitTextStroke: '2px white' }}>
                  ADENTRO.
                </span>
              </h1>
              <p className="text-[#94A3B8] text-xl max-w-xl mb-10 leading-relaxed border-l-2 border-[#B7FF00] pl-6 italic">
                "No es solo tenis, es estrategia. Sube de nivel, domina el ELO y demuestra quién manda en la cancha."
              </p>
              <button className="bg-[#B7FF00] text-black px-10 py-4 rounded-full font-black italic uppercase text-xs hover:scale-105 transition-all shadow-[0_10px_30px_rgba(183,255,0,0.2)]">
                Inscribirse al Circuito
              </button>
            </div>

            {/* --- ZONA DE TRABAJO INFERIOR (HOME) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-32">
              
              {/* Columna Izquierda: Actividad / Torneos */}
              <div className="lg:col-span-2 space-y-10">
                <section className="bg-white/5 border border-white/10 rounded-[3rem] p-10 hover:border-[#B7FF00]/20 transition-colors group">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black italic uppercase">Próximos Torneos</h3>
                    <span className="text-[#B7FF00] text-[10px] font-black tracking-widest uppercase cursor-pointer hover:underline">Ver calendario</span>
                  </div>
                  <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-gray-600 font-black italic uppercase text-sm">
                    Espacio para Lista de Torneos
                  </div>
                </section>
              </div>

              {/* Columna Derecha: Mi Perfil Rápido */}
              <aside className="space-y-8">
                <div className="bg-gradient-to-br from-[#1E293B] to-[#0A0F1C] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-9xl text-white/5 font-black italic select-none">ELO</div>
                  <h3 className="text-white font-black italic uppercase tracking-widest text-[10px] mb-10">Mi Ranking Actual</h3>
                  
                  <div className="relative z-10">
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-[#94A3B8] text-[9px] font-black uppercase mb-1">Puntos de Jugador</p>
                        <span className="text-6xl font-black italic text-[#B7FF00]">1,000</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-black italic text-lg leading-none">TOP 15</p>
                        <p className="text-[#94A3B8] text-[8px] uppercase tracking-tighter">Ranking Local</p>
                      </div>
                    </div>
                    
                    {/* Barra de Progreso ELO */}
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div className="bg-[#B7FF00] h-full w-[65%] shadow-[0_0_15px_rgba(183,255,0,0.6)]"></div>
                    </div>
                  </div>
                </div>
              </aside>

            </div>
          </div>
        )}

        {/* VISTAS DE OTRAS PESTAÑAS (En construcción) */}
        {tab !== 'home' && (
          <div className="py-20 text-center animate-in zoom-in duration-300">
            <h2 className="text-6xl font-black italic uppercase mb-4 text-[#B7FF00]">{tab.replace('-', ' ')}</h2>
            <p className="text-[#94A3B8] text-lg">Esta sección se encuentra actualmente en mantenimiento.</p>
            <button 
              onClick={() => setTab('home')}
              className="mt-8 bg-white/5 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
            >
              Regresar al Home
            </button>
          </div>
        )}

      </main>
    </div>
  )
}