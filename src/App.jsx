import React, { useState } from 'react'

export default function App() {
  const [tab, setTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  
  // NUEVOS ESTADOS PARA EL RADAR
  const [searchDate, setSearchDate] = useState('2026-04-09');
  const [startTime, setStartTime] = useState('05:00');
  const [endTime, setEndTime] = useState('13:00');
  const [activeSearches, setActiveSearches] = useState([]);
  const [searchError, setSearchError] = useState('');

  // FUNCIÓN DE VALIDACIÓN Y BÚSQUEDA
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError(''); // Limpiamos errores previos

    // 1. Validar que la hora tenga sentido
    if (startTime >= endTime) {
      setSearchError('La hora límite debe ser después de la hora de inicio.');
      return;
    }

    // 2. Validar que no se empalme con otra búsqueda el mismo día
    const hasOverlap = activeSearches.some(search => {
      if (search.date !== searchDate) return false; // Si es otro día, no pasa nada
      // Lógica de cruce de horarios: (InicioNuevo < FinExistente) Y (FinNuevo > InicioExistente)
      return (startTime < search.endTime && endTime > search.startTime);
    });

    if (hasOverlap) {
      setSearchError('Ya tienes un radar escaneando en este rango de horario.');
      return;
    }

    // 3. Si todo está bien, agregamos el radar a la lista
    setActiveSearches([...activeSearches, {
      id: Date.now(), // ID único
      date: searchDate,
      startTime: startTime,
      endTime: endTime
    }]);
  };

  const handleCancelSearch = (id) => {
    setActiveSearches(activeSearches.filter(search => search.id !== id));
  };

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
                  color: '#F8F7F2', 
                  opacity: 0.8  
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
              onClick={() => isLoggedIn ? setTab('buscar') : setTab('auth')}
              className="w-fit px-6 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/20 active:scale-95 transition-all hover:brightness-105"
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
              <p className="text-[#1A1C1E]/60 text-sm">Tu número de celular es tu identidad en el circuito.</p>
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
                    <select className="w-full h-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl pl-3 pr-2 py-4 text-[#1A1C1E] font-bold shadow-sm appearance-none cursor-pointer focus:outline-none focus:border-[#29C454] focus:ring-1 focus:ring-[#29C454]">
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">
                      ▼
                    </div>
                  </div>
                  <input 
                    type="tel" 
                    required
                    maxLength="10"
                    placeholder="123 456 7890" 
                    className="w-2/3 bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-bold tracking-widest placeholder:text-[#1A1C1E]/20 focus:outline-none focus:border-[#29C454] focus:ring-1 focus:ring-[#29C454] shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left mt-2">
                <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Crea tu PIN de Acceso (4 dígitos)</label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  required
                  maxLength="4"
                  placeholder="••••" 
                  className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-center text-2xl tracking-[1em] text-[#1A1C1E] font-black focus:outline-none focus:border-[#29C454] focus:ring-1 focus:ring-[#29C454] shadow-sm transition-all"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#1A1C1E] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#1A1C1E]/20 active:scale-95 transition-all mt-4"
              >
                Recibir Código ➜
              </button>

              <div className="pt-6 border-t border-[#1A1C1E]/10">
                <p className="text-[10px] text-[#1A1C1E]/50 text-center leading-relaxed">
                  Al continuar, aceptas el pacto de honor y confirmas que eres un jugador real. Solo se permite una cuenta por persona.
                </p>
              </div>
            </form>
            
            <button 
              onClick={() => setTab('home')}
              className="w-full text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest pt-2 active:text-[#1A1C1E] transition-colors"
            >
              Cancelar
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
        {/* VISTA: ENCONTRAR RIVAL (RADAR DE EMPAREJAMIENTO CIEGO) */}
        {tab === 'buscar' && (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-500 mt-4">
            
            <form onSubmit={handleSearchSubmit}>
              {/* Consola de Disponibilidad */}
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm space-y-8 relative">
                
                {/* Selector de Fecha */}
                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Día de Juego</label>
                  <input 
                    type="date" 
                    min="2026-04-09" 
                    max="2026-04-23" 
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    required
                    className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-black uppercase tracking-widest focus:outline-none focus:border-[#29C454] focus:ring-1 focus:ring-[#29C454] appearance-none shadow-inner"
                  />
                </div>

                {/* Selector de Rango de Horas */}
                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Franja de Disponibilidad</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Desde</span>
                      <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-4 py-4 text-[#1A1C1E] font-black text-center focus:outline-none focus:border-[#29C454] focus:ring-1 focus:ring-[#29C454] shadow-inner appearance-none"
                      />
                    </div>
                    <span className="text-[#1A1C1E]/20 font-black">-</span>
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Hasta</span>
                      <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-4 py-4 text-[#1A1C1E] font-black text-center focus:outline-none focus:border-[#29C454] focus:ring-1 focus:ring-[#29C454] shadow-inner appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Mensaje de Error (Si se empalman horarios) */}
                {searchError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center animate-in fade-in">
                    {searchError}
                  </div>
                )}
              </div>

              {/* Botón de Activación */}
              <div className="pt-6 flex flex-col items-center">
                <button type="submit" className="w-fit flex items-center justify-center gap-2 px-8 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/20 active:scale-95 transition-all hover:brightness-105">
                  <span className="text-[#F8F7F2] animate-pulse">●</span> Buscar rival
                </button>
              </div>
            </form>

            {/* SECCIÓN DE BÚSQUEDAS ACTIVAS */}
            {activeSearches.length > 0 && (
              <div className="pt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between border-b border-[#1A1C1E]/10 pb-2">
                  <h3 className="text-sm font-black italic text-[#1A1C1E] uppercase">Radares Activos</h3>
                  <span className="text-[10px] font-bold text-[#29C454] uppercase tracking-widest bg-[#29C454]/10 px-2 py-1 rounded-md">
                    Buscando...
                  </span>
                </div>
                
                {/* Lista de Tickets */}
                <div className="space-y-3">
                  {activeSearches.map((search) => (
                    <div key={search.id} className="bg-[#FFFFFF] border border-[#29C454]/30 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                      {/* Efecto de escaneo visual en la tarjeta */}
                      <div className="absolute left-0 top-0 w-1 h-full bg-[#29C454] animate-pulse"></div>
                      
                      <div className="pl-2">
                        <p className="text-[10px] font-bold text-[#1A1C1E]/50 uppercase tracking-widest">
                          {new Date(search.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm font-black text-[#1A1C1E] mt-1">
                          {search.startTime} <span className="text-[#1A1C1E]/30 mx-1">-</span> {search.endTime}
                        </p>
                      </div>

                      <button 
                        onClick={() => handleCancelSearch(search.id)}
                        className="w-10 h-10 bg-[#F8F7F2] text-[#1A1C1E]/40 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
        {/* OTRAS PESTAÑAS (Mantenimiento) */}
        {['reservar', 'perfil'].includes(tab) && (
          <div className="pt-12 text-center animate-in zoom-in duration-300">
            <h2 className="text-4xl font-black italic text-[#1A1C1E] uppercase tracking-tight">
              {tab === 'reservar' ? 'Reservas' : tab}
            </h2>
            <div className="mt-8 bg-[#FFFFFF] p-10 rounded-[2.5rem] border border-[#1A1C1E]/10 shadow-sm">
               <p className="text-[#1A1C1E] text-lg">Próximamente disponible en Rosarito.</p>
               {!isLoggedIn && tab === 'perfil' && (
                <button 
                  onClick={() => setTab('auth')}
                  className="mt-8 w-full bg-[#29C454] text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-md"
                >
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