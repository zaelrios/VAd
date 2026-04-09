import React, { useState } from 'react'

export default function App() {
  const [tab, setTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  return (
    // Fondo de página Crème Court
    <div className="min-h-screen bg-[#F8F7F2] text-[#1A1C1E] font-sans pb-32 selection:bg-[#29C454]/30">
         
      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="pt-10 px-6 max-w-lg mx-auto flex flex-col items-center">
        
        {/* VISTA HOME */}
        {tab === 'home' && (
          <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
            <section className="flex flex-col items-center">
              <h2 className="text-[#1A1C1E] font-black uppercase tracking-[0.4em] text-[15px] mb-4 drop-shadow-sm">
                Donde el tennis se vive
              </h2>
              <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8] uppercase mb-8 text-[#29C454]">
                VENTAJA <br /> 
                <span className="text-transparent" style={{ WebkitTextStroke: '2px #1A1C1E' }}>
                  ADENTRO.
                </span>
              </h1>
              <p className="text-[#1A1C1E] text-lg max-w-sm leading-relaxed italic border-t-2 border-[#29C454] pt-4">
                "Matchmaking por ELO, ranking de confianza y reservas inteligentes. La comunidad que premia a los que sí aparecen."
              </p>
            </section>

            {/* TARJETA DE ELO */}
            <div className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-xl shadow-[#1A1C1E]/5 relative overflow-hidden flex flex-col items-center">
              
              {/* TEXTO DE FONDO: Relleno color crema (#F8F7F2) y Contorno Negro (#1A1C1E) */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-4 text-[15px] font-black italic tracking-[0.3em] whitespace-nowrap select-none z-0"
                style={{ 
                  WebkitTextStroke: '1.5px #1A1C1E',
                  color: '#F8F7F2', // Relleno igual al fondo de la página
                  opacity: 0.8      // Opacidad alta para que se vea el relleno crema
                }}
              >
                PROGRESO ELO
              </div>
              
              <div className="relative z-10 flex items-end gap-3 mb-6 mt-4">
                <span className="text-7xl font-black italic text-[#29C454] leading-none drop-shadow-sm">1,000</span>
                <span className="text-sm font-bold text-[#1A1C1E] mb-2 uppercase tracking-wider">Pts</span>
              </div>
              
              <div className="relative z-10 w-full max-w-xs flex flex-col items-center gap-2">
                <div className="w-full h-2 bg-[#F8F7F2] rounded-full overflow-hidden border border-[#1A1C1E]/5">
                  <div className="bg-[#29C454] h-full w-[50%] shadow-[0_0_10px_rgba(41,196,84,0.4)] rounded-full"></div>
                </div>
                <div className="flex justify-between w-full text-[9px] font-bold text-[#1A1C1E]/50 uppercase tracking-tighter">
                    <span>Principiante</span>
                    <span className="text-[#1A1C1E]">Avanzado (Pro)</span>
                </div>
              </div>
            </div>

            <button 
  onClick={() => isLoggedIn ? setTab('buscar') : setTab('perfil')}
  className="w-fit px-6 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/20 active:scale-95 transition-all hover:brightness-105"
>
  {isLoggedIn ? "Encuentra rival ➜" : "Únete ➜"}
</button>
            </div>
        )}

        {/* VISTA RANKING */}
        {tab === 'ranking' && (
          <div className="w-full space-y-6 animate-in fade-in duration-500 text-center">
             <h2 className="text-4xl font-black italic text-[#1A1C1E] uppercase tracking-tight">Top Ranking</h2>
             <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl p-4 shadow-sm space-y-4">
                {[1, 2, 3].map((pos) => (
                  <div key={pos} className="flex items-center justify-between p-4 bg-[#F8F7F2] rounded-xl border border-[#1A1C1E]/5">
                    <span className="font-black italic text-[#29C454] text-lg">#{pos}</span>
                    <span className="font-bold text-[#1A1C1E]">Jugador Pro {pos}</span>
                    <span className="text-xs bg-[#29C454] text-white font-black px-3 py-1 rounded-full shadow-sm">1500 pts</span>
                  </div>
                ))}
             </div>
             <p className="text-[#1A1C1E]/60 text-sm">Regístrate para aparecer en la lista oficial.</p>
          </div>
        )}

        {/* OTRAS PESTAÑAS */}
        {['buscar', 'reservar', 'perfil'].includes(tab) && (
          <div className="pt-12 text-center animate-in zoom-in duration-300">
            <h2 className="text-4xl font-black italic text-[#1A1C1E] uppercase tracking-tight">
              {tab === 'reservar' ? 'Reservas' : tab}
            </h2>
            <div className="mt-8 bg-[#FFFFFF] p-10 rounded-[2.5rem] border border-[#1A1C1E]/10 shadow-sm">
               <p className="text-[#1A1C1E] text-lg">Próximamente disponible en Rosarito.</p>
               {!isLoggedIn && tab === 'perfil' && (
                <button className="mt-8 w-full bg-[#29C454] text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-md">
                  Crear Cuenta Nueva
                </button>
               )}
            </div>
          </div>
        )}
      </main>

     {/* --- MENÚ INFERIOR (Glassmorphism Style) --- */}
<nav className="fixed bottom-0 left-0 w-full z-50 bg-[#F8F7F2]/70 backdrop-blur-lg border-t border-[#1A1C1E]/5 px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
  <div className="flex justify-between items-center max-w-md mx-auto">
    {[
      { id: 'home', icon: '🏠' },
      { id: 'buscar', icon: '🔍' },
      { id: 'reservar', icon: '📅' },
      { id: 'ranking', icon: '📊' },
      { id: 'perfil', icon: '👤' }
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => setTab(item.id)}
        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
          tab === item.id 
          ? 'bg-[#29C454] text-white scale-110 shadow-lg shadow-[#29C454]/30' 
          : 'text-[#1A1C1E]/40 active:bg-[#1A1C1E]/5'
        }`}
      >
        <span className="text-xl">{item.icon}</span>
      </button>
    ))}
  </div>
</nav>
    </div>
  )
}