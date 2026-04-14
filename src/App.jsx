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
  const [comentario, setComentario] = useState('');
  
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
  const [superficie, setSuperficie] = useState('Dura');
  const [activeSearches, setActiveSearches] = useState([]);
  const [searchError, setSearchError] = useState('');

  // ESTADOS PARA LOS PARTIDOS Y REPORTES
  const [misPartidos, setMisPartidos] = useState([]);
  const [reportingMatch, setReportingMatch] = useState(null);

  // ESTADOS DEL FORMULARIO DE REPORTE (NUEVO)
  const [s1Mi, setS1Mi] = useState('');
  const [s1Rival, setS1Rival] = useState('');
  const [s2Mi, setS2Mi] = useState('');
  const [s2Rival, setS2Rival] = useState('');
  const [s3Mi, setS3Mi] = useState('');
  const [s3Rival, setS3Rival] = useState('');

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
    // Bloqueamos que se cuele un "null" literal
    if (savedUser && savedUser !== 'null') {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem('vad_session');
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
  }, [currentUser, tab]);

  // --- CARGAR PARTIDOS CONFIRMADOS Y SINCRONIZAR ELO ---
  const fetchPartidos = async () => {
    if (!currentUser) return;
    try {
      // 1. Refrescar el perfil silenciosamente
      const { data: freshUser } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single();
      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem('vad_session', JSON.stringify(freshUser));
      }

      // 2. Cargar los partidos sin orden forzado desde Supabase (lo haremos acá)
      const { data: matches, error } = await supabase
        .from('partidos')
        .select('*')
        .or(`jugador1_id.eq.${currentUser.id},jugador2_id.eq.${currentUser.id}`);

      if (error) throw error;

      if (matches && matches.length > 0) {
        const partidosConRivales = await Promise.all(matches.map(async (partido) => {
          const rivalId = partido.jugador1_id === currentUser.id ? partido.jugador2_id : partido.jugador1_id;
          const { data: rivalData } = await supabase.from('Perfiles').select('id, nombre, elo').eq('id', rivalId).single();
          return { ...partido, rival: rivalData || { id: '?', nombre: 'Jugador Desconocido', elo: '?' } };
        }));

        // ORDENAMIENTO INTELIGENTE VAd.
        partidosConRivales.sort((a, b) => {
          const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
          const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
          
          const isA_Active = a.estado === 'confirmado' || a.estado === 'en_revision';
          const isB_Active = b.estado === 'confirmado' || b.estado === 'en_revision';

          if (isA_Active && !isB_Active) return -1; // Activos arriba
          if (!isA_Active && isB_Active) return 1;  // Finalizados abajo
          
          if (isA_Active && isB_Active) {
            return dateA - dateB; // Activos: El más próximo primero (Ascendente)
          } else {
            return dateB - dateA; // Finalizados: El más reciente primero (Descendente)
          }
        });

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

  // --- ESCUCHA EN TIEMPO REAL (NOTIFICACIONES MÁGICAS) ---
  useEffect(() => {
    if (!currentUser) return;

    const canalActualizaciones = supabase.channel('alertas-vad')
      // Escuchar si alguien CANCELA (borra) un partido
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'partidos' }, (payload) => {
        fetchPartidos(); // Refresca la pantalla al instante
        alert('🚨 Atención: Tu rival ha cancelado el partido. Te hemos regresado a la sala de búsqueda automáticamente.');
      })
      // Escuchar si alguien REPORTA un resultado (para que se actualice solo)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'partidos' }, (payload) => {
        fetchPartidos(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalActualizaciones);
    };
  }, [currentUser]);

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

  // Función ESPEJO: Siempre muestra "Mi Score - Su Score"
  const getRelativeMarcador = (partido) => {
    if (partido.estado === 'wo') return 'W.O.';
    if (!partido.marcador) return '';
    
    // Si el rival fue quien reportó, invertimos los números para que los leas desde TU perspectiva
    if (partido.reportado_por && partido.reportado_por !== currentUser?.id) {
      return partido.marcador.split(',').map(set => {
        const scores = set.trim().split('-');
        if (scores.length === 2) return `${scores[1]}-${scores[0]}`;
        return set;
      }).join(', ');
    }
    
    return partido.marcador;
  };

  // Función para saber en qué etapa cronológica está el partido
  const obtenerEstadoTiempo = (partido) => {
    const [year, month, day] = partido.fecha.split('-');
    const [startH, startM] = partido.hora_inicio.split(':');
    const [endH, endM] = partido.hora_fin.split(':');

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

  const renderBalls = (score) => {
    let rawScore = Number(score);
    if (isNaN(rawScore) || rawScore === 0) rawScore = 5.0;
    const numericScore = Math.min(5.0, rawScore);

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

  // --- MOTOR MATEMÁTICO VAd: PROBABILIDAD LINEAL Y PISO DE 1000 ---
  const calculateElo = (miElo, rivalElo, marcador, yoGane) => {
    const K = 60; // Puntos máximos en juego
    
    // 1. Calculamos la diferencia y la limitamos a +/- 200
    let diff = rivalElo - miElo;
    if (diff > 200) diff = 200;
    if (diff < -200) diff = -200;

    // 2. Probabilidad Lineal VAd (Base 500 para dar un rango de 10% a 90%)
    const expectedScore = 0.5 - (diff / 500);
    
    // 3. Multiplicador de Sets
    const setsJugados = marcador ? marcador.split(',').length : 2; 
    const fueBarrida = setsJugados === 2;

    let S = 0;
    if (yoGane) {
      S = fueBarrida ? 1.0 : 0.85; // Ganar 2-0 da el botín completo
    } else {
      S = fueBarrida ? 0.0 : 0.15; // Si lograste sacar 1 set, duele menos
    }

    // 4. Cálculo final redondeado
    let nuevoElo = Math.round(miElo + K * (S - expectedScore));

    // 5. PISO DE CONCRETO: Nadie cae a los abismos de la depresión
    if (nuevoElo < 1000) {
      nuevoElo = 1000;
    }

    return nuevoElo;
  };

  const calcularNuevaConfianza = (confianzaActual, rachaActual) => {
    let nuevaConfianza = Number(confianzaActual);
    let nuevaRacha = rachaActual + 1;

    if (nuevaRacha === 5 || nuevaRacha === 8 || nuevaRacha === 10 || nuevaRacha > 10) {
       nuevaConfianza = Math.min(5.0, nuevaConfianza + 0.5);
    }
    return { nuevaConfianza, nuevaRacha };
  };

  // --- FLUJO DE REPORTE AUTOMATIZADO CON FRENO DE MANO ---
  const handleSubmitReport = async (partido) => {
    if (!s1Mi || !s1Rival || !s2Mi || !s2Rival) {
      alert('Debes ingresar al menos los resultados de los 2 primeros sets.');
      return;
    }

    // Convertimos el texto a números reales
    const v1Mi = parseInt(s1Mi, 10);
    const v1Riv = parseInt(s1Rival, 10);
    const v2Mi = parseInt(s2Mi, 10);
    const v2Riv = parseInt(s2Rival, 10);

    let setsMi = (v1Mi > v1Riv ? 1 : 0) + (v2Mi > v2Riv ? 1 : 0);
    let setsRiv = (v1Riv > v1Mi ? 1 : 0) + (v2Riv > v2Mi ? 1 : 0);
    let marcadorFinal = `${v1Mi}-${v1Riv}, ${v2Mi}-${v2Riv}`;

    if (s3Mi && s3Rival) {
      const v3Mi = parseInt(s3Mi, 10);
      const v3Riv = parseInt(s3Rival, 10);
      setsMi += (v3Mi > v3Riv ? 1 : 0);
      setsRiv += (v3Riv > v3Mi ? 1 : 0);
      marcadorFinal += `, ${v3Mi}-${v3Riv}`;
    }

    if (setsMi === setsRiv) {
      alert('Los sets están empatados. Verifica los números, tiene que haber un ganador claro.');
      return;
    }

    // El sistema decide quién ganó
    const yoGane = setsMi > setsRiv;
    const ganadorIdCalculado = yoGane ? currentUser.id : partido.rival.id;

    // 🚨 FRENO DE MANO: Le avisamos al usuario antes de mandarlo
    const nombreGanador = yoGane ? "TÚ" : partido.rival.nombre.toUpperCase();
    const mensajeConfirmacion = `Revisa bien:\n\nSegún los números que ingresaste, el ganador es: ${nombreGanador} 🏆\n\n¿Estás seguro de enviar este resultado a revisión?`;
    
    if (!window.confirm(mensajeConfirmacion)) {
      return; // Si el usuario se da cuenta del error y le da a "Cancelar", detenemos todo.
    }

    // Si acepta, ahora sí lo mandamos a Supabase
    try {
      const { error } = await supabase
        .from('partidos')
        .update({ 
          estado: 'en_revision', 
          marcador: marcadorFinal, 
          ganador_id: ganadorIdCalculado, 
          reportado_por: currentUser.id 
        })
        .eq('id', partido.id);

      if (error) throw error;
      setReportingMatch(null);
      setS1Mi(''); setS1Rival(''); setS2Mi(''); setS2Rival(''); setS3Mi(''); setS3Rival('');
      fetchPartidos(); 
      alert('Reporte enviado a tu rival para confirmación.');
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    }
  };

  const handleConfirmReport = async (partido) => {
    try {
      const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
      
      const yoGane = partido.ganador_id === currentUser.id;
      
      const miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, partido.marcador, yoGane);
      const rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, partido.marcador, !yoGane);

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

      const perfilSeguro = miPerfilActualizado || { 
        ...currentUser, 
        elo: miNuevoElo, 
        confianza: misNuevosDatos.nuevaConfianza, 
        racha_asistencia: misNuevosDatos.nuevaRacha 
      };

      setCurrentUser(perfilSeguro);
      localStorage.setItem('vad_session', JSON.stringify(perfilSeguro));
      
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
      
      const miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, "6-0, 6-0", true);
      const rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, "6-0, 6-0", false);

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

  const handleCancelMatch = async (partido) => {
    const confirmar = window.confirm("¿Estás seguro de cancelar este partido? Recuerda que solo tienes 3 cancelaciones gratis al mes antes de empezar a perder pelotas de confianza.");
    if (!confirmar) return;

    try {
      await supabase.from('partidos').delete().eq('id', partido.id);
      
      await supabase.from('buscar').insert([{
        jugador_id: partido.rival.id,
        nombre: partido.rival.nombre,
        fecha: partido.fecha,
        hora_inicio: partido.hora_inicio,
        hora_fin: partido.hora_fin,
        superficie: partido.superficie,
        estado: 'activa'
      }]);

      fetchPartidos();
      alert('Partido cancelado. Hemos regresado a tu rival a la sala de espera para buscarle otro match.');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al cancelar el partido.');
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
          elo: 1200, 
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
    
    if (!isLoggedIn || !currentUser) { 
      setIsLoggedIn(false);
      setCurrentUser(null);
      localStorage.removeItem('vad_session');
      setTab('auth'); 
      return; 
    }
    
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

    const hasMatchOverlap = misPartidos.some(partido => {
      if (partido.fecha !== searchDate) return false; 
      if (partido.estado === 'finalizado' || partido.estado === 'wo') return false; 
      return (startTime < partido.hora_fin && endTime > partido.hora_inicio);
    });
    if (hasMatchOverlap) { setSearchError('Ya tienes un partido programado en este horario.'); return; }

    try {
      const { data: partidosOcupados } = await supabase
        .from('partidos')
        .select('cancha_numero, superficie')
        .eq('fecha', searchDate)
        .or(`hora_inicio.lt.${endTime},hora_fin.gt.${startTime}`);

      const canchasOcupadasEnSuperficie = partidosOcupados
        ? partidosOcupados.filter(p => p.superficie === superficie).map(p => p.cancha_numero)
        : [];

      const inventario = { 'Sacate': [1], 'Arcilla': [2], 'Dura': [3, 4] };
      const canchaDisponible = inventario[superficie].find(n => !canchasOcupadasEnSuperficie.includes(n));

      if (!canchaDisponible) {
        setSearchError(`No hay canchas de ${superficie} disponibles en ese horario.`);
        return;
      }

      const { data: posiblesRivales, error: fetchError } = await supabase
        .from('buscar')
        .select('*')
        .eq('fecha', searchDate)
        .eq('superficie', superficie)
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
        
        {/* VISTA HOME - DISEÑO UNIFICADO PREMIUM */}
        {tab === 'home' && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center pb-10 px-2">
            
            {/* 1. HERO ORIGINAL Y BOTÓN PRINCIPAL */}
            <section className="flex flex-col items-center">
              <h2 className="text-[#1A1C1E] font-black uppercase tracking-[0.4em] text-[13px] mb-4 drop-shadow-sm">Donde el tennis se vive</h2>
              <h1 className="text-7xl font-black italic tracking-tighter leading-[0.9] uppercase mb-8 text-[#29C454]">
                VENTAJA <br /> <span className="text-transparent" style={{ WebkitTextStroke: '2px #1A1C1E' }}>ADENTRO.</span>
              </h1>
              <p className="text-[#1A1C1E] text-lg max-w-sm leading-relaxed italic border-t-2 border-[#29C454] pt-4">
                Matchmaking inteligente, ranking ELO y torneos en vivo. La comunidad que premia a los que sí aparecen.
              </p>
              <button onClick={() => isLoggedIn ? setTab('buscar') : setTab('auth')} className="mt-8 w-fit mx-auto block px-10 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
                {isLoggedIn ? "Buscar rival ➜" : "Únete al Circuito ➜"}
              </button>
            </section>

            {/* SECCIONES DE EXPLICACIÓN (DISEÑO BLANCO Y HUESO) */}
            <section className="w-full text-left space-y-6">
              
              {/* 2. CÓMO FUNCIONA (BUSCADOR) */}
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 text-9xl">🔍</div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">El Buscador</h3>
                <p className="text-[#1A1C1E]/80 text-sm font-bold mb-6 relative z-10 leading-relaxed">El buscador mas sencillo para encontrar con quien jugar tennis.</p>
                <ul className="space-y-4 relative z-10 text-xs font-bold text-[#1A1C1E]/80">
                  <li className="flex gap-3">
                    <span className="text-[#29C454] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed">Busqueda con al menos 3 horas de anticipacion.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#29C454] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed">Busqueda activa con hasta 1 semana de anticipación.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#29C454] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed">Emparejamiento por diferencia de puntos:<span className="text-[#29C454]"> +/-200 puntos </span>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#29C454] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed">3 Cancelaciones al mes sin afectar ELO y confiabilidad.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#29C454] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed"><span className="text-[#29C454]">Si te cancelan el buscador se reactivara por ti.</span></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#29C454] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed"><span className="text-[#F50514]">Las cancelaciones deben de ser maximo 30 minutos antes del encuentro, de lo contrario se tomara como Walkover.</span></span>
                  </li>
                </ul>
              </div>

              {/* 3. SISTEMA ELO (MOTOR MATEMÁTICO VAd.) */}
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#29C454]/10 rounded-full blur-3xl"></div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">Motor ELO</h3>
                <p className="text-[#1A1C1E]/80 text-sm font-bold mb-6 relative z-10 leading-relaxed">Transparencia total. Un sistema diseñado para que tu ascenso dependa de tu nivel real en la cancha.</p>
                
                <div className="space-y-6 relative z-10 text-xs text-[#1A1C1E]">
                  <div className="bg-[#F8F7F2] p-5 rounded-2xl border border-[#1A1C1E]/5 shadow-inner space-y-5">
                    
                    <div>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#29C454]">1.</span> Inicio y Fuerzas</p>
                      <p className="font-bold leading-relaxed opacity-70">Todos inician en <span className="text-[#29C454]">5ta Fuerza (1,200 pts)</span>. El sistema te empareja con rivales en un rango de ±200 puntos. El piso mínimo es de 1,000 pts (6ta Fuerza) para proteger tu progreso.</p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#29C454]">2.</span> Velocidad K-Max (60)</p>
                      <p className="font-bold leading-relaxed opacity-70">El 'Factor K' es la potencia de ascenso. Si juegas contra alguien de tu nivel, K es 40. Si el rival te supera por el límite de <span className="text-[#29C454]">200 puntos</span>, K sube a <span className="text-[#29C454]">60</span> para acelerar tu subida.</p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#29C454]">3.</span> Probabilidad Lineal VAd.</p>
                      <p className="font-bold leading-relaxed opacity-70">A diferencia de otros sistemas, usamos un cálculo lineal: contra un rival 200 pts arriba, tu probabilidad de ganar es del 10%. Dar la sorpresa ahí te da el premio máximo de puntos.</p>
                    </div>

                    {/* Punto 4: Desglose Técnico */}
                    <div className="pt-2 border-t border-[#1A1C1E]/10">
                      <p className="font-black uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2"><span className="text-[#29C454]">4.</span> Desglose de la Fórmula</p>
                      
                      {/* Recuadro Verde Tenis Unificado */}
                      <div className="bg-[#29C454] p-5 rounded-2xl shadow-lg shadow-[#29C454]/20 text-left relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                        
                        {/* El whitespace-nowrap evita que la fórmula se parta en dos líneas */}
                        <p className="font-mono text-white text-[14px] tracking-widest text-center mb-4 font-black whitespace-nowrap drop-shadow-sm">
                          R' = R + K × (S - E)
                        </p>
                        
                        <ul className="space-y-2 text-[9px] font-bold text-white/90 uppercase tracking-tight">
                          <li><span className="font-black text-white text-[10px]">R':</span> Tu nuevo puntaje tras el partido.</li>
                          <li><span className="font-black text-white text-[10px]">R:</span> Tus puntos actuales.</li>
                          <li><span className="font-black text-white text-[10px]">K:</span> Constante de cambio = 60.</li>
                          <li><span className="font-black text-white text-[10px]">S:</span> Resultado (1.0 si ganas 2-0 / 0.85 si 2-1).</li>
                          <li><span className="font-black text-white text-[10px]">E:</span> Probabilidad (de 0.1 a 0.9).</li>
                        </ul>
                      </div>
                    </div>

                    {/* Punto 5: Ejemplos Prácticos */}
                    <div className="pt-4 border-t border-[#1A1C1E]/10">
                      <p className="font-black uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2"><span className="text-[#29C454]">5.</span> Ejemplos (Victoria 2-0)</p>
                      <div className="space-y-2">
                        
                        {/* Ejemplo 1: Sorpresa */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#1A1C1E]/10 flex justify-between items-center shadow-sm gap-2">
                          <div className="flex-1 pr-2">
                            <p className="font-black text-[#1A1C1E] text-[9px] uppercase tracking-wider">La Gran Sorpresa (K=60)</p>
                            <p className="text-[10px] font-bold opacity-50 leading-tight mt-0.5">1000 pts vs Rival de 1200 pts</p>
                          </div>
                          {/* El shrink-0 protege a la pastilla de aplastarse */}
                          <div className="shrink-0 text-right">
                            <span className="bg-[#29C454] text-white px-3 py-1.5 rounded-lg font-black text-[11px] shadow-md shadow-[#29C454]/20 inline-block">
                              +54 Pts
                            </span>
                          </div>
                        </div>

                        {/* Ejemplo 2: Equilibrado */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#1A1C1E]/10 flex justify-between items-center shadow-sm gap-2">
                          <div className="flex-1 pr-2">
                            <p className="font-black text-[#1A1C1E] text-[9px] uppercase tracking-wider">Duelo Equilibrado (K=60)</p>
                            <p className="text-[10px] font-bold opacity-50 leading-tight mt-0.5">1200 pts vs Rival de 1200 pts</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="bg-[#29C454]/10 text-[#29C454] px-3 py-1.5 rounded-lg font-black text-[11px] border border-[#29C454]/20 inline-block">
                              +30 Pts
                            </span>
                          </div>
                        </div>

                        {/* Ejemplo 3: Favorito */}
                        <div className="bg-white p-3.5 rounded-xl border border-[#1A1C1E]/10 flex justify-between items-center shadow-sm gap-2">
                          <div className="flex-1 pr-2">
                            <p className="font-black text-[#1A1C1E] text-[9px] uppercase tracking-wider">Favorito (K=60)</p>
                            <p className="text-[10px] font-bold opacity-50 leading-tight mt-0.5">1200 pts vs Rival de 1000 pts</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="bg-[#F8F7F2] text-[#1A1C1E]/60 px-3 py-1.5 rounded-lg font-black text-[11px] border border-[#1A1C1E]/10 inline-block">
                              +6 Pts
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* 4. BUZÓN DE SUGERENCIAS */}
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-2 tracking-tighter">Buzón</h3>
                <p className="text-[#1A1C1E]/70 text-sm font-bold mb-5 leading-relaxed">¿Ideas, reportes de error o sugerencias? Háznoslo saber.</p>
                <div className="space-y-3">
                  <textarea 
                    placeholder="Escribe tu comentario aquí..." 
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-bold text-sm focus:outline-none focus:border-[#29C454] resize-none h-28 shadow-inner"
                  />
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      if(!comentario.trim()) return;
                      alert('¡Gracias por hacer VAd. mejor! Hemos recibido tu comentario.');
                      setComentario('');
                    }}
                    className="w-full bg-[#29C454] text-white py-4 rounded-xl font-black italic uppercase text-xs shadow-lg shadow-[#29C454]/20 active:scale-95 transition-all hover:brightness-105"
                  >
                    Enviar Sugerencia
                  </button>
                </div>
              </div>
            </section>
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
                
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Superficie Preferida</label>
                  <select value={superficie} onChange={(e) => setSuperficie(e.target.value)} className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none">
                    <option value="Dura">Cancha Dura</option>
                    <option value="Arcilla">Arcilla</option>
                    <option value="Sacate">Césped</option>
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
            <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight text-center">Partidos</h2>
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
                  <React.Fragment key={partido.id}>
                    {/* --- TARJETA COMPACTA: PARTIDOS FINALIZADOS / W.O. --- */}
                    {partido.estado === 'finalizado' || partido.estado === 'wo' ? (
                      <div className={`${partido.estado === 'wo' ? 'bg-red-500' : 'bg-[#007AFF]'} text-white rounded-2xl p-4 shadow-md flex items-center justify-between animate-in fade-in`}>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-1">
                            {new Date(partido.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {partido.estado === 'wo' ? 'W.O.' : 'Terminó'}
                          </p>
                          {/* Historial Compacto: Mostrar si Ganó o Perdió usando el ID */}
                          <p className="font-black italic text-sm">
                            {partido.estado === 'wo' 
                              ? 'W.O. vs ' 
                              : partido.ganador_id === currentUser.id 
                                ? '🏆 W vs ' 
                                : '❌ L vs '} 
                            {partido.rival.nombre}
                          </p>
                        </div>
                        <div className="text-right bg-white/10 px-3 py-2 rounded-xl border border-white/20">
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1">Marcador</p>
                          <p className="font-black italic text-base leading-none">
                            {getRelativeMarcador(partido)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* --- TARJETA GRANDE: PARTIDOS ACTIVOS (Confirmado, En Revisión) --- */
                      <div className={`${partido.estado === 'confirmado' ? 'bg-[#29C454]' : 'bg-[#E5B824]'} text-white rounded-[2rem] p-6 shadow-lg shadow-[#1A1C1E]/10 relative overflow-hidden transition-colors`}>
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
                            <div className="w-10 h-10 bg-white text-[#29C454] rounded-full flex items-center justify-center font-black italic uppercase shadow-inner">
                              {getInitials(partido.rival.nombre)}
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest font-black opacity-70">Rival Confirmado</p>
                              {/* ELO OCULTO PARA MANTENER LA TENSIÓN (FUNCIÓN PREMIUM) */}
                              <p className="font-black italic text-lg">{partido.rival.nombre}</p>
                            </div>
                          </div>

                          {/* ESTADOS DEL PARTIDO */}
                          {partido.estado === 'confirmado' && (
                            <>
                              {obtenerEstadoTiempo(partido) === 'futuro' ? (
                                <div className="text-center py-6 bg-[#FFFFFF] rounded-[1.8rem] shadow-xl relative overflow-hidden border border-[#1A1C1E]/5">
                                  
                                  {/* --- BOTÓN DE CANCELAR --- */}
                                  <button 
                                    onClick={() => handleCancelMatch(partido)}
                                    className="absolute top-3 right-4 w-8 h-8 bg-[#F8F7F2] text-[#1A1C1E]/40 rounded-full flex items-center justify-center text-xs font-black hover:bg-red-500 hover:text-white transition-all z-20"
                                    title="Cancelar Partido"
                                  >
                                    ✕
                                  </button>
                                  
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#29C454] mb-3 relative z-10">
                                    El partido inicia en
                                  </p>
                                  
                                  <div className="mx-auto w-fit bg-[#F8F7F2] px-7 py-2.5 rounded-xl border border-[#1A1C1E]/10 relative z-10 shadow-inner">
                                    <p className="text-3xl font-black italic tracking-[0.1em] font-mono text-[#1A1C1E]">
                                      {getCountdown(partido)}
                                    </p>
                                  </div>
                                </div>
                              ) : obtenerEstadoTiempo(partido) === 'en_curso' ? (
                                <div className="text-center py-4 bg-white/10 rounded-2xl border border-dashed border-white/30">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-white">Partido en curso 🔥</p>
                                  <p className="text-[9px] opacity-60 mt-1">El reporte se habilitará al terminar el tiempo.</p>
                                </div>
                              ) : reportingMatch === partido.id ? (
                                <div className="mt-4 bg-black/20 p-5 rounded-3xl space-y-5 animate-in fade-in border border-black/10">
                                  <p className="text-xs font-black uppercase tracking-widest text-center">Reportar Resultado</p>
                                  
                                  {/* --- FORMULARIO DE SETS --- */}
                                  <div className="space-y-3">
                                    <div className="flex justify-between px-2 text-[9px] font-black uppercase tracking-widest opacity-60">
                                      <span className="w-1/3 text-center">Mi Score</span>
                                      <span className="w-1/3 text-center">Set</span>
                                      <span className="w-1/3 text-center">Su Score</span>
                                    </div>
                                    
                                    {/* Set 1 */}
                                    <div className="flex gap-2 items-center">
                                      <input type="number" min="0" max="7" placeholder="0" value={s1Mi} onChange={(e)=>setS1Mi(e.target.value)} className="w-1/3 bg-white border-none rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:ring-4 focus:ring-white/50 transition-all shadow-inner" />
                                      <span className="w-1/3 text-center font-black text-xs opacity-50">1</span>
                                      <input type="number" min="0" max="7" placeholder="0" value={s1Rival} onChange={(e)=>setS1Rival(e.target.value)} className="w-1/3 bg-white border-none rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:ring-4 focus:ring-white/50 transition-all shadow-inner" />
                                    </div>
                                    
                                    {/* Set 2 */}
                                    <div className="flex gap-2 items-center">
                                      <input type="number" min="0" max="7" placeholder="0" value={s2Mi} onChange={(e)=>setS2Mi(e.target.value)} className="w-1/3 bg-white border-none rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:ring-4 focus:ring-white/50 transition-all shadow-inner" />
                                      <span className="w-1/3 text-center font-black text-xs opacity-50">2</span>
                                      <input type="number" min="0" max="7" placeholder="0" value={s2Rival} onChange={(e)=>setS2Rival(e.target.value)} className="w-1/3 bg-white border-none rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:ring-4 focus:ring-white/50 transition-all shadow-inner" />
                                    </div>

                                    {/* Set 3 (Opcional) */}
                                    <div className="flex gap-2 items-center opacity-70 focus-within:opacity-100 transition-opacity">
                                      <input type="number" min="0" max="7" placeholder="-" value={s3Mi} onChange={(e)=>setS3Mi(e.target.value)} className="w-1/3 bg-white/80 border-none rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:ring-4 focus:ring-white/50 transition-all" />
                                      <span className="w-1/3 text-center font-black text-[9px] opacity-50">3 (Opc)</span>
                                      <input type="number" min="0" max="7" placeholder="-" value={s3Rival} onChange={(e)=>setS3Rival(e.target.value)} className="w-1/3 bg-white/80 border-none rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:ring-4 focus:ring-white/50 transition-all" />
                                    </div>
                                  </div>

                                  <div className="flex gap-3 pt-2">
                                    <button onClick={() => setReportingMatch(null)} className="flex-1 bg-black/10 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white hover:bg-black/20 transition-colors">Cancelar</button>
                                    <button onClick={() => handleSubmitReport(partido)} className="flex-1 bg-[#1A1C1E] py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg hover:scale-95 transition-all">Enviar Final</button>
                                  </div>
                                  
                                  <div className="pt-4 border-t border-white/10">
                                    <button 
                                      onClick={() => handleWO(partido)} 
                                      className="w-full border-2 border-red-500/40 bg-red-500/10 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                      🚨 El rival no se presentó (W.O.)
                                    </button>
                                  </div>
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
                              <p className="text-[10px] mt-1 opacity-80">El rival debe aceptar el marcador que pusiste.</p>
                            </div>
                          )}

                          {partido.estado === 'en_revision' && partido.reportado_por !== currentUser.id && (
                            <div className="bg-black/20 p-5 rounded-2xl text-center border border-black/10 shadow-inner">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-3">🚨 Acción Requerida</p>
                              <div className="bg-white/10 p-4 rounded-xl mb-5 border border-white/10">
                                <p className="text-xs font-black mb-2 leading-snug">
                                  {partido.ganador_id === currentUser.id 
                                    ? `🏆 El rival reportó que TÚ ganaste:` 
                                    : `🏆 El rival reportó que ÉL ganó:`}
                                </p>
                                <p className="text-2xl font-black italic tracking-widest font-mono text-white drop-shadow-md">
                                  {getRelativeMarcador(partido)}
                                </p>
                              </div>
                              <button onClick={() => handleConfirmReport(partido)} className="w-full bg-[#1A1C1E] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs mb-3 shadow-xl active:scale-95 transition-all">
                                ✅ Aceptar Resultado
                              </button>
                              <p className="text-[9px] opacity-60">Al aceptar, se ajustará el ELO de ambos.</p>
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </React.Fragment>
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
                {item.id === 'partidos' && misPartidos.length > 0 && misPartidos.some(p => p.estado === 'confirmado' || (p.estado === 'en_revision' && p.reportado_por !== currentUser?.id)) && (
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