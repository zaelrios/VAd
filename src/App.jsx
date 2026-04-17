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
    endObj.setHours(endObj.getHours() + 4);

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

  // --- SISTEMA DE ALERTAS VAd. ---
  const [vadAlert, setVadAlert] = useState(null);

  // Funciones para llamar a las alertas fácilmente
  const mostrarAlerta = (titulo, mensaje) => {
    setVadAlert({ tipo: 'info', titulo, mensaje });
  };

  const mostrarError = (titulo, mensaje) => {
    setVadAlert({ tipo: 'error', titulo, mensaje });
  };

  const mostrarConfirmacion = (titulo, mensaje, accionConfirmar) => {
    setVadAlert({ tipo: 'confirm', titulo, mensaje, accionConfirmar });
  };

  const cerrarAlerta = () => setVadAlert(null);
  
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

  // ESTADO PARA EL INTERRUPTOR DE LA NUEVA PESTAÑA UNIFICADA
  const [modoCancha, setModoCancha] = useState('match'); // 'match' o 'libre'

  // ESTADOS PARA LOS PARTIDOS Y REPORTES
  const [misPartidos, setMisPartidos] = useState([]);
  const [reportingMatch, setReportingMatch] = useState(null);

  // ESTADOS DEL FORMULARIO DE REPORTE
  const [s1Mi, setS1Mi] = useState('');
  const [s1Rival, setS1Rival] = useState('');
  const [s2Mi, setS2Mi] = useState('');
  const [s2Rival, setS2Rival] = useState('');
  const [s3Mi, setS3Mi] = useState('');
  const [s3Rival, setS3Rival] = useState('');

  // Lógica para bloquear la interfaz del 3er set si ya hay ganador
  const v1M_UI = parseInt(s1Mi, 10);
  const v1R_UI = parseInt(s1Rival, 10);
  const v2M_UI = parseInt(s2Mi, 10);
  const v2R_UI = parseInt(s2Rival, 10);
  
  const partidoDefinidoEnDosSets = 
    (!isNaN(v1M_UI) && !isNaN(v1R_UI) && !isNaN(v2M_UI) && !isNaN(v2R_UI)) &&
    ((v1M_UI > v1R_UI && v2M_UI > v2R_UI) || (v1R_UI > v1M_UI && v2R_UI > v2M_UI));

  const [bookDate, setBookDate] = useState(initData.date);
  const [bookStart, setBookStart] = useState(initData.start);
  const [bookEnd, setBookEnd] = useState(initData.end);
  const [bookError, setBookError] = useState('');

  // --- SECCIÓN ADMIN (ROLES, USUARIOS Y BUZÓN) ---
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaSugerencias, setListaSugerencias] = useState([]);

  const cargarUsuariosAdmin = async () => {
    if (currentUser?.rol !== 'admin') return;
    
    const { data, error } = await supabase
      .from('Perfiles')
      .select('id, nombre, elo, rol')
      .order('nombre', { ascending: true });
      
    if (!error && data) {
      setListaUsuarios(data);
    }
  };

  const actualizarRolUsuario = async (id, nuevoRol) => {
    const { error } = await supabase
      .from('Perfiles')
      .update({ rol: nuevoRol })
      .eq('id', id);

    if (!error) {
      setListaUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: nuevoRol } : u));
      mostrarAlerta("Éxito", `Rol actualizado a ${nuevoRol.toUpperCase()}`);
    } else {
      mostrarError("Error", "Error al cambiar rol.");
    }
  };

  const cargarSugerenciasAdmin = async () => {
    if (currentUser?.rol !== 'admin') return;
    
    const { data, error } = await supabase
      .from('sugerencias')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setListaSugerencias(data);
    }
  };

  const actualizarEstadoSugerencia = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('sugerencias')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) {
      setListaSugerencias(prev => 
        prev.map(sug => sug.id === id ? { ...sug, estado: nuevoEstado } : sug)
      );
    } else {
      mostrarError("Error", "Error al actualizar: " + error.message);
    }
  };

  const sugerenciasNuevas = listaSugerencias.filter(s => s.estado === 'nueva').length;

  // ESTADOS DE PERSONALIZACIÓN Y NOTIFICACIONES
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pushActivo, setPushActivo] = useState(false); // <-- AGREGA ESTE NUEVO

  const handleColorChange = async (newColor) => {
    const updatedUser = { ...currentUser, color: newColor };
    setCurrentUser(updatedUser);
    localStorage.setItem('vad_session', JSON.stringify(updatedUser));
    setShowColorPicker(false);

    try {
      await supabase.from('Perfiles').update({ color: newColor }).eq('id', currentUser.id);
    } catch (error) {
      console.error('Asegúrate de haber creado la columna "color" en Supabase');
    }
  };

  // --- RELOJ EN VIVO PARA EL TEMPORIZADOR ---
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

    // MEMORIA PERMANENTE
  useEffect(() => {
    const savedUser = localStorage.getItem('vad_session');
    if (savedUser && savedUser !== 'null') {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem('vad_session');
    }
  }, []);

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
      const { data: freshUser } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single();
      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem('vad_session', JSON.stringify(freshUser));
      }

      const { data: matches, error } = await supabase
        .from('partidos')
        .select('*')
        .or(`jugador1_id.eq.${currentUser.id},jugador2_id.eq.${currentUser.id}`);

      if (error) throw error;

      if (matches && matches.length > 0) {
        const partidosConRivales = await Promise.all(matches.map(async (partido) => {
          const rivalId = partido.jugador1_id === currentUser.id ? partido.jugador2_id : partido.jugador1_id;
          const { data: rivalData } = await supabase.from('Perfiles').select('id, nombre, elo, color').eq('id', rivalId).single();
          return { ...partido, rival: rivalData || { id: '?', nombre: 'Jugador Desconocido', elo: '?' } };
        }));

        partidosConRivales.sort((a, b) => {
          const dateA = new Date(`${a.fecha}T${a.hora_inicio}`);
          const dateB = new Date(`${b.fecha}T${b.hora_inicio}`);
          
          const isA_Active = a.estado === 'confirmado' || a.estado === 'en_revision';
          const isB_Active = b.estado === 'confirmado' || b.estado === 'en_revision';

          if (isA_Active && !isB_Active) return -1; 
          if (!isA_Active && isB_Active) return 1;  
          
          if (isA_Active && isB_Active) {
            return dateA - dateB; 
          } else {
            return dateB - dateA; 
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
    if (currentUser && currentUser.rol === 'admin') {
      cargarSugerenciasAdmin();
    }
  }, [currentUser, tab]);

  // --- ESCUCHA EN TIEMPO REAL (NOTIFICACIONES MÁGICAS) ---
  useEffect(() => {
    if (!currentUser) return;

    const canalActualizaciones = supabase.channel('alertas-vad')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'partidos' }, (payload) => {
        fetchPartidos(); 
        mostrarError('Partido Cancelado', 'Tu rival ha cancelado el partido. Te hemos regresado a la sala de búsqueda automáticamente.');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'partidos' }, (payload) => {
        fetchPartidos(); 
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sugerencias' }, (payload) => {
        if (currentUser.rol === 'admin') {
          cargarSugerenciasAdmin(); 
        }
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

  const getFuerza = (elo) => {
    const pts = Number(elo);
    if (pts >= 2000) return '1ra Fuerza (Élite)';
    if (pts >= 1800) return '2da Fuerza';
    if (pts >= 1600) return '3ra Fuerza';
    if (pts >= 1400) return '4ta Fuerza';
    if (pts >= 1200) return '5ta Fuerza';
    return '6ta Fuerza';
  };

  const getRelativeMarcador = (partido) => {
    if (partido.estado === 'wo') return 'W.O.';
    if (!partido.marcador) return '';
    
    if (partido.reportado_por && partido.reportado_por !== currentUser?.id) {
      return partido.marcador.split(',').map(set => {
        const scores = set.trim().split('-');
        if (scores.length === 2) return `${scores[1]}-${scores[0]}`;
        return set;
      }).join(', ');
    }
    
    return partido.marcador;
  };

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
    const K = 60; 
    let diff = rivalElo - miElo;
    if (diff > 200) diff = 200;
    if (diff < -200) diff = -200;

    const expectedScore = 0.5 - (diff / 500);
    const setsJugados = marcador ? marcador.split(',').length : 2; 
    const fueBarrida = setsJugados === 2;

    let S = 0;
    if (yoGane) {
      S = fueBarrida ? 1.0 : 0.85; 
    } else {
      S = fueBarrida ? 0.0 : 0.15; 
    }

    let nuevoElo = Math.round(miElo + K * (S - expectedScore));

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

  // --- FLUJO DE W.O. EN MI CONTRA (ME RINDO) ---
  const processSelfWO = async (partido, miPerfil) => {
    const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
    
    const miNuevoElo = calculateElo(miPerfil.elo, rivalDB.elo, "0-6, 0-6", false);
    const rivalNuevoElo = calculateElo(rivalDB.elo, miPerfil.elo, "6-0, 6-0", true);
    
    const deltaMi = miNuevoElo - miPerfil.elo;
    const deltaRival = rivalNuevoElo - rivalDB.elo;

    const miConfianzaCastigada = Math.max(0, Number(miPerfil.confianza) - 1.0);

    await supabase.from('Perfiles').update({ 
        elo: miNuevoElo, 
        confianza: miConfianzaCastigada, 
        racha_asistencia: 0 
    }).eq('id', miPerfil.id);
    
    await supabase.from('Perfiles').update({ elo: rivalNuevoElo }).eq('id', rivalDB.id);

    const dataUpdate = { estado: 'wo', ganador_id: rivalDB.id, marcador: "W.O." };
    if (partido.jugador1_id === miPerfil.id) {
      dataUpdate.puntos_j1 = deltaMi;
      dataUpdate.puntos_j2 = deltaRival;
    } else {
      dataUpdate.puntos_j1 = deltaRival;
      dataUpdate.puntos_j2 = deltaMi;
    }

    await supabase.from('partidos').update(dataUpdate).eq('id', partido.id);

    mostrarAlerta("W.O. Procesado", `Tu nuevo ELO es ${miNuevoElo} (${deltaMi} pts) y perdiste Confiabilidad.`);
  };

  const handleSelfWO = (partido) => {
    mostrarConfirmacion(
      "W.O.",
      "🚨 Faltan menos de 30 minutos. NO PUEDES CANCELAR.\n\n¿Deseas declarar W.O. asumiendo la derrota (-ELO, -1 Confiabilidad)?",
      async () => {
        try {
            const { data: perfil } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single();
            await processSelfWO(partido, perfil);
            
            const updatedUser = { 
              ...perfil, 
              confianza: Math.max(0, perfil.confianza - 1.0), 
              elo: calculateElo(perfil.elo, partido.rival.elo, "0-6, 0-6", false), 
              racha_asistencia: 0 
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('vad_session', JSON.stringify(updatedUser));
            
            fetchPartidos();
        } catch (error) {
             console.error(error);
             mostrarError("Error", "No se pudo procesar el W.O.");
        }
      }
    );
  };

  // --- CANCELACIONES CON LÓGICA DE TIEMPO ---
  const handleCancelMatch = async (partido) => {
    const [year, month, day] = partido.fecha.split('-');
    const [startH, startM] = partido.hora_inicio.split(':');
    const inicioPartido = new Date(year, month - 1, day, startH, startM);
    const now = new Date();
    
    const diffHoras = (inicioPartido - now) / (1000 * 60 * 60);

    if (diffHoras <= 0.5) {
        mostrarError("Atención", "Faltan menos de 30 minutos. Usa el botón rojo de 'Declarar W.O.'");
        return;
    }

    try {
        const { data: perfil } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single();
        
        let comodines = perfil.comodines !== undefined && perfil.comodines !== null ? perfil.comodines : 2;
        let nuevaConfianza = Number(perfil.confianza);
        let msj = "";
        let penalizacionWODirecto = false;

        if (diffHoras >= 24) {
            msj = "✅ ZONA VERDE: Faltan más de 24 horas. Esta cancelación es LIBRE y no gasta tus comodines.\n\n¿Estás seguro de cancelar el partido?";
        } 
        else if (diffHoras < 24 && diffHoras >= 3) {
            if (comodines > 0) {
                msj = `🟡 ZONA AMARILLA: Faltan menos de 24 hrs. Usarás 1 COMODÍN (Te quedan ${comodines}). Tu confianza quedará intacta.\n\n¿Confirmar cancelación?`;
                comodines -= 1;
            } else {
                msj = "⚠️ ADVERTENCIA: Te quedaste sin comodines. Cancelar ahora te costará -0.5 Pelotas de Confiabilidad y perderás tu racha.\n\n¿Confirmar de todos modos?";
                nuevaConfianza = Math.max(0, nuevaConfianza - 0.5);
            }
        } 
        else if (diffHoras < 3 && diffHoras > 0.5) {
            if (comodines > 0) {
                msj = `🟠 EMERGENCIA: Faltan menos de 3 hrs. Usarás 1 COMODÍN para salvarte del W.O. (Te quedan ${comodines}).\n\n¿Confirmar emergencia?`;
                comodines -= 1;
            } else {
                msj = "🚨 PELIGRO: No tienes comodines y faltan menos de 3 hrs. Esto se marcará como W.O. EN TU CONTRA (-1 Confianza y pierdes ELO).\n\n¿Asumir la derrota y cancelar?";
                penalizacionWODirecto = true;
            }
        }

        mostrarConfirmacion(
          "Cancelar Partido", 
          msj, 
          async () => {
            try {
              if (penalizacionWODirecto) {
                  await processSelfWO(partido, perfil);
              } else {
                  await supabase.from('Perfiles').update({ 
                      confianza: nuevaConfianza, 
                      comodines: comodines, 
                      racha_asistencia: 0 
                  }).eq('id', perfil.id);
                  
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

                  const updatedUser = { ...perfil, confianza: nuevaConfianza, comodines: comodines, racha_asistencia: 0 };
                  setCurrentUser(updatedUser);
                  localStorage.setItem('vad_session', JSON.stringify(updatedUser));
                  
                  mostrarAlerta("Cancelado", "Partido cancelado. Hemos regresado a tu rival a la sala de espera del Radar.");
              }
              
              fetchPartidos();
            } catch (error) {
                console.error(error);
                mostrarError("Error", "Error al procesar la cancelación en el servidor.");
            }
          }
        );
    } catch (error) {
        console.error(error);
        mostrarError("Error de Conexión", "No se pudo leer tu perfil.");
    }
  };

  // --- JUEZ DE SILLA: VALIDADOR DE REGLAS DE TENIS ---
  const isValidTennisSet = (score1, score2) => {
    if (isNaN(score1) || isNaN(score2)) return false;
    const max = Math.max(score1, score2);
    const min = Math.min(score1, score2);

    // Reglas estándar (absolutamente nada mayor a 7)
    if (max === 6 && min <= 4) return true; // Ej: 6-0 a 6-4
    if (max === 7 && (min === 5 || min === 6)) return true; // Ej: 7-5 o 7-6

    return false;
  };

  // --- FLUJO DE REPORTE AUTOMATIZADO BLINDADO ---
  const handleSubmitReport = async (partido) => {
    if (s1Mi === '' || s1Rival === '' || s2Mi === '' || s2Rival === '') {
      mostrarError("Datos Incompletos", "Debes ingresar al menos los resultados de los 2 primeros sets.");
      return;
    }

    const v1Mi = parseInt(s1Mi, 10);
    const v1Riv = parseInt(s1Rival, 10);
    const v2Mi = parseInt(s2Mi, 10);
    const v2Riv = parseInt(s2Rival, 10);

    // 1. Validar Sets 1 y 2
    if (!isValidTennisSet(v1Mi, v1Riv)) {
      mostrarError("Marcador Inválido", "El Set 1 tiene un marcador inválido para tenis (ej. válidos: 6-4, 7-5, 7-6).");
      return;
    }
    if (!isValidTennisSet(v2Mi, v2Riv)) {
      mostrarError("Marcador Inválido", "El Set 2 tiene un marcador inválido para tenis.");
      return;
    }

    let setsMi = (v1Mi > v1Riv ? 1 : 0) + (v2Mi > v2Riv ? 1 : 0);
    let setsRiv = (v1Riv > v1Mi ? 1 : 0) + (v2Riv > v2Mi ? 1 : 0);
    let marcadorFinal = `${v1Mi}-${v1Riv}, ${v2Mi}-${v2Riv}`;

    // 2. Revisar si hay empate obligando a un 3er set
    if (setsMi === 1 && setsRiv === 1) {
      if (s3Mi === '' || s3Rival === '') {
        mostrarError("Empate", "Están empatados 1 a 1 en sets. Debes ingresar el marcador del Set 3 para desempatar.");
        return;
      }
      
      const v3Mi = parseInt(s3Mi, 10);
      const v3Riv = parseInt(s3Rival, 10);
      
      if (!isValidTennisSet(v3Mi, v3Riv)) { 
        mostrarError("Marcador Inválido", "El Set 3 tiene un marcador inválido para tenis (ej. válidos: 6-4, 7-5, 7-6).");
        return;
      }

      setsMi += (v3Mi > v3Riv ? 1 : 0);
      setsRiv += (v3Riv > v3Mi ? 1 : 0);
      marcadorFinal += `, ${v3Mi}-${v3Riv}`;
    }

    if (setsMi === setsRiv) {
      mostrarError("Error de Marcador", "Los sets están empatados. Verifica los números, tiene que haber un ganador claro.");
      return;
    }

    const yoGane = setsMi > setsRiv;
    const ganadorIdCalculado = yoGane ? currentUser.id : partido.rival.id;

    const nombreGanador = yoGane ? "TÚ" : partido.rival.nombre.toUpperCase();
    const mensajeConfirmacion = `Revisa bien:\n\nMarcador: ${marcadorFinal}\nEl ganador es: ${nombreGanador} 🏆\n\n¿Estás seguro de enviar este resultado a revisión?`;
    
    mostrarConfirmacion("Confirmar Reporte", mensajeConfirmacion, async () => {
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
        mostrarAlerta("Reporte Enviado", "Reporte enviado a tu rival para confirmación.");
      } catch (error) {
        console.error(error);
        mostrarError("Error", error.message);
      }
    });
  };

  const handleConfirmReport = async (partido) => {
    try {
      const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
      const yoGane = partido.ganador_id === currentUser.id;
      
      const miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, partido.marcador, yoGane);
      const rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, partido.marcador, !yoGane);

      const deltaMi = miNuevoElo - currentUser.elo;
      const deltaRival = rivalNuevoElo - rivalDB.elo;

      const misNuevosDatos = calcularNuevaConfianza(currentUser.confianza, currentUser.racha_asistencia);
      const rivalNuevosDatos = calcularNuevaConfianza(rivalDB.confianza, rivalDB.racha_asistencia);

      await supabase.from('Perfiles').update({ 
        elo: miNuevoElo, 
        confianza: misNuevosDatos.nuevaConfianza, 
        racha_asistencia: misNuevosDatos.nuevaRacha 
      }).eq('id', currentUser.id);
      
      await supabase.from('Perfiles').update({ 
        elo: rivalNuevoElo, 
        confianza: rivalNuevosDatos.nuevaConfianza, 
        racha_asistencia: rivalNuevosDatos.nuevaRacha 
      }).eq('id', rivalDB.id);

      const dataUpdate = { estado: 'finalizado' };
      if (partido.jugador1_id === currentUser.id) {
        dataUpdate.puntos_j1 = deltaMi;
        dataUpdate.puntos_j2 = deltaRival;
      } else {
        dataUpdate.puntos_j1 = deltaRival;
        dataUpdate.puntos_j2 = deltaMi;
      }

      await supabase.from('partidos').update(dataUpdate).eq('id', partido.id);

      const perfilSeguro = { ...currentUser, elo: miNuevoElo, confianza: misNuevosDatos.nuevaConfianza, racha_asistencia: misNuevosDatos.nuevaRacha };
      setCurrentUser(perfilSeguro);
      localStorage.setItem('vad_session', JSON.stringify(perfilSeguro));
      
      fetchPartidos();
      mostrarAlerta("¡Partido finalizado!", `Sumaste: ${deltaMi > 0 ? '+' : ''}${deltaMi} pts`);
    } catch (error) {
      console.error(error);
    }
  };

  // Esto es para reportar que el OTRO no llegó
 const handleWO = (partido) => {
    mostrarConfirmacion(
      "Reportar W.O.", 
      "¿Estás seguro de reportar W.O.? Esto penalizará fuertemente el ELO y la confiabilidad del rival.", 
      async () => {
        try {
          const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
          const miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, "6-0, 6-0", true);
          const rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, "6-0, 6-0", false);

          const deltaMi = miNuevoElo - currentUser.elo;
          const deltaRival = rivalNuevoElo - rivalDB.elo;

          await supabase.from('Perfiles').update({ elo: miNuevoElo }).eq('id', currentUser.id);
          await supabase.from('Perfiles').update({ elo: rivalNuevoElo }).eq('id', rivalDB.id);

          const dataUpdate = { estado: 'wo', ganador_id: currentUser.id };
          if (partido.jugador1_id === currentUser.id) {
            dataUpdate.puntos_j1 = deltaMi; dataUpdate.puntos_j2 = deltaRival;
          } else {
            dataUpdate.puntos_j1 = deltaRival; dataUpdate.puntos_j2 = deltaMi;
          }

          await supabase.from('partidos').update(dataUpdate).eq('id', partido.id);
          fetchPartidos();
          mostrarAlerta("W.O. Exitoso", "Se ha reportado la inasistencia del rival.");
        } catch (error) { 
          console.error(error); 
          mostrarError("Error", "No se pudo procesar el W.O.");
        }
      }
    );
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
          racha_asistencia: 0,
          comodines: 2,
          rol: 'gratis' 
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

    if (diffInHoursNotice < 2) {
      setSearchError('Debes programar tu búsqueda con al menos 2 horas de anticipación.');
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
      // --- ESCÁNER DE DISPONIBILIDAD REAL ---
      const { data: partidosDelDia } = await supabase
        .from('partidos')
        .select('cancha_numero, hora_inicio, hora_fin')
        .eq('fecha', searchDate)
        .eq('superficie', superficie);

      let hayEspacioParaJugar = false;
      const baseStr = '2000-01-01T'; 
      let checkStart = new Date(`${baseStr}${startTime}:00`);
      const limitEnd = new Date(`${baseStr}${endTime}:00`);

      while (true) {
        let checkEnd = new Date(checkStart.getTime() + (2 * 60 * 60 * 1000));
        if (checkEnd > limitEnd) break;

        const strStart = checkStart.toTimeString().substring(0, 5);
        const strEnd = checkEnd.toTimeString().substring(0, 5);

        const ocupadasAqui = partidosDelDia
          ? partidosDelDia.filter(p => strStart < p.hora_fin && strEnd > p.hora_inicio).map(p => p.cancha_numero)
          : [];

        const inventario = { 'Sacate': [9, 10], 'Dura': [1, 2, 3, 4, 5, 6, 7, 8] };
        const libre = inventario[superficie].find(n => !ocupadasAqui.includes(n));
        
        if (libre) {
          hayEspacioParaJugar = true;
          break; 
        }

        checkStart = new Date(checkStart.getTime() + (30 * 60 * 1000));
      }

      if (!hayEspacioParaJugar) {
        setSearchError(`El club tiene las canchas de ${superficie} a máxima capacidad. No hay bloques de 2 hrs libres en tu rango.`);
        return; 
      }
      // --- FIN DEL ESCÁNER ---

      // 1. Buscamos posibles rivales PRIMERO
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
      let canchaAsignada = null;
      
      const inventario = { 'Sacate': [9, 10], 'Dura': [1, 2, 3, 4, 5, 6, 7, 8] };

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
            
            if (diferenciaElo <= 200 && horasCruce >= 2) {
              const propInicio = inicioCruce;
              
              const propEndObj = new Date(`2000-01-01T${propInicio}`);
              propEndObj.setHours(propEndObj.getHours() + 2);
              const propFin = propEndObj.toTimeString().substring(0,5);

              const { data: partidosCruce } = await supabase
                .from('partidos')
                .select('cancha_numero')
                .eq('fecha', searchDate)
                .eq('superficie', superficie)
                .lt('hora_inicio', propFin)
                .gt('hora_fin', propInicio);

              const canchasOcupadas = partidosCruce ? partidosCruce.map(p => p.cancha_numero) : [];
              const canchaLibre = inventario[superficie].find(n => !canchasOcupadas.includes(n));

              if (canchaLibre) {
                matchEncontrado = rival;
                matchInicio = propInicio;
                matchFin = propFin;
                canchaAsignada = canchaLibre;
                break; 
              }
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
            cancha_numero: canchaAsignada,
            estado: 'confirmado'
          }]);
        
        if (insertMatchError) throw new Error("Error Supabase: " + insertMatchError.message);

        await supabase.from('buscar').delete().eq('id', matchEncontrado.id);
        mostrarAlerta("¡MATCH ENCONTRADO!", `Tienes un partido confirmado en Cancha ${canchaAsignada} (${superficie}).`);
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
        mostrarAlerta("Búsqueda Publicada", "Te avisaremos cuando alguien haga match.");
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
      mostrarError("Error", "Error al eliminar de la base de datos.");
    }
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setTab('auth'); return; }
    mostrarAlerta("Reserva", "Redirigiendo al pago...");
  };

  // --- LÓGICA DE UX: REDONDEO A MEDIAS HORAS Y AUTO-AJUSTE ---
  const roundToHalfHour = (rawTime) => {
    if (!rawTime) return '';
    let [hours, minutes] = rawTime.split(':').map(Number);
    
    // Redondear al 00 o 30 más cercano
    if (minutes > 0 && minutes <= 15) minutes = 0;
    else if (minutes > 15 && minutes <= 45) minutes = 30;
    else if (minutes > 45) { 
      minutes = 0; 
      hours = (hours + 1) % 24;  // Si puso 10:50, lo pasamos a 11:00
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleStartTimeChange = (rawTime, isMatch) => {
    if (!rawTime) return;
    const roundedTime = roundToHalfHour(rawTime);

    if (isMatch) setStartTime(roundedTime);
    else setBookStart(roundedTime);

    // Calcular hora de fin (+4 horas) basándonos en la hora ya redondeada
    const [h, m] = roundedTime.split(':').map(Number);
    const tempDate = new Date();
    tempDate.setHours(h);
    tempDate.setMinutes(m);
    tempDate.setHours(tempDate.getHours() + 4);

    const endHours = String(tempDate.getHours()).padStart(2, '0');
    const endMinutes = String(tempDate.getMinutes()).padStart(2, '0');
    const newEndTime = `${endHours}:${endMinutes}`;

    if (isMatch) setEndTime(newEndTime);
    else setBookEnd(newEndTime);
  };

  const handleEndTimeChange = (rawTime, isMatch) => {
    if (!rawTime) return;
    const roundedTime = roundToHalfHour(rawTime);
    
    if (isMatch) setEndTime(roundedTime);
    else setBookEnd(roundedTime);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1A1C1E] font-sans pb-32 selection:bg-[#29C454]/30">
      
      {/* =========================================
          NUEVO HEADER FIJO SUPERIOR VAd.
      ========================================= */}
      <header className="fixed top-0 left-0 w-full bg-[#F8F7F2]/90 backdrop-blur-md shadow-sm z-50 h-16 flex items-center justify-center border-b border-[#1A1C1E]/5">
  <h1 className="text-2xl font-black italic tracking-tighter">
    <span className="text-[#1D873B]">V</span><span className="text-[#1268B0]">Ad.</span>
  </h1>
</header>

      {/* CORRECCIÓN EN EL MAIN: 
          Cambiamos 'pt-10' por 'pt-24' para darle espacio al header 
      */}
      <main className="pt-24 px-6 max-w-lg mx-auto w-full flex flex-col items-center">
        
        {/* VISTA HOME - DISEÑO UNIFICADO PREMIUM */}
        {tab === 'home' && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center pb-10 px-2">
            
            <section className="flex flex-col items-center">
              
              <h2 className="text-[#1A1C1E] font-black uppercase tracking-[0.4em] text-[13px] mb-4 drop-shadow-sm">
                Donde el tennis se vive
              </h2>
              <h1 className="text-7xl font-black italic tracking-tighter leading-[0.9] uppercase mb-8 text-[#29C454]">
                VENTAJA <br /> <span className="text-transparent" style={{ WebkitTextStroke: '2px #1268B0' }}>ADENTRO.</span>
              </h1>
              <p className="text-[#1A1C1E] text-lg max-w-sm leading-relaxed italic border-t-2 border-[#29C454] pt-4">
                 La comunidad que premia a los que sí aparecen.<br/>Matchmaking inteligente con sistema ELO para un ranking justo y real.
              </p>
              <button onClick={() => isLoggedIn ? setTab('jugar') : setTab('auth')} className="mt-8 w-fit mx-auto block px-10 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
                {isLoggedIn ? "Buscar rival ➜" : "Únete al Circuito ➜"}
              </button>
            </section>

            <section className="w-full text-left space-y-6">
              
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 text-9xl">🔍</div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">El Matchmaking</h3>
                <p className="text-[#1A1C1E]/80 text-sm font-bold mb-6 relative z-10 leading-relaxed">El buscador mas sencillo para encontrar con quien jugar tennis.</p>
                <ul className="space-y-4 relative z-10 text-xs font-bold text-[#1A1C1E]/80">
                  <li className="flex gap-3">
                    <span className="text-[#1268B0] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed">Busqueda desde 2 horas de anticipacion.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#1268B0] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed">Busqueda activa con hasta 1 semana de anticipación.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#1268B0] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed">Emparejamiento por diferencia de puntos:<span className="text-[#1268B0]"> +/-200 puntos </span>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#1268B0] font-black leading-none pt-0.5">•</span>
                    <span className="text-[#1A1C1E]/80 text-sm font-bold mb-1 relative z-10 leading-relaxed"><span className="text-[#1268B0]">Si el rival cancela, el buscador te reactivará automáticamente.</span></span>
                  </li>
                 </ul>
              </div>

              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#29C454]/10 rounded-full blur-3xl"></div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">Ranking ELO</h3>
                <p className="text-[#1A1C1E]/80 text-sm font-bold mb-6 relative z-10 leading-relaxed">Transparencia total. Un sistema diseñado para que tu ascenso dependa de tu nivel real en la cancha.</p>
                
                <div className="space-y-6 relative z-10 text-xs text-[#1A1C1E]">
                  <div className="bg-[#F8F7F2] p-5 rounded-2xl border border-[#1A1C1E]/5 shadow-inner space-y-5">
                    
                    <div>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#1268B0]">1.</span> Inicio y Fuerzas</p>
                      <p className="font-bold leading-relaxed opacity-70">Todos inician en <span className="text-[#1268B0]">5ta Fuerza (1,200 pts)</span>. El sistema te empareja con rivales en un rango de ±200 puntos. El piso mínimo es de 1,000 pts (6ta Fuerza) para proteger tu progreso.</p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#1268B0]">2.</span> Velocidad K-Max (60)</p>
                      <p className="font-bold leading-relaxed opacity-70">El 'Factor K' es la potencia de ascenso. Si juegas contra alguien de tu nivel, K es 40. Si el rival te supera por el límite de <span className="text-[#1268B0]">200 puntos</span>, K sube a <span className="text-[#1268B0]">60</span> para acelerar tu subida.</p>
                    </div>

                    <div>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#1268B0]">3.</span> Probabilidad Lineal VAd.</p>
                      <p className="font-bold leading-relaxed opacity-70">A diferencia de otros sistemas, usamos un cálculo lineal: contra un rival 200 pts arriba, tu probabilidad de ganar es del 10%. Dar la sorpresa ahí te da el premio máximo de puntos.</p>
                    </div>

                    <div className="pt-2 border-t border-[#1A1C1E]/10">
                      <p className="font-black uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2"><span className="text-[#1268B0]">4.</span> Desglose de la Fórmula</p>
                      
                      <div className="bg-[#29C454] p-5 rounded-2xl shadow-lg shadow-[#29C454]/20 text-left relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                        
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

                    <div className="pt-4 border-t border-[#1A1C1E]/10">
                      <p className="font-black uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2"><span className="text-[#1268B0]">5.</span> Ejemplos (Victoria 2-0)</p>
                      <div className="space-y-2">
                        
                        <div className="bg-white p-3.5 rounded-xl border border-[#1A1C1E]/10 flex justify-between items-center shadow-sm gap-2">
                          <div className="flex-1 pr-2">
                            <p className="font-black text-[#1A1C1E] text-[9px] uppercase tracking-wider">La Gran Sorpresa (K=60)</p>
                            <p className="text-[10px] font-bold opacity-50 leading-tight mt-0.5">1200 pts vs Rival de 1400 pts</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="bg-[#29C454] text-white px-3 py-1.5 rounded-lg font-black text-[11px] shadow-md shadow-[#29C454]/20 inline-block">
                              +54 Pts
                            </span>
                          </div>
                        </div>

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

                        <div className="bg-white p-3.5 rounded-xl border border-[#1A1C1E]/10 flex justify-between items-center shadow-sm gap-2">
                          <div className="flex-1 pr-2">
                            <p className="font-black text-[#1A1C1E] text-[9px] uppercase tracking-wider">Favorito (K=60)</p>
                            <p className="text-[10px] font-bold opacity-50 leading-tight mt-0.5">1400 pts vs Rival de 1200 pts</p>
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

              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#E5B824]/10 rounded-full blur-3xl"></div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">Confiabilidad</h3>
                <p className="text-[#1A1C1E]/80 text-sm font-bold mb-6 relative z-10 leading-relaxed">En Ventaja Adentro respetamos el tiempo de todos. Tienes 5 Pelotas de Confiabilidad, protégelas:</p>
                
                <div className="space-y-4 relative z-10 text-xs text-[#1A1C1E]">
                  <div className="bg-[#F8F7F2] p-5 rounded-2xl border border-[#1A1C1E]/5 shadow-inner space-y-5">
                    
                    <div className="flex gap-4 items-start">
                      <span className="text-[#29C454] text-xl leading-none drop-shadow-sm">🟢</span>
                      <div>
                        <p className="font-black uppercase tracking-wider text-[11px] mb-1">Cancelación Libre (24h+)</p>
                        <p className="font-bold leading-relaxed opacity-70">Avisar con más de un día de anticipación no tiene penalización. El buscador tiene tiempo para otro rival.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <span className="text-[#E5B824] text-xl leading-none drop-shadow-sm">🟡</span>
                      <div>
                        <p className="font-black uppercase tracking-wider text-[11px] mb-1">Los 2 Comodines (24h a 3h)</p>
                        <p className="font-bold leading-relaxed opacity-70">Tienes 2 cancelaciones al mes para imprevistos. <span className="text-[#E5B824]">Ojo: Solo 1 comodín</span> sirve para emergencias extremas (entre 3h y 30 mins antes). Si te los acabas, perderás Confiabilidad <span className="text-[#E5B824]">(-0.5 pelotas)</span>.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <span className="text-red-500 text-xl leading-none drop-shadow-sm">🔴</span>
                      <div>
                        <p className="font-black uppercase tracking-wider text-[11px] mb-1">Walkover / W.O. (-30 mins)</p>
                        <p className="font-bold leading-relaxed opacity-70">Faltar a la cancha o cancelar a menos de 30 mins es castigo máximo. <span className="text-[#F50514]">Tu ELO caerá (como perder 6-0, 6-0) y tu Confiabilidad se desplomará (-1 pelota)</span>.</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

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
                    onClick={async (e) => {
                      e.preventDefault();
                      if(!comentario.trim()) return;

                      const btn = e.currentTarget;
                      const textoOriginal = btn.innerText;
                      btn.innerText = 'Enviando...';

                      try {
                        const { error } = await supabase
                          .from('sugerencias')
                          .insert([{ 
                            jugador_id: isLoggedIn && currentUser ? currentUser.id : null,
                            nombre: isLoggedIn && currentUser ? currentUser.nombre : 'Anónimo',
                            comentario: comentario.trim(),
                            estado: 'nueva'
                          }]);

                        if (error) throw error;

                        mostrarAlerta("Buzón", "¡Gracias por hacer VAd. mejor! Hemos recibido tu comentario y lo revisaremos pronto.");
                        setComentario('');
                      } catch (error) {
                        console.error("Error al enviar sugerencia:", error);
                        mostrarError("Error", "Hubo un error al enviar el mensaje. Intenta de nuevo.");
                      } finally {
                        btn.innerText = textoOriginal;
                      }
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

        {/* VISTA UNIFICADA: JUGAR (MATCH O RESERVA) */}
        {tab === 'jugar' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500 mt-4 flex flex-col items-center pb-20">
            
            <div className="bg-[#FFFFFF] p-1.5 rounded-2xl border border-[#1A1C1E]/10 shadow-sm flex w-full relative z-20">
              <button 
                onClick={() => setModoCancha('match')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${modoCancha === 'match' ? 'bg-[#29C454] text-white shadow-md' : 'text-[#1A1C1E]/40 hover:bg-[#F8F7F2]'}`}
              >
                🏆 Match (Puntos)
              </button>
              <button 
                onClick={() => setModoCancha('libre')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${modoCancha === 'libre' ? 'bg-[#007AFF] text-white shadow-md' : 'text-[#1A1C1E]/40 hover:bg-[#F8F7F2]'}`}
              >
                🎾 Reserva Libre
              </button>
            </div>

            <form onSubmit={modoCancha === 'match' ? handleSearchSubmit : handleBookSubmit} className="w-full">
              <div className="bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-6 shadow-sm space-y-6 relative w-full">
                
                <div className="text-center mb-2">
                  <h2 className={`text-3xl font-black italic uppercase transition-colors duration-300 ${modoCancha === 'match' ? 'text-[#29C454]' : 'text-[#007AFF]'}`}>
                    {modoCancha === 'match' ? 'Buscar Rival' : 'Reserva Libre'}
                  </h2>
                  <p className="text-[10px] font-bold text-[#1A1C1E]/50 mt-1">
                    {modoCancha === 'match' ? 'Juega por ELO en el circuito.' : 'Entrena sin afectar tus puntos.'}
                  </p>
                </div>

                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Día de Juego</label>
                  <input type="date" min={initData.date} value={modoCancha === 'match' ? searchDate : bookDate} onChange={(e) => modoCancha === 'match' ? setSearchDate(e.target.value) : setBookDate(e.target.value)} required className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none" />
                </div>
                
                <div className="space-y-3 text-left w-full">
                  <label className="text-[10px] font-black text-[#1A1C1E]/50 uppercase tracking-widest ml-2">Superficie</label>
                  <select value={superficie} onChange={(e) => setSuperficie(e.target.value)} className="w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl px-5 py-4 text-[#1A1C1E] font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none">
                    <option value="Dura">Cancha Dura (1 al 8)</option>
                    <option value="Sacate">Césped (9 y 10)</option>
                  </select>
                </div>

                <div className="space-y-3 text-left w-full">
                  <div className="ml-2">
                    <label className={`text-[15px] font-black uppercase tracking-widest transition-colors duration-300 ${modoCancha === 'match' ? 'text-[#29C454]' : 'text-[#007AFF]'}`}>
                      Franja Horaria
                    </label>
                    {modoCancha === 'match' && (
                      <p className="text-[13px] font-bold text-[#29C454]/80 mt-1 leading-snug">
                        Abre tu rango lo más posible para hacer match. El sistema separará un bloque exacto de 2 horas.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <input 
                      type="time" 
                      step="1800"
                      value={modoCancha === 'match' ? startTime : bookStart} 
                      onChange={(e) => handleStartTimeChange(e.target.value, modoCancha === 'match')} 
                      required 
                      className={`w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-center focus:outline-none focus:ring-2 transition-all ${modoCancha === 'match' ? 'focus:ring-[#29C454]/50' : 'focus:ring-[#007AFF]/50'}`} 
                    />
                    <input 
                      type="time" 
                      step="1800"
                      value={modoCancha === 'match' ? endTime : bookEnd} 
                      onChange={(e) => handleEndTimeChange(e.target.value, modoCancha === 'match')} 
                      required 
                      className={`w-full bg-[#F8F7F2] border border-[#1A1C1E]/10 rounded-2xl py-4 text-[#1A1C1E] font-black text-center focus:outline-none focus:ring-2 transition-all ${modoCancha === 'match' ? 'focus:ring-[#29C454]/50' : 'focus:ring-[#007AFF]/50'}`} 
                    />
                  </div>
                </div>
                {searchError && modoCancha === 'match' && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center leading-relaxed">{searchError}</div>}
              </div>

              <div className="pt-6 flex flex-col items-center">
                <button type="submit" className={`w-full flex items-center justify-center gap-2 px-8 text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all duration-300 ${modoCancha === 'match' ? 'bg-[#29C454] hover:bg-[#29C454]/90 shadow-[#29C454]/30' : 'bg-[#007AFF] hover:bg-[#007AFF]/90 shadow-[#007AFF]/30'}`}>
                  {modoCancha === 'match' ? (
                    <><span className="text-[#F8F7F2] animate-pulse">●</span> Buscar rival</>
                  ) : (
                    'Pagar Reserva ➜'
                  )}
                </button>
              </div>
            </form>
            
            {isLoggedIn && activeSearches.length > 0 && modoCancha === 'match' && (
              <div className="pt-4 space-y-4 animate-in fade-in w-full">
                <h3 className="text-sm font-black italic text-[#1A1C1E] uppercase border-b border-[#1A1C1E]/10 pb-2">Radar Activo</h3>
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
                      <button onClick={() => handleCancelSearch(search.id)} className="w-10 h-10 bg-[#F8F7F2] text-[#1A1C1E]/40 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISTA: MIS PARTIDOS Y JUEZ DE SILLA */}
        {tab === 'partidos' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-sm mx-auto pb-20">
            <h2 className="text-3xl font-black italic text-[#1A1C1E] uppercase tracking-tight text-center">Partidos</h2>
            <div className={`space-y-4 text-left ${!isLoggedIn && 'opacity-80'}`}>
              
              {!isLoggedIn ? (
                <div className="bg-[#FFFFFF] border-2 border-[#29C454]/30 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-5 text-8xl transform translate-x-4 -translate-y-4">🎾</div>
                  <div className="relative z-10">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#29C454] mb-1">Jueves, 16 Abril</p>
                    <h4 className="text-3xl font-black italic mb-4 text-[#1A1C1E]">6:00 PM - 8:00 PM</h4>
                    <div className="flex items-center gap-4 bg-[#F8F7F2] p-3 rounded-xl shadow-inner border border-[#1A1C1E]/5 mb-4">
                      <div className="w-10 h-10 bg-[#1A1C1E] text-white rounded-full flex items-center justify-center font-black italic uppercase shadow-md">
                        MC
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-black text-[#1A1C1E]/50">Rival Confirmado</p>
                        <p className="font-black italic text-lg text-[#1A1C1E]">Mateo C.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : misPartidos.length === 0 ? (
                <div className="text-center bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm">
                  <p className="text-4xl mb-4 opacity-50">🕸️</p>
                  <p className="text-[#1A1C1E]/60 font-bold text-sm">Aún no tienes partidos.</p>
                  <button onClick={() => setTab('jugar')} className="mt-6 px-6 py-3 bg-[#F8F7F2] text-[#29C454] rounded-xl font-black uppercase tracking-widest text-[10px] border border-[#29C454]/20 hover:bg-[#29C454]/10">
                    Buscar Rival
                  </button>
                </div>
              ) : (
                misPartidos.map((partido) => {
                  const esVictoria = partido.ganador_id === currentUser.id;
                  const colorAcento = esVictoria ? 'text-[#E5B824]' : 'text-[#007AFF]';
                  const bgAcento = esVictoria ? 'bg-[#E5B824]/10' : 'bg-[#007AFF]/10';
                  const borderAcento = esVictoria ? 'border-[#E5B824]/30' : 'border-[#007AFF]/30';

                  return (
                    <React.Fragment key={partido.id}>
                      {partido.estado === 'finalizado' || partido.estado === 'wo' ? (
                        <div className={`bg-[#FFFFFF] border ${borderAcento} rounded-2xl p-4 shadow-sm flex items-center justify-between animate-in fade-in`}>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center font-black italic uppercase shadow-inner text-white text-xs"
                              style={{ backgroundColor: partido.rival.color || '#1A1C1E' }}
                            >
                              {getInitials(partido.rival.nombre)}
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-0.5 text-[#1A1C1E]">
                                {new Date(partido.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {partido.estado === 'wo' ? 'W.O.' : 'Terminó'}
                              </p>
                              <p className={`font-black italic text-sm ${colorAcento}`}>
                                {partido.estado === 'wo' 
                                  ? 'W.O. vs ' 
                                  : esVictoria 
                                    ? '🏆 W vs ' 
                                    : '❌ L vs '} 
                                <span className="text-[#1A1C1E]">{partido.rival.nombre}</span>
                                
                                {((partido.jugador1_id === currentUser.id ? partido.puntos_j1 : partido.puntos_j2) !== undefined) && (
                                  <span className={`ml-2 text-[12px] px-1.5 py-0.5 rounded-md font-black ${
                                    (partido.jugador1_id === currentUser.id ? partido.puntos_j1 : partido.puntos_j2) >= 0 
                                    ? 'bg-[#29C454]/10 text-[#29C454]' 
                                    : 'bg-red-500/10 text-red-500'
                                  }`}>
                                    {(partido.jugador1_id === currentUser.id ? partido.puntos_j1 : partido.puntos_j2) >= 0 ? '+' : ''}
                                    {partido.jugador1_id === currentUser.id ? partido.puntos_j1 : partido.puntos_j2}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className={`text-right ${bgAcento} px-3 py-2 rounded-xl border ${borderAcento}`}>
                            <p className={`text-[8px] font-black uppercase tracking-widest ${colorAcento} opacity-80 mb-1`}>Marcador</p>
                            <p className={`font-black italic text-base leading-none ${colorAcento}`}>
                              {getRelativeMarcador(partido)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={`bg-[#FFFFFF] border-2 ${partido.estado === 'confirmado' ? 'border-[#29C454]/40' : 'border-[#E5B824]/40'} rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-colors`}>
                          <div className="absolute right-0 top-0 opacity-5 text-8xl transform translate-x-4 -translate-y-4">🎾</div>
                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-xs font-bold uppercase tracking-widest ${partido.estado === 'confirmado' ? 'text-[#29C454]' : 'text-[#E5B824]'}`}>
                                {new Date(partido.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                              </p>
                              {partido.cancha_numero && (
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${partido.estado === 'confirmado' ? 'bg-[#29C454]/10 text-[#29C454] border border-[#29C454]/20' : 'bg-[#E5B824]/10 text-[#E5B824] border border-[#E5B824]/20'}`}>
                                  Cancha {partido.cancha_numero} ({partido.superficie})
                                </span>
                              )}
                            </div>
                            <h4 className="text-3xl font-black italic mb-4 text-[#1A1C1E]">
                              {formatTime(partido.hora_inicio)} - {formatTime(partido.hora_fin)}
                            </h4>
                            <div className="flex items-center gap-4 bg-[#F8F7F2] p-3 rounded-xl border border-[#1A1C1E]/5 mb-4 shadow-inner">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center font-black italic text-xl uppercase shadow-md text-white"
                                style={{ backgroundColor: partido.rival.color || '#1A1C1E' }}
                              >
                                {getInitials(partido.rival.nombre)}
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-[#1A1C1E]/50">Rival Confirmado</p>
                                <p className="font-black italic text-xl text-[#1A1C1E]">
                                  {partido.rival.nombre}
                                </p>
                              </div>
                            </div>

                            {partido.estado === 'confirmado' && (
                              <>
                                {(() => {
                                  const [y, m, d] = partido.fecha.split('-');
                                  const [sh, sm] = partido.hora_inicio.split(':');
                                  const start = new Date(y, m - 1, d, sh, sm);
                                  const diffHrs = (start - currentTime) / (1000 * 60 * 60);

                                  return diffHrs > 0 ? (
                                    // AÑADÍ pt-10 AQUÍ PARA DARLE ESPACIO AL BOTÓN
                                    <div className="text-center pt-10 pb-6 bg-[#F8F7F2] rounded-[1.8rem] shadow-inner relative overflow-hidden border border-[#1A1C1E]/5">
                                      
                                      {diffHrs > 0.5 ? (
                                        <button 
                                          onClick={() => handleCancelMatch(partido)}
                                          className="absolute top-3 right-4 w-8 h-8 bg-[#FFFFFF] text-[#1A1C1E]/40 border border-[#1A1C1E]/10 rounded-full flex items-center justify-center text-xs font-black hover:bg-red-500 hover:text-white hover:border-red-500 transition-all z-20 shadow-sm"
                                          title="Cancelar Partido"
                                        >
                                          ✕
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handleSelfWO(partido)}
                                          className="absolute top-3 right-4 bg-red-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-md hover:scale-105 active:scale-95 transition-all z-20"
                                          title="Declarar W.O."
                                        >
                                          (W.O.)
                                        </button>
                                      )}
                                      
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#29C454] mb-3 relative z-10">
                                        El partido inicia en
                                      </p>
                                      
                                      <div className="mx-auto w-fit bg-[#FFFFFF] px-7 py-2.5 rounded-xl border border-[#1A1C1E]/10 relative z-10 shadow-sm">
                                        <p className="text-3xl font-black italic tracking-[0.1em] font-mono text-[#1A1C1E]">
                                          {getCountdown(partido)}
                                        </p>
                                      </div>
                                    </div>
                                  ) : obtenerEstadoTiempo(partido) === 'en_curso' ? (
                                    <div className="text-center py-4 bg-[#29C454]/10 rounded-2xl border border-dashed border-[#29C454]/50">
                                      <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-[#29C454]">Partido en curso 🔥</p>
                                      <p className="text-[9px] opacity-60 mt-1 text-[#1A1C1E]">El reporte se habilitará al terminar.</p>
                                    </div>
                                  ) : reportingMatch === partido.id ? (
                                    <div className="mt-4 bg-[#F8F7F2] p-5 rounded-3xl space-y-5 animate-in fade-in border border-[#1A1C1E]/10 shadow-inner">
                                      <p className="text-xs font-black uppercase tracking-widest text-center text-[#1A1C1E]">Reportar Resultado</p>
                                      
                                      <div className="space-y-3">
                                        <div className="flex justify-between px-2 text-[9px] font-black uppercase tracking-widest text-[#1A1C1E]/50">
                                          <span className="w-1/3 text-center">Mi Score</span>
                                          <span className="w-1/3 text-center">Set</span>
                                          <span className="w-1/3 text-center">Su Score</span>
                                        </div>
                                        
                                        <div className="flex gap-2 items-center">
                                          <input type="number" min="0" placeholder="0" value={s1Mi} onChange={(e)=>setS1Mi(e.target.value)} className="w-1/3 bg-white border border-[#1A1C1E]/10 rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:border-[#29C454] transition-all shadow-sm" />
                                          <span className="w-1/3 text-center font-black text-xs text-[#1A1C1E]/50">1</span>
                                          <input type="number" min="0" placeholder="0" value={s1Rival} onChange={(e)=>setS1Rival(e.target.value)} className="w-1/3 bg-white border border-[#1A1C1E]/10 rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:border-[#29C454] transition-all shadow-sm" />
                                        </div>
                                        
                                        <div className="flex gap-2 items-center">
                                          <input type="number" min="0" placeholder="0" value={s2Mi} onChange={(e)=>setS2Mi(e.target.value)} className="w-1/3 bg-white border border-[#1A1C1E]/10 rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:border-[#29C454] transition-all shadow-sm" />
                                          <span className="w-1/3 text-center font-black text-xs text-[#1A1C1E]/50">2</span>
                                          <input type="number" min="0" placeholder="0" value={s2Rival} onChange={(e)=>setS2Rival(e.target.value)} className="w-1/3 bg-white border border-[#1A1C1E]/10 rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:border-[#29C454] transition-all shadow-sm" />
                                        </div>

                                        <div className={`flex gap-2 items-center transition-all duration-300 ${partidoDefinidoEnDosSets ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                          <input type="number" min="0" disabled={partidoDefinidoEnDosSets} placeholder="-" value={partidoDefinidoEnDosSets ? '' : s3Mi} onChange={(e)=>setS3Mi(e.target.value)} className="w-1/3 bg-white border border-[#1A1C1E]/10 rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:border-[#29C454] transition-all shadow-sm" />
                                          <span className="w-1/3 text-center font-black text-[9px] text-[#1A1C1E]/50">3 (Opc)</span>
                                          <input type="number" min="0" disabled={partidoDefinidoEnDosSets} placeholder="-" value={partidoDefinidoEnDosSets ? '' : s3Rival} onChange={(e)=>setS3Rival(e.target.value)} className="w-1/3 bg-white border border-[#1A1C1E]/10 rounded-xl py-3 text-center text-[#1A1C1E] font-black text-xl focus:outline-none focus:border-[#29C454] transition-all shadow-sm" />
                                        </div>
                                      </div>

                                      <div className="flex gap-3 pt-2">
                                        <button onClick={() => setReportingMatch(null)} className="flex-1 bg-white border border-[#1A1C1E]/10 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-[#1A1C1E]/60 hover:bg-[#1A1C1E]/5 transition-colors shadow-sm">Cancelar</button>
                                        <button onClick={() => handleSubmitReport(partido)} className="flex-1 bg-[#1A1C1E] py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-md hover:scale-95 transition-all">Enviar Final</button>
                                      </div>
                                      
                                      <div className="pt-4 border-t border-[#1A1C1E]/10">
                                        <button 
                                          onClick={() => handleWO(partido)} 
                                          className="w-full border-2 border-red-500/40 bg-red-500/10 text-red-600 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                          🚨 El rival no se presentó (W.O.)
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => setReportingMatch(partido.id)} className="w-full bg-[#1A1C1E] text-white py-4 rounded-2xl font-black uppercase italic text-xs shadow-md active:scale-95 transition-all">
                                      Reportar Resultado ➜
                                    </button>
                                  );
                                })()}
                              </>
                            )}

                            {partido.estado === 'en_revision' && partido.reportado_por === currentUser.id && (
                              <div className="bg-[#E5B824]/10 p-4 rounded-xl text-center border border-[#E5B824]/30 mt-4">
                                <p className="text-xs font-black uppercase tracking-widest text-[#E5B824]">⏳ Esperando confirmación</p>
                                <p className="text-[10px] mt-1 text-[#1A1C1E]/60">El rival debe aceptar el marcador que pusiste.</p>
                              </div>
                            )}

                            {partido.estado === 'en_revision' && partido.reportado_por !== currentUser.id && (
                              <div className="bg-[#007AFF]/5 p-5 rounded-2xl text-center border border-[#007AFF]/20 shadow-inner mt-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#007AFF] mb-3">🚨 Acción Requerida</p>
                                <div className="bg-white p-4 rounded-xl mb-5 border border-[#007AFF]/10 shadow-sm">
                                  <p className="text-xs font-black mb-2 leading-snug text-[#1A1C1E]">
                                    {partido.ganador_id === currentUser.id 
                                      ? `🏆 El rival reportó que TÚ ganaste:` 
                                      : `🏆 El rival reportó que ÉL ganó:`}
                                  </p>
                                  <p className="text-2xl font-black italic tracking-widest font-mono text-[#007AFF]">
                                    {getRelativeMarcador(partido)}
                                  </p>
                                </div>
                                <button onClick={() => handleConfirmReport(partido)} className="w-full bg-[#007AFF] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs mb-3 shadow-md active:scale-95 transition-all">
                                  ✅ Aceptar Resultado
                                </button>
                                <p className="text-[9px] text-[#1A1C1E]/50">Al aceptar, se ajustará el ELO de ambos.</p>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VISTA: PERFIL */}
        {tab === 'perfil' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 flex flex-col items-center">
            
            <div className="w-full bg-[#FFFFFF] border border-[#1A1C1E]/10 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              
              <div 
                className="absolute top-0 left-0 w-full py-4 shadow-md transition-colors duration-300"
                style={{ backgroundColor: (isLoggedIn && currentUser?.color) ? currentUser.color : '#29C454' }}
              >
                <p className="text-sm font-black tracking-[0.4em] uppercase text-white drop-shadow-sm">
                  {isLoggedIn && currentUser ? getFuerza(currentUser.elo) : 'Modo Espectador'}
                </p>
              </div>

              <div className="relative mt-12 mb-4">
                <div 
                  className="w-28 h-28 bg-[#F8F7F2] rounded-full border-[5px] flex items-center justify-center font-black italic text-5xl uppercase shadow-inner transition-colors duration-300"
                  style={{ 
                    borderColor: (isLoggedIn && currentUser?.color) ? currentUser.color : '#1A1C1E',
                    color: (isLoggedIn && currentUser?.color) ? currentUser.color : '#1A1C1E' 
                  }}
                >
                  {isLoggedIn && currentUser ? getInitials(currentUser.nombre) : '🎾'}
                </div>
                
                {isLoggedIn && (
                  <button 
                    onClick={() => setShowColorPicker(!showColorPicker)} 
                    className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-[#1A1C1E]/10 text-sm hover:scale-110 transition-transform active:scale-95"
                    title="Cambiar Color"
                  >
                    🎨
                  </button>
                )}
              </div>

              {showColorPicker && (
                <div className="flex gap-3 mb-6 p-3 bg-[#F8F7F2] rounded-2xl shadow-inner border border-[#1A1C1E]/10 animate-in fade-in slide-in-from-top-2">
                  {['#29C454', '#007AFF', '#FF3B30', '#AF52DE', '#FF9500', '#1A1C1E'].map(colorHex => (
                    <button 
                      key={colorHex} 
                      onClick={() => handleColorChange(colorHex)} 
                      className="w-8 h-8 rounded-full shadow-md active:scale-90 transition-all border-2 border-white" 
                      style={{ backgroundColor: colorHex }} 
                    />
                  ))}
                </div>
              )}
              
              <h2 
                className="text-4xl font-black italic uppercase tracking-tight transition-colors duration-300"
                style={{ color: (isLoggedIn && currentUser?.color) ? currentUser.color : '#1A1C1E' }}
              >
                {isLoggedIn && currentUser ? currentUser.nombre : 'Jugador Pro'}
              </h2>
              <p className="text-[#1A1C1E]/50 font-bold tracking-widest text-xs mb-6 uppercase mt-1">
                {isLoggedIn && currentUser ? `Miembro • ${currentUser.rol || 'Gratis'}` : 'Regístrate para jugar'}
              </p>
              
              <div className="bg-[#F8F7F2] w-full rounded-2xl p-4 border border-[#1A1C1E]/5 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-black text-[#1A1C1E]/40 uppercase tracking-widest">Confiabilidad</p>
                  {isLoggedIn && currentUser && (
                    <span className="text-[9px] font-black text-[#E5B824] uppercase tracking-widest bg-[#E5B824]/10 px-2 py-0.5 rounded-md">
                      Comodines: {currentUser.comodines !== undefined ? currentUser.comodines : 2}
                    </span>
                  )}
                </div>
                {renderBalls(isLoggedIn && currentUser ? currentUser.confianza : 5.0)}
              </div>

              <div className="flex gap-3 w-full border-t border-[#1A1C1E]/10 pt-6">
                <div className="flex-1 bg-white border border-[#1A1C1E]/10 rounded-2xl py-4 shadow-sm">
                  <p className="text-[9px] font-black text-[#1A1C1E]/40 uppercase tracking-widest mb-1">Tu ELO</p>
                  <p className="text-2xl font-black italic text-[#29C454]">
                    {isLoggedIn && currentUser ? currentUser.elo : '1,000'}
                  </p>
                </div>
                
                <div className="flex-1 bg-white border border-[#1A1C1E]/10 rounded-2xl py-4 shadow-sm relative overflow-hidden">
                  <p className="text-[9px] font-black text-[#1A1C1E]/40 uppercase tracking-widest mb-1">Racha Actual</p>
                  <p className="text-2xl font-black italic text-[#1A1C1E]">
                    {isLoggedIn && currentUser ? `${currentUser.racha_asistencia || 0} 🔥` : '-'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 w-full border-t border-[#1A1C1E]/10 pt-6">
                {/* ... (Aquí están las cajitas de ELO y Racha) ... */}
              </div>

              {/* INTERRUPTOR INTELIGENTE DE NOTIFICACIONES */}
              {pushActivo ? (
                <div className="w-full bg-[#29C454]/10 text-[#29C454] py-4 rounded-2xl font-black italic uppercase text-xs flex items-center justify-center gap-2 mt-6 border border-[#29C454]/30 shadow-sm">
                  ✅ Alertas Activadas
                </div>
              ) : (
                <button 
                  onClick={async () => {
                    try {
                      // El celular pide el permiso
                      const permisoConcedido = await OneSignal.Notifications.requestPermission();
                      
                      if (permisoConcedido) {
                        setPushActivo(true);
                        mostrarAlerta("¡Alertas Listas!", "A partir de ahora te avisaremos en cuanto encontremos a tu rival.");
                      } else {
                        mostrarError("Permiso Denegado", "Para recibir las alertas, necesitas dar permiso desde la configuración de tu celular.");
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-black italic uppercase text-xs shadow-lg flex items-center justify-center gap-2 mt-6 active:scale-95 transition-all"
                >
                  🔔 Activar Alertas de Partidos
                </button>
              )}

              {/* --- SECCIÓN EXCLUSIVA ADMIN --- */}
              {isLoggedIn && currentUser?.rol === 'admin' && (
                <div className="w-full mt-8 pt-8 border-t border-[#1A1C1E]/10 space-y-4">
                  <h3 className="text-sm font-black italic uppercase text-[#29C454]">Consola Master</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        cargarSugerenciasAdmin();
                        setTab('admin_buzon');
                      }}
                      className="w-full bg-[#1A1C1E] text-white py-4 rounded-2xl font-black italic uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 relative transition-transform active:scale-95"
                    >
                      📩 Buzón 
                      {sugerenciasNuevas > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#29C454] text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-4 border-[#F8F7F2] animate-bounce">
                          {sugerenciasNuevas}
                        </span>
                      )}
                    </button>

                    <button 
                      onClick={() => {
                        cargarUsuariosAdmin();
                        setTab('admin_usuarios');
                      }}
                      className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-black italic uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      👥 Jugadores
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <button onClick={handleLogout} className="w-full bg-transparent border-2 border-red-500/20 text-red-500/80 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-colors mt-4">
                Cerrar Sesión
              </button>
            )}
          </div>
        )}

        {/* VISTA DEL PANEL DE USUARIOS ADMIN */}
        {tab === 'admin_usuarios' && currentUser?.rol === 'admin' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in fade-in pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black italic uppercase text-[#1A1C1E]">Jugadores</h2>
                <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">{listaUsuarios.length} registrados en el club</p>
              </div>
              <button onClick={() => setTab('perfil')} className="bg-white p-3 rounded-xl shadow-sm border border-[#1A1C1E]/5 text-[10px] font-black uppercase">✕</button>
            </div>
            
            <div className="space-y-3">
              {listaUsuarios.map((usr) => (
                <div key={usr.id} className="bg-white border border-[#1A1C1E]/10 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-black text-[11px] uppercase text-[#1A1C1E]">{usr.nombre}</p>
                    <p className="text-[9px] font-bold text-[#1A1C1E]/50 uppercase mt-0.5">ELO: {usr.elo}</p>
                  </div>
                  
                  <select 
                    value={usr.rol || 'gratis'} 
                    onChange={(e) => actualizarRolUsuario(usr.id, e.target.value)}
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border-none focus:outline-none focus:ring-4 focus:ring-black/10 cursor-pointer shadow-inner transition-colors ${
                      usr.rol === 'admin' ? 'bg-[#1A1C1E] text-white' : 
                      usr.rol === 'pro' ? 'bg-[#AF52DE] text-white' : 
                      usr.rol === 'premium' ? 'bg-[#E5B824] text-[#1A1C1E]' : 
                      'bg-[#F8F7F2] text-[#1A1C1E]/60'
                    }`}
                  >
                    <option value="gratis">Gratis</option>
                    <option value="premium">Premium 🌟</option>
                    <option value="pro">Pro ⚡</option>
                    <option value="admin">Admin 👑</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA DEL BUZÓN ADMIN */}
        {tab === 'admin_buzon' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in fade-in pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black italic uppercase text-[#1A1C1E]">Buzón VAd.</h2>
                <p className="text-[10px] font-bold text-[#29C454] uppercase tracking-widest">{sugerenciasNuevas} mensajes sin leer</p>
              </div>
              <button onClick={() => setTab('perfil')} className="bg-white p-3 rounded-xl shadow-sm border border-[#1A1C1E]/5 text-[10px] font-black uppercase">✕</button>
            </div>
            
            <div className="space-y-4">
              {listaSugerencias.filter(sug => sug.estado !== 'archivada').length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-[#1A1C1E]/10 shadow-sm">
                  <p className="text-4xl mb-3">🍃</p>
                  <p className="text-sm font-black text-[#1A1C1E] uppercase">Buzón Limpio</p>
                  <p className="text-[10px] font-bold opacity-50 mt-1">Has atendido todos los mensajes.</p>
                </div>
              ) : (
                listaSugerencias.filter(sug => sug.estado !== 'archivada').map((sug) => (
                  <div key={sug.id} className={`bg-white border ${sug.estado === 'nueva' ? 'border-[#29C454]' : 'border-[#1A1C1E]/10'} p-5 rounded-[2rem] shadow-sm relative transition-all`}>
                    
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${
                        sug.estado === 'nueva' ? 'bg-[#29C454] text-white' : 'bg-[#F8F7F2] text-[#1A1C1E]/40'
                      }`}>
                        {sug.estado}
                      </span>
                      <span className="text-[8px] font-bold opacity-30">{new Date(sug.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="font-black text-[11px] uppercase text-[#1A1C1E] mb-1">{sug.nombre}</p>
                    <p className="text-sm font-bold text-[#1A1C1E]/70 leading-relaxed mb-5">{sug.comentario}</p>

                    <div className="flex gap-2 border-t border-[#1A1C1E]/5 pt-4">
                      {sug.estado !== 'leida' && (
                        <button 
                          onClick={() => actualizarEstadoSugerencia(sug.id, 'leida')}
                          className="flex-1 bg-[#F8F7F2] py-2 rounded-xl text-[9px] font-black uppercase hover:bg-[#29C454]/10 hover:text-[#29C454] transition-colors"
                        >
                          ✓ Leída
                        </button>
                      )}
                      <button 
                        onClick={() => actualizarEstadoSugerencia(sug.id, 'en proceso')}
                        className="flex-1 bg-[#F8F7F2] py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-50 hover:text-blue-500 transition-colors"
                      >
                        ⚙️ Proceso
                      </button>
                      <button 
                        onClick={() => actualizarEstadoSugerencia(sug.id, 'archivada')}
                        className="flex-1 bg-[#F8F7F2] py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        📁 Archivar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL DE ALERTAS PERSONALIZADO VAd. --- */}
      {vadAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1C1E]/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#F8F7F2] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-[#1A1C1E]/10 animate-in zoom-in-95 duration-300">
            
            <div className="text-center mb-6 mt-2">
              <div className="text-4xl mb-3">
                {vadAlert.tipo === 'info' ? '🎾' : vadAlert.tipo === 'error' ? '🚨' : '⚠️'}
              </div>
              <h3 className={`text-xl font-black italic uppercase tracking-tight mb-2 ${vadAlert.tipo === 'error' ? 'text-red-500' : 'text-[#1A1C1E]'}`}>
                {vadAlert.titulo}
              </h3>
              <p className="text-[#1A1C1E]/70 font-bold text-sm leading-relaxed whitespace-pre-wrap">
                {vadAlert.mensaje}
              </p>
            </div>

            <div className="flex gap-3">
              {vadAlert.tipo === 'confirm' ? (
                <>
                  <button 
                    onClick={cerrarAlerta} 
                    className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-[#1A1C1E]/50 bg-white border border-[#1A1C1E]/10 hover:bg-[#1A1C1E]/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      vadAlert.accionConfirmar();
                      cerrarAlerta();
                    }} 
                    className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#29C454] shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all"
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button 
                  onClick={cerrarAlerta} 
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all ${vadAlert.tipo === 'error' ? 'bg-red-500 shadow-red-500/30' : 'bg-[#29C454]'}`}
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#F8F7F2]/90 backdrop-blur-lg border-t border-[#1A1C1E]/5 px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center max-w-sm mx-auto px-4">
          {[
            { id: 'home', icon: '🏠', label: 'Inicio' }, 
            { id: 'jugar', icon: '🎾', label: 'Jugar' }, 
            { id: 'partidos', icon: '📋', label: 'Partidos' }, 
            { id: 'perfil', icon: '👤', label: 'Perfil' }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setTab(item.id)} 
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${tab === item.id ? 'bg-[#29C454] text-white scale-110 shadow-lg shadow-[#29C454]/20' : 'text-[#1A1C1E]/40 hover:text-[#1A1C1E]/70'}`}
            >
              <div className="relative flex flex-col items-center gap-1">
                <span className="text-xl mb-0.5">{item.icon}</span>
                
                {/* Puntito Azul para Partidos Pendientes */}
                {item.id === 'partidos' && misPartidos.length > 0 && misPartidos.some(p => p.estado === 'confirmado' || (p.estado === 'en_revision' && p.reportado_por !== currentUser?.id)) && (
                  <span className="absolute -top-1 -right-2 w-3 h-3 bg-[#007AFF] rounded-full animate-pulse border-2 border-[#F8F7F2] shadow-md"></span>
                )}

                {/* NUEVO: Puntito Azul para Buzón de Admin */}
                {item.id === 'perfil' && currentUser?.rol === 'admin' && sugerenciasNuevas > 0 && (
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