import React, { useState, useEffect } from 'react'
import { supabase } from './supabase' 

export default function App() {
  const [tab, setTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [currentUser, setCurrentUser] = useState(null); 
  
  // ESTADOS DEL LOGIN / REGISTRO
  const [phonePrefix, setPhonePrefix] = useState('+52');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // ESTADOS PARA REGISTRO DE 2 PASOS
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationName, setRegistrationName] = useState('');

  // ESTADOS PARA BÚSQUEDA DE RIVAL
  const [searchDate, setSearchDate] = useState('2026-04-10');
  const [startTime, setStartTime] = useState('05:00');
  const [endTime, setEndTime] = useState('13:00');
  const [activeSearches, setActiveSearches] = useState([]);
  const [searchError, setSearchError] = useState('');

  const [bookDate, setBookDate] = useState('2026-04-10');
  const [bookStart, setBookStart] = useState('16:00');
  const [bookEnd, setBookEnd] = useState('18:00');
  const [bookError, setBookError] = useState('');

  // MEMORIA PERMANENTE
  useEffect(() => {
    const savedUser = localStorage.getItem('vad_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // CARGAR BÚSQUEDAS ACTIVAS DESDE SUPABASE
  useEffect(() => {
    if (currentUser) {
      const cargarBúsquedas = async () => {
        const { data, error } = await supabase
          .from('buscar')
          .select('*')
          .eq('jugador_id', currentUser.id)
          .order('fecha', { ascending: true });
        
        if (data) setActiveSearches(data);
        if (error) console.error("Error cargando búsquedas:", error);
      };
      cargarBúsquedas();
    } else {
      setActiveSearches([]); 
    }
  }, [currentUser]);

  const formatTime = (time24) => {
    const [hourString, minute] = time24.split(':');
    let hour = parseInt(hourString, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; 
    return `${hour}:${minute} ${ampm}`;
  };

  const getInitials = (fullName) => {
    if (!fullName) return '🎾';
    const names = fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // --- NUEVO: RENDERIZADOR VISUAL DE PELOTAS DE CONFIANZA ---
  const renderBalls = (score) => {
    const numericScore = Number(score) || 5;
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((ball) => {
            let opacityClass = "opacity-20 grayscale"; // Vacía
            if (numericScore >= ball) opacityClass = "opacity-100"; // Llena
            else if (numericScore >= ball - 0.5) opacityClass = "opacity-50 scale-75"; // Media pelota
            
            return (
              <span key={ball} className={`text-2xl transition-all ${opacityClass}`}>🎾</span>
            );
          })}
        </div>
        <span className="text-[10px] font-black italic text-[#1A1C1E]/60 tracking-widest">{numericScore.toFixed(1)} / 5.0</span>
      </div>
    );
  };

  // --- PASO 1: VERIFICAR SI EXISTE EL JUGADOR ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const fullPhone = `${phonePrefix}${phoneNumber}`;

    try {
      const { data: existingUser, error: searchError } = await supabase
        .from('Perfiles') 
        .select('*')
        .eq('telefono', fullPhone)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingUser) {
        if (existingUser.pin === pin) {
          setCurrentUser(existingUser);
          setIsLoggedIn(true);
          setTab('home');
          localStorage.setItem('vad_session', JSON.stringify(existingUser));
        } else {
          setAuthError('PIN incorrecto para este número.');
        }
      } else {
        setIsRegistering(true);
      }
    } catch (error) {
      console.error(error);
      setAuthError('Error de conexión al circuito. Intenta de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  // --- PASO 2: COMPLETAR REGISTRO ---
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    
    const nameParts = registrationName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setAuthError('El anonimato no está permitido. Ingresa tu nombre y apellido reales.');
      return;
    }
    
    setAuthError('');
    setAuthLoading(true);
    const fullPhone = `${phonePrefix}${phoneNumber}`;

    try {
      const { data: newUser, error: insertError } = await supabase
        .from('Perfiles')
        .insert([{ 
            telefono: fullPhone, 
            pin: pin, 
            nombre: registrationName.trim(),
            elo: 1000, 
            confianza: 5.0, // Entran con 5 pelotas
            racha_asistencia: 0 // Inician con racha de cero
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setCurrentUser(newUser);
      setIsLoggedIn(true);
      setIsRegistering(false); 
      setRegistrationName('');
      setTab('home');
      localStorage.setItem('vad_session', JSON.stringify(newUser));
    } catch (error) {
      console.error(error);
      setAuthError('Error al crear tu cuenta. Intenta de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTab('home');
    setPhoneNumber('');
    setPin('');
    setIsRegistering(false); 
    localStorage.removeItem('vad_session');
  };

  // --- BUSCAR RIVAL (GUARDAR EN SUPABASE) ---
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setSearchError(''); 
    if (!isLoggedIn) { setTab('auth'); return; }
    if (startTime >= endTime) { setSearchError('La hora límite debe ser después de inicio.'); return; }
    
    const hasOverlap = activeSearches.some(search => {
      if (search.fecha !== searchDate) return false; 
      return (startTime < search.hora_fin && endTime > search.hora_inicio);
    });
    if (hasOverlap) { setSearchError('Ya tienes una búsqueda activa en este rango.'); return; }

    try {
      const { data, error } = await supabase
        .from('buscar')
        .insert([{
          jugador_id: currentUser.id,
          nombre: currentUser.nombre,
          fecha: searchDate,
          hora_inicio: startTime,
          hora_fin: endTime,
          estado: 'activa'
        }])
        .select()
        .single();

      if (error) throw error;
      setActiveSearches([...activeSearches, data]); 
    } catch (error) {
      console.error(error);
      setSearchError('Error al publicar tu búsqueda.');
    }
  };

  const handleCancelSearch = async (id) => {
    try {
      const { error } = await supabase
        .from('buscar')
        .delete()
        .eq('id', id);

      if (error) throw error; 

      setActiveSearches(prev => prev.filter(search => search.id !== id));
    } catch (error) {
      console.error('Error al cancelar en Supabase:', error);
      alert('Error al eliminar de la base de datos. Verifica tus políticas RLS.');
    }
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    setBookError('');
    if (!isLoggedIn) { setTab('auth'); return; }
    if (bookStart >= bookEnd) { setBookError('La hora de fin debe ser mayor a la de inicio.'); return; }
    alert(`Redirigiendo al pago...`);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1A1C1E] font-sans pb-32 selection:bg-[#29C454]/30">
      <main className="pt-10 px-6 max-w-lg mx-auto w-full flex flex-col items-center">
        
        {/* VISTA HOME */}
        {tab === 'home' && (
          <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
            <section className="flex flex-col items-center">
              <h2 className="text-[#1A1C1E] font-black uppercase tracking-[0.4em] text-[15px] mb-4 drop-shadow-sm">Donde el tennis se vive</h2>
              <h1 className="text-7xl font-black italic tracking-tighter leading-none uppercase mb-8 text-[#29C454]">
                VENTAJA <br /> <span className="text-transparent" style={{ WebkitTextStroke: '2px #1A1C1E' }}>ADENTRO.</span>
              </h1>
              <p className="text-[#1A1C1E] text-lg max-w-sm leading-relaxed italic border-t-2 border-[#29C454] pt-4">
                "Matchmaking por ELO, ranking de confianza y reservas inteligentes. La comunidad que premia a los que sí aparecen."
              </p>
            </section>

            <button 
              onClick={() => isLoggedIn ? setTab('buscar') : setTab('auth')}
              className="w-fit mx-auto block px-10 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105"
            >
              {isLoggedIn ? "Buscar rival ➜" : "Únete ➜"}
            </button>
          </div>
        )}

        {/* VISTA DE REGISTRO / AUTH */}
        {tab === 'auth' && (
          <div className="w-full max-w-sm mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
            
            {!isRegistering ? (
              <>
                <div className="text-center">
                  <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mb-2">Acceso Oficial</h2>
                  <p className="text-[#1A1C1E]/60 text-sm">Tu celular es tu identidad en el circuito.</p>
                </div>
                
                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Celular (WhatsApp / SMS)</label>
                    <div className="flex gap-2">
                      <div className="relative w-1/3">
                        <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)} className="w-full h-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl pl-3 pr-2 py-4 text-[#1A1C1E] font-bold shadow-sm appearance-none cursor-pointer">
                          <option value="+52">🇲🇽 +52</option>
                          <option value="+1">🇺🇸 +1</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
                      </div>
                      <input type="tel" required maxLength="10" placeholder="123 456 7890" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className="w-2/3 bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-bold tracking-widest placeholder:text-[#1A1C1E]/20 focus:outline-none focus:border-[#29C454]" />
                    </div>
                  </div>

                  <div className="space-y-2 text-left mt-2">
                    <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Crea o ingresa tu PIN (4 dígitos)</label>
                    <input type="password" inputMode="numeric" required maxLength="4" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-center text-2xl tracking-[1em] text-[#1A1C1E] font-black focus:outline-none focus:border-[#29C454]" />
                  </div>

                  {authError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center animate-in fade-in">{authError}</div>}

                  <button type="submit" disabled={authLoading} className={`w-full bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all mt-4 ${authLoading ? 'opacity-50' : 'hover:brightness-105'}`}>
                    {authLoading ? 'Conectando...' : 'Entrar al Circuito ➜'}
                  </button>
                </form>
                <button onClick={() => { setTab('home'); setAuthError(''); }} className="w-full text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest pt-2 hover:text-[#1A1C1E] transition-colors">Cancelar</button>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mb-2">Nuevo Jugador</h2>
                  <p className="text-[#1A1C1E]/60 text-sm">No encontramos tu número. ¡Crea tu perfil ahora!</p>
                </div>
                
                <form onSubmit={handleCompleteRegistration} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Nombre y Apellido</label>
                    <input 
                      type="text" required placeholder="Ej: Zael Rios" 
                      value={registrationName} onChange={(e) => setRegistrationName(e.target.value)} 
                      className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-bold tracking-wider placeholder:text-[#1A1C1E]/20 focus:outline-none focus:border-[#29C454]" 
                    />
                  </div>

                  {authError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center animate-in fade-in">{authError}</div>}

                  <button type="submit" disabled={authLoading} className={`w-full bg-[#1A1C1E] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all mt-4 ${authLoading ? 'opacity-50' : 'hover:brightness-105'}`}>
                    {authLoading ? 'Creando perfil...' : 'Completar Registro ➜'}
                  </button>
                </form>
                
                <button 
                  onClick={() => { setIsRegistering(false); setAuthError(''); }} 
                  className="w-full text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest pt-2 hover:text-[#1A1C1E] transition-colors"
                >
                  ← Atrás
                </button>
              </div>
            )}
          </div>
        )}

        {/* VISTA: BUSCAR RIVAL */}
        {tab === 'buscar' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500 mt-4 flex flex-col items-center">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-6 shadow-sm space-y-6 relative w-full">
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Día de Juego</label>
                  <input type="date" min="2026-04-10" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-4 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                </div>
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Franja de Disponibilidad</label>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Desde</span>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                    </div>
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Hasta</span>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                    </div>
                  </div>
                </div>
                {searchError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center">{searchError}</div>}
              </div>
              <div className="pt-6 flex flex-col items-center">
                <button type="submit" className="w-fit flex items-center justify-center gap-2 px-8 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
                  <span className="text-[#F8F7F2] animate-pulse">●</span> Buscar rival
                </button>
              </div>
            </form>

            {isLoggedIn && activeSearches.length > 0 && (
              <div className="pt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 w-full">
                <div className="flex items-center justify-between border-b border-[#1A1C1E]/10 pb-2">
                  <h3 className="text-sm font-black italic text-[#1A1C1E] uppercase">Búsquedas Activas</h3>
                </div>
                <div className="space-y-3">
                  {activeSearches.map((search) => (
                    <div key={search.id} className="bg-[#FFFFFF] border border-[#29C454]/30 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
                      <div className="absolute left-0 top-0 w-1 h-full bg-[#29C454] animate-pulse"></div>
                      <div className="pl-2 text-left">
                        <p className="text-[10px] font-bold text-[#1A1C1E]/50 uppercase tracking-widest">
                          {new Date(search.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm font-black text-[#1A1C1E] mt-1">
                          {formatTime(search.hora_inicio)} - {formatTime(search.hora_fin)}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleCancelSearch(search.id)} 
                        className="w-10 h-10 bg-[#F8F7F2] text-[#1A1C1E]/40 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Eliminar búsqueda"
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

        {/* VISTA: RESERVAR CANCHA */}
        {tab === 'reservar' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500 mt-4 flex flex-col items-center">
            <div className="text-center">
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mb-2">Reservar Cancha</h2>
              <p className="text-[#1A1C1E]/60 text-sm">Asegura tu lugar. Pago requerido por anticipado.</p>
            </div>
            <form onSubmit={handleBookSubmit} className="w-full">
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-6 shadow-sm space-y-6 relative w-full">
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Día de Reserva</label>
                  <input type="date" min="2026-04-10" value={bookDate} onChange={(e) => setBookDate(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-4 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                </div>
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Horario (Máx 3 hrs)</label>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Inicio</span>
                      <input type="time" value={bookStart} onChange={(e) => setBookStart(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                    </div>
                    <div className="space-y-1 w-full min-w-0">
                      <span className="text-[9px] font-bold text-[#1A1C1E]/40 uppercase ml-2">Fin</span>
                      <input type="time" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                    </div>
                  </div>
                </div>
                {bookError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center mt-4">{bookError}</div>}
              </div>
              <div className="pt-6 flex flex-col items-center">
                <button type="submit" className="w-full flex items-center justify-center px-8 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
                  Pagar Reserva ➜
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VISTA: MIS PARTIDOS */}
        {tab === 'partidos' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-sm mx-auto">
            <div className="text-center relative">
              {!isLoggedIn && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#29C454]/10 text-[#29C454] px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">Vista de Ejemplo</div>}
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mt-2">Tu Circuito</h2>
            </div>
            
            <div className={`space-y-3 ${!isLoggedIn && 'opacity-80'} text-left`}>
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

            {!isLoggedIn && (
              <button onClick={() => setTab('auth')} className="w-full mt-6 bg-[#29C454] text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-[#29C454]/30 animate-bounce hover:brightness-105">
                Únete para ver tu circuito
              </button>
            )}
          </div>
        )}

        {/* VISTA: PERFIL */}
        {tab === 'perfil' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 flex flex-col items-center">
            <div className={`bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden w-full ${!isLoggedIn && 'opacity-80'}`}>
              
              {!isLoggedIn && <div className="absolute top-4 bg-[#1A1C1E]/5 text-[#1A1C1E]/50 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">Perfil de Ejemplo</div>}

              <div className="w-24 h-24 bg-[#F8F7F2] rounded-full border-4 border-[#29C454] flex items-center justify-center text-[#1A1C1E] font-black italic text-4xl mb-4 shadow-sm mt-4 uppercase">
                {isLoggedIn && currentUser ? getInitials(currentUser.nombre) : '🎾'}
              </div>
              
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight">
                {isLoggedIn && currentUser ? currentUser.nombre : 'Jugador Pro'}
              </h2>

              <p className="text-[#1A1C1E]/50 font-bold tracking-widest mt-1 text-sm mb-6">
                {isLoggedIn && currentUser ? currentUser.telefono : 'Regístrate para entrar'}
              </p>

              {/* RENDERIZADOR DE PELOTAS */}
              {renderBalls(isLoggedIn && currentUser ? currentUser.confianza : 5.0)}

              <div className="flex gap-4 w-full mt-6 border-t border-[#1A1C1E]/10 pt-6 justify-center">
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest mb-1">Tu ELO</p>
                  <p className="text-3xl font-black italic text-[#29C454]">
                    {isLoggedIn && currentUser ? currentUser.elo : '1,000'}
                  </p>
                </div>
              </div>
            </div>

            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="w-full bg-[#F8F7F2] border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-colors"
              >
                Cerrar Sesión
              </button>
            ) : (
              <button onClick={() => setTab('auth')} className="w-full bg-[#29C454] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#29C454]/30 hover:brightness-105">
                Crear Cuenta / Iniciar Sesión
              </button>
            )}
          </div>
        )}

      </main>

      {/* --- MENÚ INFERIOR --- */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#F8F7F2]/90 backdrop-blur-lg border-t border-[#1A1C1E]/5 px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {[{ id: 'home', icon: '🏠' }, { id: 'buscar', icon: '🔍' }, { id: 'reservar', icon: '📅' }, { id: 'partidos', icon: '🎾' }, { id: 'perfil', icon: '👤' }].map((item) => (
            <button
              key={item.id} onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${tab === item.id ? 'bg-[#29C454] text-white scale-110 shadow-lg shadow-[#29C454]/30' : 'text-[#1A1C1E]/40 active:bg-[#1A1C1E]/5 hover:text-[#1A1C1E]/60'}`}
            >
              <span className="text-xl">{item.icon}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}