import React, { useState, useEffect } from 'react'
import { supabase } from './supabase' 

export default function App() {
  // --- LÓGICA DE HORA INTELIGENTE INICIAL ---
  const getInitialTimes = () => {
    const now = new Date();
    
    // Redondear a la siguiente hora en punto
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);

    // Start Time: Hora redondeada + 3 horas
    const startObj = new Date(now);
    startObj.setHours(startObj.getHours() + 3);
    
    // End Time: Start Time + 2 horas
    const endObj = new Date(startObj);
    endObj.setHours(endObj.getHours() + 2);

    const formatTime = (dateObj) => dateObj.toTimeString().substring(0, 5);
    const formatDate = (dateObj) => {
      const offset = dateObj.getTimezoneOffset() * 60000;
      return new Date(dateObj - offset).toISOString().split('T')[0];
    };

    return {
      date: formatDate(startObj),
      start: formatTime(startObj),
      end: formatTime(endObj)
    };
  };

  const [initData] = useState(getInitialTimes);

  const [tab, setTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [currentUser, setCurrentUser] = useState(null); 
  
  // ESTADOS DEL LOGIN / REGISTRO
  const [phonePrefix, setPhonePrefix] = useState('+52');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationName, setRegistrationName] = useState('');

  // ESTADOS PARA BÚSQUEDA DE RIVAL Y CANCHAS
  const [searchDate, setSearchDate] = useState(initData.date);
  const [startTime, setStartTime] = useState(initData.start);
  const [endTime, setEndTime] = useState(initData.end);
  const [superficie, setSuperficie] = useState('Dura'); // RE-AGREGADO
  const [activeSearches, setActiveSearches] = useState([]);
  const [searchError, setSearchError] = useState('');

  // ESTADOS PARA LOS PARTIDOS Y REPORTES
  const [misPartidos, setMisPartidos] = useState([]);
  const [reportingMatch, setReportingMatch] = useState(null);
  const [marcador, setMarcador] = useState('');
  const [ganadorId, setGanadorId] = useState('');

  const [bookDate, setBookDate] = useState(initData.date);
  const [bookStart, setBookStart] = useState(initData.start);
  const [bookEnd, setBookEnd] = useState(initData.end);
  const [bookError, setBookError] = useState('');

  // --- RELOJ EN VIVO PARA EL TEMPORIZADOR ---
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // MEMORIA PERMANENTE
  useEffect(() => {
    const savedUser = localStorage.getItem('vad_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // --- CARGAR BÚSQUEDAS ACTIVAS Y LIMPIAR EXPIRADAS ---
  useEffect(() => {
    if (currentUser) {
      const cargarBúsquedas = async () => {
        const { data, error } = await supabase
          .from('buscar')
          .select('*')
          .eq('jugador_id', currentUser.id)
          .order('fecha', { ascending: true });
        
        if (error) {
          console.error("Error cargando búsquedas:", error);
          return;
        }

        if (data) {
          const now = new Date();
          const busquedasValidas = [];

          for (let search of data) {
            const searchStartObj = new Date(`${search.fecha}T${search.hora_inicio}:00`);
            const diffInHours = (searchStartObj - now) / (1000 * 60 * 60);

            if (diffInHours < 2) {
              await supabase.from('buscar').delete().eq('id', search.id);
            } else {
              busquedasValidas.push(search);
            }
          }
          setActiveSearches(busquedasValidas);
        }
      };
      cargarBúsquedas();
    } else {
      setActiveSearches([]); 
    }
  }, [currentUser]);

  // --- CARGAR PARTIDOS CONFIRMADOS ---
  const fetchPartidos = async () => {
    if (!currentUser) return;
    try {
      const { data: matches, error } = await supabase
        .from('partidos')
        .select('*')
        .or(`jugador1_id.eq.${currentUser.id},jugador2_id.eq.${currentUser.id}`)
        .order('fecha', { ascending: false });

      if (error) throw error;

      if (matches && matches.length > 0) {
        const partidosConRivales = await Promise.all(matches.map(async (partido) => {
          const rivalId = partido.jugador1_id === currentUser.id ? partido.jugador2_id : partido.jugador1_id;
          const { data: rivalData } = await supabase.from('Perfiles').select('id, nombre, elo').eq('id', rivalId).single();
          return { ...partido, rival: rivalData || { id: '?', nombre: 'Jugador Desconocido', elo: '?' } };
        }));
        setMisPartidos(partidosConRivales);
      } else {
        setMisPartidos([]);
      }
    } catch (error) {
      console.error("Error al cargar partidos:", error);
    }
  };

  useEffect(() => {
    fetchPartidos();
  }, [currentUser, tab]);

  // --- UTILIDADES ---
  const formatTime = (time24) => {
    if (!time24) return '';
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

  // Función para saber en qué etapa cronológica está el partido
  const obtenerEstadoTiempo = (partido) => {
    // Dividimos el texto para que iPhone no se confunda con la zona horaria
    const [year, month, day] = partido.fecha.split('-');
    const [startH, startM] = partido.hora_inicio.split(':');
    const [endH, endM] = partido.hora_fin.split(':');

    // Creamos la fecha local exacta (el mes empieza en 0, por eso month - 1)
    const inicioPartido = new Date(year, month - 1, day, startH, startM);
    const finPartido = new Date(year, month - 1, day, endH, endM);

    if (currentTime < inicioPartido) return 'futuro'; 
    if (currentTime >= inicioPartido && currentTime < finPartido) return 'en_curso'; 
    return 'terminado'; 
  };

  // Función para calcular la cuenta regresiva
  const getCountdown = (partido) => {
    const [year, month, day] = partido.fecha.split('-');
    const [startH, startM] = partido.hora_inicio.split(':');
    const inicioPartido = new Date(year, month - 1, day, startH, startM);
    
    const diff = inicioPartido - currentTime;
    if (diff <= 0) return "00:00:00";
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Función para calcular la cuenta regresiva
  const getCountdown = (partido) => {
    const inicioPartido = new Date(`${partido.fecha}T${partido.hora_inicio}:00`);
    const diff = inicioPartido - currentTime;
    if (diff <= 0) return "00:00:00";
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderBalls = (score) => {
    // CANDADO PARA EVITAR NÚMEROS LOCOS EN LA BD
    let rawScore = Number(score);
    if (isNaN(rawScore) || rawScore === 0) rawScore = 5.0;
    const numericScore = Math.min(5.0, rawScore); // Topamos visualmente a 5.0 máximo

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((ball) => {
            let opacityClass = "opacity-20 grayscale"; 
            if (numericScore >= ball) opacityClass = "opacity-100"; 
            else if (numericScore >= ball - 0.5) opacityClass = "opacity-50 scale-75"; 
            
            return <span key={ball} className={`text-2xl transition-all ${opacityClass}`}>🎾</span>;
          })}
        </div>
        <span className="text-[10px] font-black italic text-[#1A1C1E]/60 tracking-widest">{numericScore.toFixed(1)} / 5.0</span>
      </div>
    );
  };

  // --- MOTOR MATEMÁTICO: ELO Y CONFIANZA ---
  const calculateElo = (miElo, rivalElo, gane) => {
    const K = 40;
    const expectedScore = 1 / (1 + Math.pow(10, (rivalElo - miElo) / 400));
    const actualScore = gane ? 1 : 0;
    return Math.round(miElo + K * (actualScore - expectedScore));
  };

  const calcularNuevaConfianza = (confianzaActual, rachaActual) => {
    let nuevaConfianza = Number(confianzaActual);
    let nuevaRacha = rachaActual + 1;

    // Recuperación de media pelota en rachas clave
    if (nuevaRacha === 5 || nuevaRacha === 8 || nuevaRacha === 10 || nuevaRacha > 10) {
       nuevaConfianza = Math.min(5.0, nuevaConfianza + 0.5);
    }
    return { nuevaConfianza, nuevaRacha };
  };

  // --- FLUJO DE REPORTE (JUEZ DE SILLA) ---
  const handleSubmitReport = async (partido) => {
    if (!marcador.trim() || !ganadorId) {
      alert('Ingresa el marcador y selecciona al ganador.');
      return;
    }
    try {
      const { error } = await supabase
        .from('partidos')
        .update({ 
          estado: 'en_revision', 
          marcador: marcador, 
          ganador_id: ganadorId, 
          reportado_por: currentUser.id 
        })
        .eq('id', partido.id);

      if (error) throw error;
      setReportingMatch(null);
      setMarcador('');
      setGanadorId('');
      fetchPartidos(); 
      alert('Reporte enviado. Esperando confirmación del rival.');
    } catch (error) {
      console.error("Error al reportar:", error);
      alert('Hubo un error al enviar el reporte.');
    }
  };

  const handleConfirmReport = async (partido) => {
    try {
      const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
      
      const yoGane = partido.ganador_id === currentUser.id;
      const miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, yoGane);
      const rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, !yoGane);

      const misNuevosDatos = calcularNuevaConfianza(currentUser.confianza, currentUser.racha_asistencia);
      const rivalNuevosDatos = calcularNuevaConfianza(rivalDB.confianza, rivalDB.racha_asistencia);

      const { data: miPerfilActualizado } = await supabase.from('Perfiles')
        .update({ elo: miNuevoElo, confianza: misNuevosDatos.nuevaConfianza, racha_asistencia: misNuevosDatos.nuevaRacha })
        .eq('id', currentUser.id)
        .select().single();
      
      await supabase.from('Perfiles')
        .update({ elo: rivalNuevoElo, confianza: rivalNuevosDatos.nuevaConfianza, racha_asistencia: rivalNuevosDatos.nuevaRacha })
        .eq('id', rivalDB.id);

      await supabase.from('partidos').update({ estado: 'finalizado' }).eq('id', partido.id);

      setCurrentUser(miPerfilActualizado);
      localStorage.setItem('vad_session', JSON.stringify(miPerfilActualizado));
      
      fetchPartidos();
      alert(`¡Partido finalizado!\nTu nuevo ELO es: ${miNuevoElo}`);

    } catch (error) {
      console.error(error);
      alert('Error al confirmar el partido.');
    }
  };

  const handleWO = async (partido) => {
    const confirmar = window.confirm("¿Estás seguro de reportar que tu rival no se presentó? Esto penalizará fuertemente su ELO y Confianza.");
    if (!confirmar) return;

    try {
      const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
      
      const miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, true);
      const rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, false);

      const misNuevosDatos = calcularNuevaConfianza(currentUser.confianza, currentUser.racha_asistencia);
      const rivalConfianzaCastigada = Math.max(0, Number(rivalDB.confianza) - 1.0); 

      await supabase.from('Perfiles')
        .update({ elo: miNuevoElo, confianza: misNuevosDatos.nuevaConfianza, racha_asistencia: misNuevosDatos.nuevaRacha })
        .eq('id', currentUser.id);
      
      await supabase.from('Perfiles')
        .update({ elo: rivalNuevoElo, confianza: rivalConfianzaCastigada, racha_asistencia: 0 })
        .eq('id', rivalDB.id);

      await supabase.from('partidos').update({ estado: 'wo', ganador_id: currentUser.id }).eq('id', partido.id);

      const { data: miPerfilFresquito } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single();
      setCurrentUser(miPerfilFresquito);
      localStorage.setItem('vad_session', JSON.stringify(miPerfilFresquito));
      
      fetchPartidos();
      alert('Reporte por W.O. procesado. El sistema ha ajustado las puntuaciones.');
    } catch (error) {
      console.error(error);
    }
  };

  // --- AUTENTICACIÓN BÁSICA ---
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
      setAuthError('Error de conexión al circuito.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    const nameParts = registrationName.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setAuthError('El anonimato no está permitido. Ingresa nombre y apellido reales.');
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
          confianza: 5.0, 
          racha_asistencia: 0 
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
      setAuthError('Error al crear tu cuenta.');
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

  // --- MOTOR DE MATCHMAKING BLINDADO ---
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setSearchError(''); 
    if (!isLoggedIn) { setTab('auth'); return; }
    if (startTime >= endTime) { setSearchError('La hora límite debe ser después de inicio.'); return; }
    
    const now = new Date();
    const searchStartObj = new Date(`${searchDate}T${startTime}:00`);
    const diffInHoursNotice = (searchStartObj - now) / (1000 * 60 * 60);

    if (diffInHoursNotice < 3) {
      setSearchError('Debes programar tu búsqueda con al menos 3 horas de anticipación.');
      return;
    }

    const hasOverlap = activeSearches.some(search => {
      if (search.fecha !== searchDate) return false; 
      return (startTime < search.hora_fin && endTime > search.hora_inicio);
    });
    if (hasOverlap) { setSearchError('Ya tienes una búsqueda activa en este rango.'); return; }

    try {
      // 1. ESCANEAR CANCHAS OCUPADAS EN ESE HORARIO
      const { data: partidosOcupados } = await supabase
        .from('partidos')
        .select('cancha_numero, superficie')
        .eq('fecha', searchDate)
        .or(`hora_inicio.lt.${endTime},hora_fin.gt.${startTime}`);

      const canchasOcupadasEnSuperficie = partidosOcupados
        ? partidosOcupados.filter(p => p.superficie === superficie).map(p => p.cancha_numero)
        : [];

      // INVENTARIO DEL CLUB
      const inventario = { 'Sacate': [1], 'Arcilla': [2], 'Dura': [3, 4] };
      const canchaDisponible = inventario[superficie].find(n => !canchasOcupadasEnSuperficie.includes(n));

      if (!canchaDisponible) {
        setSearchError(`No hay canchas de ${superficie} disponibles en ese horario.`);
        return;
      }

      // 2. BUSCAR RIVAL
      const { data: posiblesRivales, error: fetchError } = await supabase
        .from('buscar')
        .select('*')
        .eq('fecha', searchDate)
        .eq('superficie', superficie) // DEBE COINCIDIR SUPERFICIE
        .neq('jugador_id', currentUser.id)
        .eq('estado', 'activa');

      if (fetchError) throw new Error("Error al leer el radar: " + fetchError.message);

      let matchEncontrado = null;
      let matchInicio = '';
      let matchFin = '';

      if (posiblesRivales && posiblesRivales.length > 0) {
        for (let rival of posiblesRivales) {
          const hayCruceHorario = (startTime < rival.hora_fin && endTime > rival.hora_inicio);
          
          if (hayCruceHorario) {
            const inicioCruce = startTime > rival.hora_inicio ? startTime : rival.hora_inicio;
            const finCruce = endTime < rival.hora_fin ? endTime : rival.hora_fin;
            
            const startObj = new Date(`2000-01-01T${inicioCruce}`);
            const endObj = new Date(`2000-01-01T${finCruce}`);
            const horasCruce = (endObj - startObj) / (1000 * 60 * 60);

            const { data: perfilRival } = await supabase.from('Perfiles').select('elo').eq('id', rival.jugador_id).single();
            const eloRival = perfilRival?.elo || 1000;
            const diferenciaElo = Math.abs(currentUser.elo - eloRival);
            
            if (diferenciaElo <= 200 && horasCruce >= 1) {
              matchEncontrado = rival;
              matchInicio = inicioCruce;
              
              if (horasCruce > 2) {
                startObj.setHours(startObj.getHours() + 2);
                matchFin = startObj.toTimeString().substring(0,5); 
              } else {
                matchFin = finCruce;
              }
              break;
            }
          }
        }
      }

      if (matchEncontrado) {
        const { error: insertMatchError } = await supabase
          .from('partidos')
          .insert([{
            jugador1_id: matchEncontrado.jugador_id,
            jugador2_id: currentUser.id,
            fecha: searchDate,
            hora_inicio: matchInicio,
            hora_fin: matchFin,
            superficie: superficie, 
            cancha_numero: canchaDisponible,
            estado: 'confirmado'
          }]);
        
        if (insertMatchError) throw new Error("Error Supabase: " + insertMatchError.message);

        await supabase.from('buscar').delete().eq('id', matchEncontrado.id);
        alert(`¡MATCH ENCONTRADO!\nTienes un partido confirmado en Cancha ${canchaDisponible} (${superficie}).`);
        setTab('partidos');
        fetchPartidos();
      } else {
        const { data: nuevaBusqueda, error: insertError } = await supabase
          .from('buscar')
          .insert([{ 
            jugador_id: currentUser.id, 
            nombre: currentUser.nombre, 
            fecha: searchDate, 
            hora_inicio: startTime, 
            hora_fin: endTime, 
            superficie: superficie, 
            estado: 'activa' 
          }])
          .select().single();

        if (insertError) throw new Error("Error Supabase al publicar: " + insertError.message);
        setActiveSearches([...activeSearches, nuevaBusqueda]); 
        alert('Búsqueda publicada. Te avisaremos en cuanto alguien de tu nivel haga match.');
      }
    } catch (error) {
      setSearchError(error.message || 'Hubo un error en el circuito.');
    }
  };

  const handleCancelSearch = async (id) => {
    try {
      await supabase.from('buscar').delete().eq('id', id);
      setActiveSearches(prev => prev.filter(search => search.id !== id));
    } catch (error) {
      alert('Error al eliminar de la base de datos.');
    }
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setTab('auth'); return; }
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
              <h1 className="text-7xl font-black italic tracking-tighter leading-[0.9] uppercase mb-8 text-[#29C454]">
                VENTAJA <br /> <span className="text-transparent" style={{ WebkitTextStroke: '2px #1A1C1E' }}>ADENTRO.</span>
              </h1>
              <p className="text-[#1A1C1E] text-lg max-w-sm leading-relaxed italic border-t-2 border-[#29C454] pt-4">
                "Matchmaking por ELO, ranking de confianza y reservas inteligentes. La comunidad que premia a los que sí aparecen."
              </p>
            </section>
            <button onClick={() => isLoggedIn ? setTab('buscar') : setTab('auth')} className="w-fit mx-auto block px-10 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
              {isLoggedIn ? "Buscar rival ➜" : "Únete ➜"}
            </button>
          </div>
        )}

        {/* VISTA AUTH */}
        {tab === 'auth' && (
          <div className="w-full max-w-sm mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
            {!isRegistering ? (
              <>
                <div className="text-center">
                  <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mb-2">Acceso Oficial</h2>
                  <p className="text-[#1A1C1E]/60 text-sm">Tu celular es tu identidad.</p>
                </div>
                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Celular</label>
                    <div className="flex gap-2">
                      <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)} className="w-1/3 bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-2 py-4 text-[#1A1C1E] font-bold shadow-sm appearance-none cursor-pointer">
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+1">🇺🇸 +1</option>
                      </select>
                      <input type="tel" required maxLength="10" placeholder="123 456 7890" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className="w-2/3 bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-bold tracking-widest focus:outline-none focus:border-[#29C454]" />
                    </div>
                  </div>
                  <div className="space-y-2 text-left mt-2">
                    <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">PIN (4 dígitos)</label>
                    <input type="password" inputMode="numeric" required maxLength="4" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-center text-2xl tracking-[1em] text-[#1A1C1E] font-black focus:outline-none focus:border-[#29C454]" />
                  </div>
                  {authError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center animate-in fade-in">{authError}</div>}
                  <button type="submit" disabled={authLoading} className="w-full bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all mt-4">
                    {authLoading ? 'Conectando...' : 'Entrar al Circuito ➜'}
                  </button>
                </form>
                <button onClick={() => setTab('home')} className="w-full text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest pt-2">Cancelar</button>
              </>
            ) : (
              <div className="animate-in fade-in space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight mb-2">Nuevo Jugador</h2>
                  <p className="text-[#1A1C1E]/60 text-sm">Crea tu perfil ahora.</p>
                </div>
                <form onSubmit={handleCompleteRegistration} className="space-y-6">
                  <input type="text" required placeholder="Nombre y Apellido" value={registrationName} onChange={(e) => setRegistrationName(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-bold focus:outline-none focus:border-[#29C454]" />
                  {authError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center">{authError}</div>}
                  <button type="submit" disabled={authLoading} className="w-full bg-[#1A1C1E] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg">Completar Registro ➜</button>
                </form>
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
                  <input type="date" min={initData.date} value={searchDate} onChange={(e) => setSearchDate(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                </div>
                
                {/* SELECTOR DE SUPERFICIE RE-INYECTADO */}
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Superficie Preferida</label>
                  <select value={superficie} onChange={(e) => setSuperficie(e.target.value)} className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none">
                    <option value="Dura">Cancha Dura (Rápida)</option>
                    <option value="Arcilla">Arcilla (Tierra Batida)</option>
                    <option value="Sacate">Sacate (Césped)</option>
                  </select>
                </div>

                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Franja de Disponibilidad</label>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-center focus:outline-none focus:border-[#29C454]" />
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-center focus:outline-none focus:border-[#29C454]" />
                  </div>
                </div>
                {searchError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center leading-relaxed">{searchError}</div>}
              </div>
              <div className="pt-6 flex flex-col items-center">
                <button type="submit" className="w-fit flex items-center justify-center gap-2 px-8 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all">
                  <span className="text-[#F8F7F2] animate-pulse">●</span> Buscar rival
                </button>
              </div>
            </form>
            
            {isLoggedIn && activeSearches.length > 0 && (
              <div className="pt-8 space-y-4 animate-in fade-in w-full">
                <h3 className="text-sm font-black italic text-[#1A1C1E] uppercase border-b border-[#1A1C1E]/10 pb-2">Búsquedas Activas</h3>
                <div className="space-y-3">
                  {activeSearches.map((search) => (
                    <div key={search.id} className="bg-[#FFFFFF] border border-[#29C454]/30 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1 h-full bg-[#29C454] animate-pulse"></div>
                      <div className="pl-2 text-left">
                        <p className="text-[10px] font-bold text-[#1A1C1E]/50 uppercase tracking-widest">
                          {new Date(search.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} 
                          {search.superficie && ` • ${search.superficie}`}
                        </p>
                        <p className="text-sm font-black text-[#1A1C1E] mt-1">{formatTime(search.hora_inicio)} - {formatTime(search.hora_fin)}</p>
                      </div>
                      <button onClick={() => handleCancelSearch(search.id)} className="w-10 h-10 bg-[#F8F7F2] text-[#1A1C1E]/40 rounded-full hover:bg-red-50 hover:text-red-500">✕</button>
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
            </div>
            <form onSubmit={handleBookSubmit} className="w-full">
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-6 shadow-sm space-y-6 relative w-full">
                <input type="date" min={initData.date} value={bookDate} onChange={(e) => setBookDate(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                <div className="grid grid-cols-2 gap-3 w-full">
                  <input type="time" value={bookStart} onChange={(e) => setBookStart(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center" />
                  <input type="time" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-sm text-center" />
                </div>
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full px-8 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all">Pagar Reserva ➜</button>
              </div>
            </form>
          </div>
        )}

        {/* VISTA: MIS PARTIDOS Y JUEZ DE SILLA */}
        {tab === 'partidos' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-sm mx-auto">
            <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight text-center">Tu Circuito</h2>
            <div className={`space-y-4 text-left ${!isLoggedIn && 'opacity-80'}`}>
              
              {!isLoggedIn ? (
                <div className="bg-[#29C454] text-white rounded-[2rem] p-6 shadow-lg shadow-[#29C454]/20 relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-10 text-8xl transform translate-x-4 -translate-y-4">🎾</div>
                  <div className="relative z-10">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Jueves, 16 Abril</p>
                    <h4 className="text-3xl font-black italic mb-4">6:00 PM - 8:00 PM</h4>
                    <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl border border-white/20">
                      <div className="w-10 h-10 bg-white text-[#29C454] rounded-full flex items-center justify-center font-black italic">MC</div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-70">Rival Confirmado</p>
                        <p className="font-black italic">Mateo C. (1,250 Pts)</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : misPartidos.length === 0 ? (
                <div className="text-center bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm">
                  <p className="text-4xl mb-4 opacity-50">🕸️</p>
                  <p className="text-[#1A1C1E]/60 font-bold text-sm">Aún no tienes partidos.</p>
                  <button onClick={() => setTab('buscar')} className="mt-6 px-6 py-3 bg-[#F8F7F2] text-[#29C454] rounded-xl font-black uppercase tracking-widest text-[10px] border border-[#29C454]/20 hover:bg-[#29C454]/10">
                    Buscar Rival
                  </button>
                </div>
              ) : (
                misPartidos.map((partido) => (
                  <div key={partido.id} className={`${partido.estado === 'confirmado' ? 'bg-[#29C454]' : partido.estado === 'en_revision' ? 'bg-[#E5B824]' : 'bg-[#1A1C1E]'} text-white rounded-[2rem] p-6 shadow-lg shadow-[#1A1C1E]/10 relative overflow-hidden transition-colors`}>
                    <div className="absolute right-0 top-0 opacity-10 text-8xl transform translate-x-4 -translate-y-4">🎾</div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                          {new Date(partido.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        {partido.cancha_numero && (
                          <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Cancha {partido.cancha_numero} ({partido.superficie})
                          </span>
                        )}
                      </div>
                      <h4 className="text-3xl font-black italic mb-4">
                        {formatTime(partido.hora_inicio)} - {formatTime(partido.hora_fin)}
                      </h4>
                      <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20 mb-4">
                        <div className="w-10 h-10 bg-white text-[#1A1C1E] rounded-full flex items-center justify-center font-black italic uppercase">
                          {getInitials(partido.rival.nombre)}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-black opacity-70">
                            {partido.estado === 'finalizado' || partido.estado === 'wo' ? 'Rival del partido' : 'Rival Confirmado'}
                          </p>
                          <p className="font-black italic">{partido.rival.nombre} ({partido.rival.elo} Pts)</p>
                        </div>
                      </div>

                      {/* --- ESTADOS DEL PARTIDO --- */}
                      {partido.estado === 'confirmado' && (
                        <>
                          {obtenerEstadoTiempo(partido) === 'futuro' ? (
                            <div className="text-center py-4 bg-white/10 rounded-2xl border border-dashed border-white/30">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">El partido inicia en</p>
                              <p className="text-2xl font-black italic tracking-widest font-mono">{getCountdown(partido)}</p>
                            </div>
                          ) : obtenerEstadoTiempo(partido) === 'en_curso' ? (
                            <div className="text-center py-4 bg-white/10 rounded-2xl border border-dashed border-white/30">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-[#E5B824]">Partido en curso 🔥</p>
                              <p className="text-[9px] opacity-60 mt-1">El reporte se habilitará al terminar el tiempo.</p>
                            </div>
                          ) : reportingMatch === partido.id ? (
                            <div className="mt-4 bg-white/20 p-4 rounded-xl space-y-3 animate-in fade-in">
                              <p className="text-xs font-bold uppercase tracking-widest">Reportar Resultado</p>
                              <input type="text" placeholder="Ej: 6-4, 6-3" value={marcador} onChange={(e) => setMarcador(e.target.value)} className="w-full bg-[#FFFFFF] border-none rounded-xl px-4 py-3 text-[#1A1C1E] font-bold focus:outline-none" />
                              <select value={ganadorId} onChange={(e) => setGanadorId(e.target.value)} className="w-full bg-[#FFFFFF] border-none rounded-xl px-4 py-3 text-[#1A1C1E] font-bold focus:outline-none appearance-none">
                                <option value="">¿Quién ganó?</option>
                                <option value={currentUser.id}>🏆 Yo gané</option>
                                <option value={partido.rival.id}>🏆 {partido.rival.nombre} ganó</option>
                              </select>
                              <div className="flex gap-2 pt-2">
                                <button onClick={() => setReportingMatch(null)} className="flex-1 bg-white/20 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Cancelar</button>
                                <button onClick={() => handleSubmitReport(partido)} className="flex-1 bg-[#1A1C1E] py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Enviar</button>
                              </div>
                              <button 
                                onClick={() => handleWO(partido)} 
                                className="w-full mt-4 border-2 border-red-500/40 bg-red-500/10 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"
                              >
                                🚨 El rival no se presentó (W.O.)
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setReportingMatch(partido.id)} className="w-full bg-[#1A1C1E] text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-lg active:scale-95 transition-all">
                              Reportar Resultado ➜
                            </button>
                          )}
                        </>
                      )}

                      {partido.estado === 'en_revision' && partido.reportado_por === currentUser.id && (
                        <div className="bg-white/20 p-4 rounded-xl text-center border border-white/30">
                          <p className="text-xs font-black uppercase tracking-widest">⏳ Esperando confirmación</p>
                          <p className="text-[10px] mt-1 opacity-80">El rival debe entrar a su app y aceptar el marcador ({partido.marcador}).</p>
                        </div>
                      )}

                      {partido.estado === 'en_revision' && partido.reportado_por !== currentUser.id && (
                        <div className="bg-white/20 p-4 rounded-xl text-center border border-white/30">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">🚨 Acción Requerida</p>
                          <p className="text-sm font-black mb-4">El rival reportó: "{partido.marcador}"</p>
                          <button onClick={() => handleConfirmReport(partido)} className="w-full bg-[#1A1C1E] text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs mb-2">
                            ✅ Aceptar Resultado
                          </button>
                          <p className="text-[9px] opacity-60">Al aceptar, se ajustará el ELO de ambos.</p>
                        </div>
                      )}

                      {partido.estado === 'finalizado' && (
                        <div className="bg-white/10 p-3 rounded-xl text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Marcador Final</p>
                          <p className="font-black italic text-lg">{partido.marcador}</p>
                        </div>
                      )}

                      {partido.estado === 'wo' && (
                        <div className="bg-red-500/20 p-3 rounded-xl text-center border border-red-500/30">
                          <p className="text-xs font-black uppercase tracking-widest text-red-200">Victoria por W.O.</p>
                        </div>
                      )}

                    </div>
                  </div>
                ))
              )}
            </div>
            {!isLoggedIn && (
              <button onClick={() => setTab('auth')} className="w-full mt-6 bg-[#29C454] text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-lg animate-bounce">
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
              <div className="w-24 h-24 bg-[#F8F7F2] rounded-full border-4 border-[#29C454] flex items-center justify-center text-[#1A1C1E] font-black italic text-4xl mb-4 uppercase">
                {isLoggedIn && currentUser ? getInitials(currentUser.nombre) : '🎾'}
              </div>
              <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight">
                {isLoggedIn && currentUser ? currentUser.nombre : 'Jugador Pro'}
              </h2>
              <p className="text-[#1A1C1E]/50 font-bold tracking-widest text-sm mb-6">
                {isLoggedIn && currentUser ? currentUser.telefono : 'Regístrate'}
              </p>
              {renderBalls(isLoggedIn && currentUser ? currentUser.confianza : 5.0)}
              <div className="flex gap-4 w-full mt-6 border-t border-[#1A1C1E]/10 pt-6">
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-black text-[#1A1C1E]/40 uppercase tracking-widest mb-1">Tu ELO</p>
                  <p className="text-3xl font-black italic text-[#29C454]">{isLoggedIn && currentUser ? currentUser.elo : '1,000'}</p>
                </div>
              </div>
            </div>
            {isLoggedIn && (
              <button onClick={handleLogout} className="w-full bg-[#F8F7F2] border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-50 transition-colors">Cerrar Sesión</button>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#F8F7F2]/90 backdrop-blur-lg border-t border-[#1A1C1E]/5 px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {[{ id: 'home', icon: '🏠' }, { id: 'buscar', icon: '🔍' }, { id: 'reservar', icon: '📅' }, { id: 'partidos', icon: '🎾' }, { id: 'perfil', icon: '👤' }].map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${tab === item.id ? 'bg-[#29C454] text-white scale-110 shadow-lg' : 'text-[#1A1C1E]/40'}`}>
              <div className="relative">
                <span className="text-xl">{item.icon}</span>
                {/* NOTIFICACIÓN AZUL TENIS SI HAY PARTIDOS */}
                {item.id === 'partidos' && misPartidos.length > 0 && misPartidos.some(p => p.estado === 'confirmado' || (p.estado === 'en_revision' && p.reportado_por !== currentUser.id)) && (
                  <span className="absolute -top-1 -right-2 w-3 h-3 bg-[#007AFF] rounded-full animate-pulse border-2 border-[#F8F7F2] shadow-md"></span>
                )}
              </div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}