import React, { useState } from 'react'

export default function App() {
  const [tab, setTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  
  // ESTADOS PARA EL RADAR DE BÚSQUEDA
  const [searchDate, setSearchDate] = useState('2026-04-09');
  const [startTime, setStartTime] = useState('05:00');
  const [endTime, setEndTime] = useState('13:00');
  const [activeSearches, setActiveSearches] = useState([]);
  const [searchError, setSearchError] = useState('');

  // ESTADOS PARA RESERVA DE CANCHAS
  const [bookDate, setBookDate] = useState('2026-04-09');
  const [bookStart, setBookStart] = useState('16:00');
  const [bookEnd, setBookEnd] = useState('18:00');
  const [bookError, setBookError] = useState('');

  // Traductor de hora militar a formato 12h (AM/PM)
  const formatTime = (time24) => {
    const [hourString, minute] = time24.split(':');
    let hour = parseInt(hourString, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; 
    return `${hour}:${minute} ${ampm}`;
  };

  // LOGICA DEL RADAR (Tripwire de Auth)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError(''); 

    // TRAMPA: Si no está logueado, lo mandamos al registro
    if (!isLoggedIn) {
      setTab('auth');
      return;
    }

    if (startTime >= endTime) {
      setSearchError('La hora límite debe ser después de la hora de inicio.');
      return;
    }

    const hasOverlap = activeSearches.some(search => {
      if (search.date !== searchDate) return false; 
      return (startTime < search.endTime && endTime > search.startTime);
    });

    if (hasOverlap) {
      setSearchError('Ya tienes un radar escaneando en este rango.');
      return;
    }

    setActiveSearches([...activeSearches, {
      id: Date.now(), 
      date: searchDate,
      startTime: startTime,
      endTime: endTime
    }]);
  };

  const handleCancelSearch = (id) => {
    setActiveSearches(activeSearches.filter(search => search.id !== id));
  };

  // LOGICA DE RESERVAS (Tripwire de Auth y Límite 3hrs)
  const handleBookSubmit = (e) => {
    e.preventDefault();
    setBookError('');

    // TRAMPA: Si no está logueado, lo mandamos al registro
    if (!isLoggedIn) {
      setTab('auth');
      return;
    }

    if (bookStart >= bookEnd) {
      setBookError('La hora de fin debe ser mayor a la de inicio.');
      return;
    }

    const startObj = new Date(`2000-01-01T${bookStart}`);
    const endObj = new Date(`2000-01-01T${bookEnd}`);
    const diffHours = (endObj - startObj) / (1000 * 60 * 60);

    if (diffHours > 3) {
      setBookError('El límite máximo de reserva es de 3 horas por día.');
      return;
    }

    alert(`Redirigiendo al pago por ${diffHours} hora(s)...`);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1A1C1E] font-sans pb-32 selection:bg-[#29C454]/30">
         
      <main className="pt-10 px-6 max-w-lg mx-auto w-full flex flex-col items-center">
        
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

            <div className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-xl shadow-[#1A1C1E]/5 relative overflow-hidden flex flex-col items-center">
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-4 text-[15px] font-black italic tracking-[0.3em] whitespace-nowrap select-none z-0"
                style={{ WebkitTextStroke: '1.5px #1A1C1E', color: '#F8F7F2', opacity: 0.8 }}
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
              onClick={() => isLoggedIn ? setTab('buscar') : setTab('auth')}
              className="w-fit mx-auto block px-10 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105"
            >
              {isLoggedIn ? "Encuentra rival ➜" : "Únete ➜"}
            </button>
          </div>
        )}

        {/* VISTA DE REGISTRO / AUTH */}
        {tab === 'auth' && (
          <div className="w-full max-w-sm mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mb-2">Acceso Oficial</h2>
              <p className="text-[#1A1C1E]/60 text-sm">Tu celular es tu identidad en el circuito.</p>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setIsLoggedIn(true);
                setTab('home'); 
              }} 
              className="space-y-6"
            >
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Celular (WhatsApp / SMS)</label>
                <div className="flex gap-2">
                  <div className="relative w-1/3">
                    <select className="w-full h-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl pl-3 pr-2 py-4 text-[#1A1C1E] font-bold shadow-sm appearance-none cursor-pointer">
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
                  </div>
                  <input type="tel" required maxLength="10" placeholder="123 456 7890" className="w-2/3 bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-bold tracking-widest placeholder:text-[#1A1C1E]/20 focus:outline-none focus:border-[#29C454]" />
                </div>
              </div>

              <div className="space-y-2 text-left mt-2">
                <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">PIN de Acceso</label>
                <input type="password" inputMode="numeric" required maxLength="4" placeholder="••••" className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-center text-2xl tracking-[1em] text-[#1A1C1E] font-black focus:outline-none focus:border-[#29C454]" />
              </div>

              <button type="submit" className="w-full bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all mt-4 hover:brightness-105">
                Entrar al Circuito ➜
              </button>
            </form>
            <button onClick={() => setTab('home')} className="w-full text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest pt-2">Cancelar</button>
          </div>
        )}

        {/* VISTA: ENCONTRAR RIVAL (RADAR) */}
        {tab === 'buscar' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500 mt-4">
            <form onSubmit={handleSearchSubmit}>
              
              {/* Consola de Disponibilidad Responsiva */}
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-6 shadow-sm space-y-6 relative w-full">
                
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Día de Juego</label>
                  <input 
                    type="date" min="2026-04-09" max="2026-04-23" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} required 
                    className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-4 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" 
                  />
                </div>

                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Franja de Disponibilidad</label>
                  {/* Grid estricto de 2 columnas para que nunca se desborde */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Desde</span>
                      <input 
                        type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required 
                        className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" 
                      />
                    </div>
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Hasta</span>
                      <input 
                        type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required 
                        className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" 
                      />
                    </div>
                  </div>
                </div>

                {searchError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center animate-in fade-in mt-4">
                    {searchError}
                  </div>
                )}
              </div>

              <div className="pt-6 flex flex-col items-center">
                <button type="submit" className="w-fit flex items-center justify-center gap-2 px-8 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
                  <span className="text-[#F8F7F2] animate-pulse">●</span> Activar Radar
                </button>
              </div>
            </form>

            {isLoggedIn && activeSearches.length > 0 && (
              <div className="pt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between border-b border-[#1A1C1E]/10 pb-2">
                  <h3 className="text-sm font-black italic text-[#1A1C1E] uppercase">Búsquedas Activas</h3>
                </div>
                <div className="space-y-3">
                  {activeSearches.map((search) => (
                    <div key={search.id} className="bg-[#FFFFFF] border border-[#29C454]/30 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1 h-full bg-[#29C454] animate-pulse"></div>
                      <div className="pl-2">
                        <p className="text-[10px] font-bold text-[#1A1C1E]/50 uppercase tracking-widest">
                          {new Date(search.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm font-black text-[#1A1C1E] mt-1">
                          {formatTime(search.startTime)} - {formatTime(search.endTime)}
                        </p>
                      </div>
                      <button onClick={() => handleCancelSearch(search.id)} className="w-10 h-10 bg-[#F8F7F2] text-[#1A1C1E]/40 rounded-full flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISTA: RESERVAR CANCHA */}
        {tab === 'reservar' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500 mt-4">
            <div className="text-center">
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mb-2">Reservar Cancha</h2>
              <p className="text-[#1A1C1E]/60 text-sm">Asegura tu lugar. Pago requerido por anticipado.</p>
            </div>

            <form onSubmit={handleBookSubmit}>
              
              {/* Consola de Reserva Responsiva */}
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-6 shadow-sm space-y-6 relative w-full">
                
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Día de Reserva</label>
                  <input 
                    type="date" min="2026-04-09" value={bookDate} onChange={(e) => setBookDate(e.target.value)} required 
                    className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-4 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" 
                  />
                </div>

                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Horario (Máx 3 hrs)</label>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Inicio</span>
                      <input 
                        type="time" value={bookStart} onChange={(e) => setBookStart(e.target.value)} required 
                        className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" 
                      />
                    </div>
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Fin</span>
                      <input 
                        type="time" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} required 
                        className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" 
                      />
                    </div>
                  </div>
                </div>

                {bookError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center animate-in fade-in mt-4">
                    {bookError}
                  </div>
                )}
              </div>

              <div className="pt-6 flex flex-col items-center">
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-8 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
                  Pagar Reserva ➜
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VISTA: MIS PARTIDOS */}
        {tab === 'partidos' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500">
            <div className="text-center relative">
              {!isLoggedIn && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#29C454]/10 text-[#29C454] px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">
                  Vista de Ejemplo
                </div>
              )}
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mt-2">Tu Circuito</h2>
            </div>
            
            <div className={`space-y-3 ${!isLoggedIn && 'opacity-80'}`}>
              <h3 className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Próximo Encuentro</h3>
              <div className="bg-[#29C454] text-white rounded-[2rem] p-6 shadow-lg shadow-[#29C454]/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 text-8xl transform translate-x-4 -translate-y-4">🎾</div>
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Jueves, 16 Abril</p>
                  <h4 className="text-3xl font-black italic mb-4">6:00 PM</h4>
                  <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                    <div className="w-10 h-10 bg-white text-[#29C454] rounded-full flex items-center justify-center font-black italic">MC</div>
                    <div>
                      <p className="text-xs uppercase tracking-widest font-bold opacity-80">Rival Confirmado</p>
                      <p className="font-black italic">Mateo C. (1,250 Pts)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-3 pt-4 ${!isLoggedIn && 'opacity-80'}`}>
              <h3 className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Últimos Resultados</h3>
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-[#1A1C1E]/50 uppercase tracking-widest">Ayer</span>
                   <span className="font-black italic text-[#1A1C1E]">vs. Luis R.</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="bg-[#29C454]/10 text-[#29C454] px-3 py-1 rounded-md text-xs font-black tracking-widest">VICTORIA</span>
                   <span className="text-[#1A1C1E] font-black italic">+12 Pts</span>
                 </div>
              </div>
            </div>

            {!isLoggedIn && (
              <button 
                onClick={() => setTab('auth')}
                className="w-full mt-6 bg-[#29C454] text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-[#29C454]/30 animate-bounce hover:brightness-105"
              >
                Únete para ver tu circuito
              </button>
            )}
          </div>
        )}

        {/* VISTA: PERFIL */}
        {tab === 'perfil' && (
          <div className="w-full space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className={`bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden ${!isLoggedIn && 'opacity-80'}`}>
              
              {!isLoggedIn && (
                <div className="absolute top-4 bg-[#1A1C1E]/5 text-[#1A1C1E]/50 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">
                  Perfil de Ejemplo
                </div>
              )}

              <div className="w-24 h-24 bg-[#F8F7F2] rounded-full border-4 border-[#29C454] flex items-center justify-center text-[#1A1C1E] font-black italic text-4xl mb-4 shadow-sm mt-4">
                {isLoggedIn ? 'ZA' : '🎾'}
              </div>
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight">
                {isLoggedIn ? 'Zael' : 'Jugador Pro'}
              </h2>
              <p className="text-[#1A1C1E]/50 font-bold tracking-widest mt-1 text-sm">
                {isLoggedIn ? '+52 664 *** ****' : 'Regístrate para entrar'}
              </p>

              <div className="flex gap-4 w-full mt-8 border-t border-[#1A1C1E]/10 pt-6">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest mb-1">Tu ELO</p>
                  <p className="text-2xl font-black italic text-[#29C454]">1,000</p>
                </div>
                <div className="w-px bg-[#1A1C1E]/10"></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest mb-1">Confianza</p>
                  <p className="text-2xl font-black italic text-[#1A1C1E]">100%</p>
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setTab('home');
                }}
                className="w-full bg-[#F8F7F2] border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-colors"
              >
                Cerrar Sesión
              </button>
            ) : (
              <button 
                onClick={() => setTab('auth')}
                className="w-full bg-[#29C454] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#29C454]/30 hover:brightness-105"
              >
                Crear Cuenta / Iniciar Sesión
              </button>
            )}
          </div>
        )}

      </main>

      {/* --- MENÚ INFERIOR (LIBRE DE NAVEGACIÓN) --- */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#F8F7F2]/90 backdrop-blur-lg border-t border-[#1A1C1E]/5 px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {[
            { id: 'home', icon: '🏠' },
            { id: 'buscar', icon: '🔍' },
            { id: 'reservar', icon: '📅' },
            { id: 'partidos', icon: '🎾' },
            { id: 'perfil', icon: '👤' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                tab === item.id 
                ? 'bg-[#29C454] text-white scale-110 shadow-lg shadow-[#29C454]/30' 
                : 'text-[#1A1C1E]/40 active:bg-[#1A1C1E]/5 hover:text-[#1A1C1E]/60'
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