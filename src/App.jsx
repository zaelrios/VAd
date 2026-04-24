import React, { useState, useEffect } from 'react'
import { supabase } from './supabase' 

export default function App() {
  const getInitialTimes = () => {
    const now = new Date(); now.setMinutes(0, 0, 0); now.setHours(now.getHours() + 1);
    const startObj = new Date(now); startObj.setHours(startObj.getHours() + 3);
    const endObj = new Date(startObj); endObj.setHours(endObj.getHours() + 4);
    const formatTime = (dateObj) => dateObj.toTimeString().substring(0, 5);
    const formatDate = (dateObj) => { const offset = dateObj.getTimezoneOffset() * 60000; return new Date(dateObj - offset).toISOString().split('T')[0]; };
    return { date: formatDate(startObj), start: formatTime(startObj), end: formatTime(endObj) };
  };

  const [initData] = useState(getInitialTimes);
  const [tab, setTab] = useState('home');

  // --- 🛡️ CANDADO 1: DESTRUCTOR DE CACHÉ ---
  const APP_VERSION = '1.42'; 

  useEffect(() => {
    const versionGuardada = localStorage.getItem('vad_app_version');
    if (versionGuardada !== APP_VERSION) {
      localStorage.setItem('vad_app_version', APP_VERSION);
      if ('caches' in window) caches.keys().then(names => names.forEach(n => caches.delete(n)));
      if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      window.location.href = window.location.pathname + '?v=' + APP_VERSION;
    }
  }, []);

  const [modoOscuro, setModoOscuro] = useState(() => { return localStorage.getItem('vad_theme') === 'dark'; });
  const toggleTheme = () => { const newTheme = !modoOscuro; setModoOscuro(newTheme); localStorage.setItem('vad_theme', newTheme ? 'dark' : 'light'); };
  const theme = { bg: modoOscuro ? 'bg-[#0F172A]' : 'bg-[#F9F8F1]', text: modoOscuro ? 'text-[#F8F9FA]' : 'text-[#1A1C1E]', card: modoOscuro ? 'bg-[#1E293B]' : 'bg-[#FFFFFF]', border: modoOscuro ? 'border-[#F8F9FA]/10' : 'border-[#1A1C1E]/10', muted: modoOscuro ? 'text-[#F8F9FA]/50' : 'text-[#1A1C1E]/50', nav: modoOscuro ? 'bg-[#0F172A]/90' : 'bg-[#F9F8F1]/90' };

  const [vadAlert, setVadAlert] = useState(null);
  const mostrarAlerta = (titulo, mensaje) => setVadAlert({ tipo: 'info', titulo, mensaje });
  const mostrarError = (titulo, mensaje) => setVadAlert({ tipo: 'error', titulo, mensaje });
  const mostrarConfirmacion = (titulo, mensaje, accionConfirmar) => setVadAlert({ tipo: 'confirm', titulo, mensaje, accionConfirmar });
  const cerrarAlerta = () => setVadAlert(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [comentario, setComentario] = useState('');
  
  const [phonePrefix, setPhonePrefix] = useState('+52');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regStep, setRegStep] = useState(1);

  const [searchDate, setSearchDate] = useState(initData.date);
  const [startTime, setStartTime] = useState(initData.start);
  const [endTime, setEndTime] = useState(initData.end);
  const [superficie, setSuperficie] = useState('Dura');
  const [activeSearches, setActiveSearches] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [modoCancha, setModoCancha] = useState('match'); 

  const [misPartidos, setMisPartidos] = useState([]);
  const [reportingMatch, setReportingMatch] = useState(null);

  const [s1Mi, setS1Mi] = useState(''); const [s1Rival, setS1Rival] = useState('');
  const [s2Mi, setS2Mi] = useState(''); const [s2Rival, setS2Rival] = useState('');
  const [s3Mi, setS3Mi] = useState(''); const [s3Rival, setS3Rival] = useState('');
  const v1M_UI = parseInt(s1Mi, 10); const v1R_UI = parseInt(s1Rival, 10);
  const v2M_UI = parseInt(s2Mi, 10); const v2R_UI = parseInt(s2Rival, 10);
  const partidoDefinidoEnDosSets = (!isNaN(v1M_UI) && !isNaN(v1R_UI) && !isNaN(v2M_UI) && !isNaN(v2R_UI)) && ((v1M_UI > v1R_UI && v2M_UI > v2R_UI) || (v1R_UI > v1M_UI && v2R_UI > v2M_UI));

  const [bookDate, setBookDate] = useState(initData.date);
  const [bookStart, setBookStart] = useState(initData.start);
  const [bookEnd, setBookEnd] = useState(initData.end);

  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaSugerencias, setListaSugerencias] = useState([]);

  // --- ESTADOS PARA LA AGENDA DEL CLUB (B2B) ---
  const getFormatDate = (d) => { const off = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - off).toISOString().split('T')[0]; };
  
  const [baseWeekDate, setBaseWeekDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([getFormatDate(new Date())]); 
  const [clubPartidos, setClubPartidos] = useState([]);
  const [filtroCanchas, setFiltroCanchas] = useState([1,2,3,4,5,6,7,8,9,10]); 
  const [rangoHoras, setRangoHoras] = useState({ start: 6, end: 23 }); 

  const [modalHoraInicio, setModalHoraInicio] = useState('');
  const [modalHoraFin, setModalHoraFin] = useState('');
  const [busquedaJ1, setBusquedaJ1] = useState('');
  const [busquedaJ2, setBusquedaJ2] = useState('');

  const [bloqueoActivo, setBloqueoActivo] = useState(null);
  const [bloqueoMotivo, setBloqueoMotivo] = useState('Mantenimiento');
  const [modalAccion, setModalAccion] = useState('bloqueo'); 
  const [partidoJ1, setPartidoJ1] = useState('');
  const [partidoJ2, setPartidoJ2] = useState('');

  const [frecuencia, setFrecuencia] = useState('unica'); 
  const [iteraciones, setIteraciones] = useState(1);
  const [diasRecurrencia, setDiasRecurrencia] = useState([]); 
  const [partidoAdmin, setPartidoAdmin] = useState(null); // Para el Override del Admin

  const toggleFiltroCancha = (num) => setFiltroCanchas(prev => prev.includes(num) ? prev.filter(c => c !== num) : [...prev, num].sort((a,b) => a-b));

  const limpiarFiltrosAgenda = () => {
    setFiltroCanchas([1,2,3,4,5,6,7,8,9,10]);
    setSelectedDays([getFormatDate(new Date())]);
    setRangoHoras({ start: 6, end: 23 });
  };
  
  const toggleSelectedDay = (dateObj) => {
    const dateStr = getFormatDate(dateObj);
    setSelectedDays(prev => prev.includes(dateStr) ? (prev.length > 1 ? prev.filter(d => d !== dateStr) : prev) : [...prev, dateStr].sort());
  };

  const changeWeek = (dir) => { const n = new Date(baseWeekDate); n.setDate(n.getDate() + (dir * 7)); setBaseWeekDate(n); };

  const startOfWeek = new Date(baseWeekDate);
  const dayOfWeek = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1; 
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  const weekDays = Array.from({length: 7}).map((_, i) => { const d = new Date(startOfWeek); d.setDate(d.getDate() + i); return d; });

  const checkExpiredPartidos = async (matches) => {
    const now = new Date(); let changed = false;
    for (let m of matches) {
      if (m.estado === 'confirmado' && obtenerEstadoTiempo(m) === 'terminado') {
        const [y, month, d] = m.fecha.split('-'); const [h, min] = m.hora_fin.split(':');
        const endObj = new Date(y, month - 1, d, h, min);
        if ((now - endObj) / (1000 * 60 * 60) >= 24) {
          await supabase.from('partidos').update({ estado: 'en_disputa' }).eq('id', m.id);
          const { data: p1 } = await supabase.from('Perfiles').select('confianza').eq('id', m.jugador1_id).single();
          const { data: p2 } = await supabase.from('Perfiles').select('confianza').eq('id', m.jugador2_id).single();
          if(p1) await supabase.from('Perfiles').update({ confianza: Math.max(0, p1.confianza - 0.5) }).eq('id', m.jugador1_id);
          if(p2) await supabase.from('Perfiles').update({ confianza: Math.max(0, p2.confianza - 0.5) }).eq('id', m.jugador2_id);
          changed = true;
        }
      }
    }
    return changed;
  };

  const fetchClubPartidos = async () => {
    if (currentUser?.rol !== 'club' && currentUser?.rol !== 'admin') return;
    try {
      const { data: matches, error } = await supabase.from('partidos').select('*').in('fecha', selectedDays);
      if (error) throw error;
      if (matches && matches.length > 0) {
        const changed = await checkExpiredPartidos(matches);
        if(changed) { fetchClubPartidos(); return; }
        const userIds = [...new Set(matches.flatMap(m => [m.jugador1_id, m.jugador2_id]).filter(Boolean))];
        const { data: perfiles } = await supabase.from('Perfiles').select('id, nombre').in('id', userIds);
        const pMap = perfiles?.reduce((acc, p) => ({...acc, [p.id]: p.nombre}), {}) || {};
        setClubPartidos(matches.map(m => ({ ...m, j1_nombre: pMap[m.jugador1_id] || 'Club', j2_nombre: pMap[m.jugador2_id] || 'Reservado' })));
      } else { setClubPartidos([]); }
    } catch (error) { console.error("Error agenda:", error); }
  };

  const cargarUsuariosAdmin = async () => {
    if (currentUser?.rol !== 'admin' && currentUser?.rol !== 'club') return;
    const { data, error } = await supabase.from('Perfiles').select('id, nombre, elo, rol').order('nombre', { ascending: true });
    if (!error && data) setListaUsuarios(data);
  };
  const actualizarRolUsuario = async (id, nuevoRol) => {
    const { error } = await supabase.from('Perfiles').update({ rol: nuevoRol }).eq('id', id);
    if (!error) { setListaUsuarios(prev => prev.map(u => u.id === id ? { ...u, rol: nuevoRol } : u)); mostrarAlerta("Éxito", `Rol actualizado a ${nuevoRol.toUpperCase()}`); }
  };
  const cargarSugerenciasAdmin = async () => {
    if (currentUser?.rol !== 'admin') return;
    const { data, error } = await supabase.from('sugerencias').select('*').order('created_at', { ascending: false });
    if (!error && data) setListaSugerencias(data);
  };
  const actualizarEstadoSugerencia = async (id, nuevoEstado) => {
    const { error } = await supabase.from('sugerencias').update({ estado: nuevoEstado }).eq('id', id);
    if (!error) setListaSugerencias(prev => prev.map(sug => sug.id === id ? { ...sug, estado: nuevoEstado } : sug));
  };

  const sugerenciasNuevas = listaSugerencias.filter(s => s.estado === 'nueva').length;
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorChange = async (newColor) => {
    const updatedUser = { ...currentUser, color: newColor };
    setCurrentUser(updatedUser); localStorage.setItem('vad_session', JSON.stringify(updatedUser)); setShowColorPicker(false);
    try { await supabase.from('Perfiles').update({ color: newColor }).eq('id', currentUser.id); } catch (error) { }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('vad_session');
    if (savedUser && savedUser !== 'null') {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser); setIsLoggedIn(true);
      if (parsedUser.rol === 'club') setTab('club_agenda'); 
    } else { localStorage.removeItem('vad_session'); }
  }, []);

  // FIX 1: Evitar Bucle Infinito vigilando currentUser?.id
  useEffect(() => {
    if (currentUser && currentUser.rol !== 'club') {
      const cargarBúsquedas = async () => {
        const { data } = await supabase.from('buscar').select('*').eq('jugador_id', currentUser.id).eq('estado', 'activa').order('fecha', { ascending: true });
        if (data) {
          const now = new Date(); const busquedasValidas = [];
          for (let search of data) {
            const [y, m, d] = search.fecha.split('-').map(Number); const [h, min] = search.hora_inicio.split(':').map(Number);
            const searchStartObj = new Date(y, m - 1, d, h, min);
            if ((searchStartObj - now) / (1000 * 60 * 60) < 2) await supabase.from('buscar').delete().eq('id', search.id);
            else busquedasValidas.push(search);
          }
          setActiveSearches(busquedasValidas);
        }
      }; cargarBúsquedas();
    } else { setActiveSearches([]); }
  }, [currentUser?.id, tab]);

  const fetchPartidos = async () => {
    if (!currentUser || currentUser.rol === 'club') return;
    try {
      const { data: freshUser } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single();
      if (freshUser) { setCurrentUser(freshUser); localStorage.setItem('vad_session', JSON.stringify(freshUser)); }

      const { data: matches, error } = await supabase.from('partidos').select('*').or(`jugador1_id.eq.${currentUser.id},jugador2_id.eq.${currentUser.id}`);
      if (error) throw error;
      if (matches && matches.length > 0) {
        const changed = await checkExpiredPartidos(matches);
        if(changed) { fetchPartidos(); return; }
        const partidosConRivales = await Promise.all(matches.map(async (partido) => {
          const rivalId = partido.jugador1_id === currentUser.id ? partido.jugador2_id : partido.jugador1_id;
          const { data: rivalData } = await supabase.from('Perfiles').select('id, nombre, elo, color').eq('id', rivalId).single();
          return { ...partido, rival: rivalData || { id: '?', nombre: 'Desconocido', elo: '?' } };
        }));
        partidosConRivales.sort((a, b) => {
          const isA_Active = a.estado === 'confirmado' || a.estado === 'en_revision'; const isB_Active = b.estado === 'confirmado' || b.estado === 'en_revision';
          if (isA_Active && !isB_Active) return -1; if (!isA_Active && isB_Active) return 1;  
          return new Date(`${isA_Active ? a.fecha : b.fecha}T${isA_Active ? a.hora_inicio : b.hora_inicio}`) - new Date(`${isA_Active ? b.fecha : a.fecha}T${isA_Active ? b.hora_inicio : a.hora_inicio}`);
        });
        setMisPartidos(partidosConRivales);
      } else { setMisPartidos([]); }
    } catch (error) { console.error(error); }
  };

  // FIX 1: Evitar Bucle Infinito vigilando currentUser?.id
  useEffect(() => { fetchPartidos(); fetchClubPartidos(); if (currentUser?.rol === 'admin') cargarSugerenciasAdmin(); }, [currentUser?.id, tab, selectedDays.join(',')]);

  // FIX 1: Evitar Bucle Infinito vigilando currentUser?.id
  useEffect(() => {
    if (!currentUser) return;
    const ch = supabase.channel('alertas-vad')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'partidos' }, async (payload) => { 
        setMisPartidos(prev => {
          const pBorrado = prev.find(p => p.id === payload.old.id);
          
          if (pBorrado && currentUser.rol !== 'club' && pBorrado.estado !== 'bloqueo_admin') {
            const checkAdminCancel = async () => {
              if (payload.old.estado === 'cancelado_admin') {
                mostrarAlerta('Aviso de Club', 'Tu partido ha sido cancelado por la Administración del club.');
                return;
              }
              
              const { data } = await supabase.from('buscar').select('id').eq('jugador_id', currentUser.id).eq('fecha', pBorrado.fecha).eq('hora_inicio', pBorrado.hora_inicio).maybeSingle();
              if (data) {
                mostrarError('Partido Cancelado', 'Tu rival ha cancelado la reserva. Has regresado a la lista de espera.');
              }
            };
            checkAdminCancel();
          }
          return prev;
        });
        fetchPartidos(); fetchClubPartidos(); 
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'partidos' }, () => { fetchPartidos(); fetchClubPartidos(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'partidos' }, () => { fetchPartidos(); fetchClubPartidos(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentUser?.id, selectedDays.join(',')]);

  const formatTime = (time24) => {
    if (!time24) return ''; const [hourString, minute] = time24.split(':');
    let hour = parseInt(hourString, 10); const ampm = hour >= 12 ? 'PM' : 'AM'; hour = hour % 12 || 12; return `${hour}:${minute} ${ampm}`;
  };

  const getInitials = (fullName) => {
    if (!fullName) return '🎾'; const names = fullName.trim().split(/\s+/);
    if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return fullName.substring(0, 2).toUpperCase();
  };

  const getFuerza = (elo) => {
    const pts = Number(elo); if (pts >= 2000) return '1ra Fuerza (Élite)'; if (pts >= 1800) return '2da Fuerza'; if (pts >= 1600) return '3ra Fuerza'; if (pts >= 1400) return '4ta Fuerza'; if (pts >= 1200) return '5ta Fuerza'; return '6ta Fuerza';
  };

  const getRelativeMarcador = (partido) => {
    if (partido.estado === 'wo') return 'W.O.'; if (!partido.marcador) return '';
    if (partido.reportado_por && partido.reportado_por !== currentUser?.id) { return partido.marcador.split(',').map(set => { const scores = set.trim().split('-'); return scores.length === 2 ? `${scores[1]}-${scores[0]}` : set; }).join(', '); }
    return partido.marcador;
  };

  const obtenerEstadoTiempo = (partido) => {
    const [year, month, day] = partido.fecha.split('-'); const [startH, startM] = partido.hora_inicio.split(':'); const [endH, endM] = partido.hora_fin.split(':');
    const start = new Date(year, month - 1, day, startH, startM); const end = new Date(year, month - 1, day, endH, endM);
    if (currentTime < start) return 'futuro'; if (currentTime >= start && currentTime < end) return 'en_curso'; return 'terminado'; 
  };

  const getCountdown = (partido) => {
    const [year, month, day] = partido.fecha.split('-'); const [startH, startM] = partido.hora_inicio.split(':');
    const diff = new Date(year, month - 1, day, startH, startM) - currentTime;
    if (diff <= 0) return "00:00:00";
    const h = Math.floor(diff / (1000 * 60 * 60)); const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderBalls = (score) => {
    let rawScore = Number(score); if (isNaN(rawScore) || rawScore === 0) rawScore = 5.0; const nScore = Math.min(5.0, rawScore);
    return (
      <div className="flex flex-col items-center gap-1"><div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((b) => <span key={b} className={`text-2xl transition-all ${nScore >= b ? "opacity-100" : nScore >= b - 0.5 ? "opacity-50 scale-75" : "opacity-20 grayscale"}`}>🎾</span>)}
      </div><span className="text-[10px] font-black italic text-[#1A1C1E]/60 tracking-widest">{nScore.toFixed(1)} / 5.0</span></div>
    );
  };

  const calculateElo = (miElo, rivalElo, marcador, yoGane) => {
    let diff = rivalElo - miElo; if (diff > 200) diff = 200; if (diff < -200) diff = -200;
    const expected = 0.5 - (diff / 500); const fueBarrida = (marcador ? marcador.split(',').length : 2) === 2;
    let S = yoGane ? (fueBarrida ? 1.0 : 0.85) : (fueBarrida ? 0.0 : 0.15);
    return Math.max(1000, Math.round(miElo + 60 * (S - expected)));
  };

  const calcularNuevaConfianza = (confianzaActual, rachaActual) => {
    let nConf = Number(confianzaActual); let nRach = rachaActual + 1;
    if ([5, 8, 10].includes(nRach) || nRach > 10) nConf = Math.min(5.0, nConf + 1.0);
    return { nuevaConfianza: nConf, nuevaRacha: nRach };
  };

  const processSelfWO = async (partido, miPerfil) => {
    const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
    const miNuevoElo = calculateElo(miPerfil.elo, rivalDB.elo, "0-6, 0-6", false);
    const rivalNuevoElo = calculateElo(rivalDB.elo, miPerfil.elo, "6-0, 6-0", true);
    const nuevaConfMi = Math.max(0, Number(miPerfil.confianza) - 1.0);
    
    await supabase.from('Perfiles').update({ elo: miNuevoElo, confianza: nuevaConfMi, racha_asistencia: 0 }).eq('id', miPerfil.id);
    await supabase.from('Perfiles').update({ elo: rivalNuevoElo }).eq('id', rivalDB.id);
    
    const dataUpdate = { 
      estado: 'wo', 
      ganador_id: rivalDB.id, 
      marcador: "W.O.", 
      puntos_j1: partido.jugador1_id === miPerfil.id ? (miNuevoElo - miPerfil.elo) : (rivalNuevoElo - rivalDB.elo), 
      puntos_j2: partido.jugador1_id === miPerfil.id ? (rivalNuevoElo - rivalDB.elo) : (miNuevoElo - miPerfil.elo),
      delta_conf_j1: partido.jugador1_id === miPerfil.id ? (nuevaConfMi - miPerfil.confianza) : 0,
      delta_conf_j2: partido.jugador2_id === miPerfil.id ? (nuevaConfMi - miPerfil.confianza) : 0,
      racha_previa_j1: partido.jugador1_id === miPerfil.id ? miPerfil.racha_asistencia : rivalDB.racha_asistencia,
      racha_previa_j2: partido.jugador2_id === miPerfil.id ? miPerfil.racha_asistencia : rivalDB.racha_asistencia
    };
    await supabase.from('partidos').update(dataUpdate).eq('id', partido.id);
    mostrarAlerta("W.O. Procesado", `Tu nuevo ELO es ${miNuevoElo} y perdiste Confiabilidad.`);
  };

  const handleSelfWO = (partido) => {
    mostrarConfirmacion("W.O.", "🚨 Faltan menos de 30 minutos. NO PUEDES CANCELAR.\n\n¿Deseas declarar W.O. asumiendo la derrota (-ELO, -1 Confiabilidad)?", async () => {
        try { const { data: perfil } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single(); await processSelfWO(partido, perfil); fetchPartidos(); } catch (error) { mostrarError("Error", "No se pudo procesar el W.O."); }
    });
  };

  // --- MOTOR DE RESOLUCIÓN AUTOMÁTICA EN CADENA (FIFO MEJORADO) ---
  const resolverListaDeEspera = async (fechaStr, superficie, canchaNum, horaLibreIn, horaLibreFin) => {
    try {
      const { data: espera } = await supabase.from('buscar')
        .select('*').eq('fecha', fechaStr).eq('superficie', superficie).eq('estado', 'activa')
        .order('created_at', { ascending: true });

      if (!espera || espera.length < 2) return; 

      const getMins = (t) => { const p = t.split(':'); return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10); };
      let currentLibStart = getMins(horaLibreIn); 
      const libEnd = getMins(horaLibreFin);
      
      const matchedUserIds = new Set(); 

      for (let i = 0; i < espera.length; i++) {
        if (matchedUserIds.has(espera[i].jugador_id)) continue; 
        
        for (let j = i + 1; j < espera.length; j++) {
          if (matchedUserIds.has(espera[j].jugador_id)) continue;

          const j1 = espera[i]; const j2 = espera[j];
          
          const maxStart = Math.max(getMins(j1.hora_inicio), getMins(j2.hora_inicio), currentLibStart);
          const minEnd = Math.min(getMins(j1.hora_fin), getMins(j2.hora_fin), libEnd);

          if (minEnd - maxStart >= 120) { 
            const { data: p1 } = await supabase.from('Perfiles').select('elo').eq('id', j1.jugador_id).single();
            const { data: p2 } = await supabase.from('Perfiles').select('elo').eq('id', j2.jugador_id).single();
            
            if (Math.abs((p1?.elo||1000) - (p2?.elo||1000)) <= 200) {
              const mStart = `${String(Math.floor(maxStart/60)).padStart(2,'0')}:${String(maxStart%60).padStart(2,'0')}:00`;
              const mEnd = `${String(Math.floor((maxStart+60)/60)).padStart(2,'0')}:${String((maxStart+60)%60).padStart(2,'0')}:00`;

              const { data: choque } = await supabase.from('partidos').select('id')
                .eq('fecha', fechaStr).eq('cancha_numero', canchaNum)
                .lt('hora_inicio', mEnd).gt('hora_fin', mStart);

              if (!choque || choque.length === 0) {
                const { data: nuevo, error } = await supabase.from('partidos').insert([{
                  jugador1_id: j1.jugador_id, jugador2_id: j2.jugador_id, fecha: fechaStr, 
                  hora_inicio: mStart, hora_fin: mEnd, superficie: superficie, cancha_numero: canchaNum, estado: 'confirmado', tipo_creacion: 'matchmaking'
                }]).select();

                if (!error && nuevo) {
                  await supabase.from('buscar').update({ estado: 'match' }).in('id', [j1.id, j2.id]);
                  matchedUserIds.add(j1.jugador_id);
                  matchedUserIds.add(j2.jugador_id);
                  currentLibStart = maxStart + 120; 
                  break; 
                }
              }
            }
          }
        }
      }
    } catch (err) { console.error("Error en Auto-Match:", err); }
  };
  
  const handleCancelMatch = async (partido) => {
    const [year, month, day] = partido.fecha.split('-'); const [startH, startM] = partido.hora_inicio.split(':');
    const diffHoras = (new Date(year, month - 1, day, startH, startM) - new Date()) / (1000 * 60 * 60);
    if (diffHoras <= 0.5) { mostrarError("Atención", "Faltan menos de 30 minutos. Usa el botón de 'Declarar W.O.'"); return; }
    try {
        const { data: perfil } = await supabase.from('Perfiles').select('*').eq('id', currentUser.id).single();
        let comodines = perfil.comodines || 2; let nuevaConfianza = Number(perfil.confianza); let msj = ""; let castigo = false; let pierdeRacha = true; 
        if (diffHoras >= 24) { msj = "✅ ZONA VERDE: Faltan más de 24 horas. Esta cancelación es LIBRE."; pierdeRacha = false; } 
        else if (diffHoras < 24 && diffHoras >= 3) { if (comodines > 0) { msj = `🟡 ZONA AMARILLA: Usarás 1 COMODÍN (Te quedan ${comodines}).`; comodines -= 1; pierdeRacha = false; } else { msj = "⚠️ ADVERTENCIA: Te quedaste sin comodines. Costará -0.5 de Confiabilidad."; nuevaConfianza = Math.max(0, nuevaConfianza - 0.5); } } 
        else if (diffHoras < 3 && diffHoras > 0.5) { if (comodines > 0) { msj = `🟠 EMERGENCIA: Usarás 1 COMODÍN para salvarte del W.O. (Te quedan ${comodines}).`; comodines -= 1; pierdeRacha = false; } else { msj = "🚨 PELIGRO: No tienes comodines y faltan menos de 3 hrs. Será un W.O."; castigo = true; } }

        mostrarConfirmacion("Cancelar Partido", msj, async () => {
            try {
              await supabase.from('partidos').update({ estado: 'cancelado_jugador' }).eq('id', partido.id);
              const { data: deletedMatch } = await supabase.from('partidos').delete().eq('id', partido.id).select(); 
              if (!deletedMatch || deletedMatch.length === 0) { mostrarAlerta("Salvado", "El partido fue cancelado por tu rival hace un segundo."); fetchPartidos(); return; }
              if (castigo) { await processSelfWO(partido, perfil); } 
              else {
                  const rachaFinal = pierdeRacha ? 0 : perfil.racha_asistencia;
                  await supabase.from('Perfiles').update({ confianza: nuevaConfianza, comodines: comodines, racha_asistencia: rachaFinal }).eq('id', perfil.id);
                  
                  const { data: bRival } = await supabase.from('buscar').select('id').eq('jugador_id', partido.rival.id).eq('fecha', partido.fecha).eq('estado', 'match').maybeSingle();
                  if (bRival) {
                    await supabase.from('buscar').update({ estado: 'activa' }).eq('id', bRival.id);
                  } else {
                    await supabase.from('buscar').insert([{ jugador_id: partido.rival.id, nombre: partido.rival.nombre, fecha: partido.fecha, hora_inicio: partido.hora_inicio, hora_fin: partido.hora_fin, superficie: partido.superficie, estado: 'activa' }]);
                  }
                  
                  mostrarAlerta("Cancelado", "Partido cancelado. El rival ha regresado a la sala de búsqueda.");
              }
              
              // --- EL GATILLO DE AUTO-MATCH ---
              resolverListaDeEspera(partido.fecha, partido.superficie, partido.cancha_numero, partido.hora_inicio, partido.hora_fin);

              // Retraso para evitar el parpadeo de pantalla y permitir la lectura del mensaje
              setTimeout(() => {
                fetchPartidos();
                setTab('home');
              }, 2500);

            } catch (error) { mostrarError("Error", "Error al cancelar."); }
        });
    } catch (error) { mostrarError("Error", "No se pudo leer tu perfil."); }
  };

  const isValidTennisSet = (score1, score2) => {
    if (isNaN(score1) || isNaN(score2)) return false; const max = Math.max(score1, score2); const min = Math.min(score1, score2);
    if (max === 6 && min <= 4) return true; if (max === 7 && (min === 5 || min === 6)) return true; return false;
  };

  const handleSubmitReport = async (partido) => {
    if (s1Mi === '' || s1Rival === '' || s2Mi === '' || s2Rival === '') { mostrarError("Datos Incompletos", "Debes ingresar al menos 2 sets."); return; }
    const v1Mi = parseInt(s1Mi, 10); const v1Riv = parseInt(s1Rival, 10); const v2Mi = parseInt(s2Mi, 10); const v2Riv = parseInt(s2Rival, 10);
    if (!isValidTennisSet(v1Mi, v1Riv) || !isValidTennisSet(v2Mi, v2Riv)) { mostrarError("Marcador Inválido", "Revisa los marcadores ingresados."); return; }
    let setsMi = (v1Mi > v1Riv ? 1 : 0) + (v2Mi > v2Riv ? 1 : 0); let setsRiv = (v1Riv > v1Mi ? 1 : 0) + (v2Riv > v2Mi ? 1 : 0); let marcadorFinal = `${v1Mi}-${v1Riv}, ${v2Mi}-${v2Riv}`;
    if (setsMi === 1 && setsRiv === 1) {
      if (s3Mi === '' || s3Rival === '') { mostrarError("Empate", "Debes ingresar el Set 3."); return; }
      const v3Mi = parseInt(s3Mi, 10); const v3Riv = parseInt(s3Rival, 10);
      if (!isValidTennisSet(v3Mi, v3Riv)) { mostrarError("Marcador Inválido", "Set 3 inválido."); return; }
      setsMi += (v3Mi > v3Riv ? 1 : 0); setsRiv += (v3Riv > v3Mi ? 1 : 0); marcadorFinal += `, ${v3Mi}-${v3Riv}`;
    }
    if (setsMi === setsRiv) { mostrarError("Error", "No puede haber empate."); return; }
    const yoGane = setsMi > setsRiv; const ganadorIdCalculado = yoGane ? currentUser.id : partido.rival.id; const nombreGanador = yoGane ? "TÚ" : partido.rival.nombre.toUpperCase();
    
    mostrarConfirmacion("Confirmar Reporte", `Marcador: ${marcadorFinal}\nGanador: ${nombreGanador} 🏆\n\n¿Enviar a revisión?`, async () => {
      try {
        const { error } = await supabase.from('partidos').update({ estado: 'en_revision', marcador: marcadorFinal, ganador_id: ganadorIdCalculado, reportado_por: currentUser.id }).eq('id', partido.id);
        if (error) throw error;
        
        setReportingMatch(null); setS1Mi(''); setS1Rival(''); setS2Mi(''); setS2Rival(''); setS3Mi(''); setS3Rival(''); 
        await fetchPartidos(); 
        mostrarAlerta("Enviado", "Reporte enviado al rival.");
      } catch (error) { mostrarError("Error", error.message || "Error al conectar con la base de datos."); }
    });
  };

 const handleConfirmReport = async (partido) => {
    try {
      const { data: rivalDB } = await supabase.from('Perfiles').select('*').eq('id', partido.rival.id).single();
      const yoGane = partido.ganador_id === currentUser.id;
      let miNuevoElo = currentUser.elo; let rivalNuevoElo = rivalDB.elo;
      let misNuevosDatos = { nuevaConfianza: currentUser.confianza, nuevaRacha: currentUser.racha_asistencia };
      let rivalNuevosDatos = { nuevaConfianza: rivalDB.confianza, nuevaRacha: rivalDB.racha_asistencia };
      let deltaMi = 0; let deltaRival = 0;

      if (partido.marcador === 'W.O.') {
        miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, "0-6, 0-6", false);
        rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, "6-0, 6-0", true);
        misNuevosDatos.nuevaConfianza = Math.max(0, currentUser.confianza - 1.0);
        misNuevosDatos.nuevaRacha = 0;
        deltaMi = miNuevoElo - currentUser.elo; deltaRival = rivalNuevoElo - rivalDB.elo;
      } else {
        miNuevoElo = calculateElo(currentUser.elo, rivalDB.elo, partido.marcador, yoGane);
        rivalNuevoElo = calculateElo(rivalDB.elo, currentUser.elo, partido.marcador, !yoGane);
        deltaMi = miNuevoElo - currentUser.elo; deltaRival = rivalNuevoElo - rivalDB.elo;
        misNuevosDatos = calcularNuevaConfianza(currentUser.confianza, currentUser.racha_asistencia);
        rivalNuevosDatos = calcularNuevaConfianza(rivalDB.confianza, rivalDB.racha_asistencia);
      }

      const { error: e1 } = await supabase.from('Perfiles').update({ elo: miNuevoElo, confianza: misNuevosDatos.nuevaConfianza, racha_asistencia: misNuevosDatos.nuevaRacha }).eq('id', currentUser.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('Perfiles').update({ elo: rivalNuevoElo, confianza: rivalNuevosDatos.nuevaConfianza, racha_asistencia: rivalNuevosDatos.nuevaRacha }).eq('id', rivalDB.id);
      if (e2) throw e2;

      const dataUpdate = { 
        estado: partido.marcador === 'W.O.' ? 'wo' : 'finalizado', 
        puntos_j1: partido.jugador1_id === currentUser.id ? deltaMi : deltaRival, 
        puntos_j2: partido.jugador1_id === currentUser.id ? deltaRival : deltaMi,
        delta_conf_j1: partido.jugador1_id === currentUser.id ? misNuevosDatos.nuevaConfianza - currentUser.confianza : rivalNuevosDatos.nuevaConfianza - rivalDB.confianza,
        delta_conf_j2: partido.jugador2_id === currentUser.id ? misNuevosDatos.nuevaConfianza - currentUser.confianza : rivalNuevosDatos.nuevaConfianza - rivalDB.confianza,
        racha_previa_j1: partido.jugador1_id === currentUser.id ? currentUser.racha_asistencia : rivalDB.racha_asistencia,
        racha_previa_j2: partido.jugador2_id === currentUser.id ? currentUser.racha_asistencia : rivalDB.racha_asistencia
      };
      
      const { error: e3 } = await supabase.from('partidos').update(dataUpdate).eq('id', partido.id); 
      if (e3) throw e3;
      
      await fetchPartidos();
      
      let mensajeFinal = `Sumaste: ${deltaMi > 0 ? '+' : ''}${deltaMi} pts de ELO.`;
      if (misNuevosDatos.nuevaConfianza > currentUser.confianza) mensajeFinal += `\n\n🟢 ¡Felicidades! Tu confiabilidad subió a ${misNuevosDatos.nuevaConfianza.toFixed(1)}/5.0`;
      mostrarAlerta("¡Partido finalizado!", mensajeFinal);
    } catch (error) {
      mostrarError("Error", "No se pudo confirmar el reporte. Intenta de nuevo.");
    }
  };

  const handleRejectReport = async (partido) => {
    mostrarConfirmacion("Impugnar Resultado", "¿Seguro que el reporte es incorrecto? El partido pasará a revisión administrativa y podría haber sanciones si hay reportes falsos.", async () => {
      await supabase.from('partidos').update({ estado: 'en_disputa' }).eq('id', partido.id);
      fetchPartidos(); mostrarAlerta("Disputa Abierta", "Un administrador revisará el caso.");
    });
  };

  const handleAdminOverride = async (partido, tipoResultado) => {
    try {
      const { data: p1 } = await supabase.from('Perfiles').select('*').eq('id', partido.jugador1_id).single();
      const { data: p2 } = await supabase.from('Perfiles').select('*').eq('id', partido.jugador2_id).single();

      let baseEloP1 = p1.elo; let baseEloP2 = p2.elo;
      let baseConfP1 = p1.confianza; let baseConfP2 = p2.confianza;
      let baseRachaP1 = p1.racha_asistencia; let baseRachaP2 = p2.racha_asistencia;

      // REVERSIÓN DE ERRORES (Rollback)
      if (partido.estado === 'finalizado' || partido.estado === 'wo') {
        baseEloP1 -= (partido.puntos_j1 || 0);
        baseEloP2 -= (partido.puntos_j2 || 0);
        baseConfP1 -= (partido.delta_conf_j1 || 0);
        baseConfP2 -= (partido.delta_conf_j2 || 0);
        if (partido.racha_previa_j1 !== undefined && partido.racha_previa_j1 !== null) baseRachaP1 = partido.racha_previa_j1;
        if (partido.racha_previa_j2 !== undefined && partido.racha_previa_j2 !== null) baseRachaP2 = partido.racha_previa_j2;
      }

      let marcadorFinal = "W.O.";
      let ganadorIdCalculado = null;
      let isWO = tipoResultado.startsWith('wo_');

      if (isWO) {
        ganadorIdCalculado = tipoResultado === 'wo_j1' ? partido.jugador2_id : partido.jugador1_id;
      } else {
        const v1Mi = parseInt(s1Mi, 10); const v1Riv = parseInt(s1Rival, 10); const v2Mi = parseInt(s2Mi, 10); const v2Riv = parseInt(s2Rival, 10);
        if (!isValidTennisSet(v1Mi, v1Riv) || !isValidTennisSet(v2Mi, v2Riv)) { mostrarError("Inválido", "Marcadores de set inválidos."); return; }
        let setsMi = (v1Mi > v1Riv ? 1 : 0) + (v2Mi > v2Riv ? 1 : 0); let setsRiv = (v1Riv > v1Mi ? 1 : 0) + (v2Riv > v2Mi ? 1 : 0); 
        marcadorFinal = `${v1Mi}-${v1Riv}, ${v2Mi}-${v2Riv}`;
        if (setsMi === 1 && setsRiv === 1) {
          const v3Mi = parseInt(s3Mi, 10); const v3Riv = parseInt(s3Rival, 10);
          if (!isValidTennisSet(v3Mi, v3Riv)) { mostrarError("Inválido", "Tercer set inválido."); return; }
          setsMi += (v3Mi > v3Riv ? 1 : 0); setsRiv += (v3Riv > v3Mi ? 1 : 0); marcadorFinal += `, ${v3Mi}-${v3Riv}`;
        }
        if (setsMi === setsRiv) { mostrarError("Error", "No puede haber empate."); return; }
        ganadorIdCalculado = setsMi > setsRiv ? partido.jugador1_id : partido.jugador2_id;
      }

      const p1Gano = ganadorIdCalculado === partido.jugador1_id;
      let p1NuevoElo = calculateElo(baseEloP1, baseEloP2, isWO ? (p1Gano ? "6-0, 6-0" : "0-6, 0-6") : marcadorFinal, p1Gano);
      let p2NuevoElo = calculateElo(baseEloP2, baseEloP1, isWO ? (!p1Gano ? "6-0, 6-0" : "0-6, 0-6") : marcadorFinal, !p1Gano);

      let p1NuevaConf = baseConfP1; let p2NuevaConf = baseConfP2;
      let p1NuevaRacha = baseRachaP1; let p2NuevaRacha = baseRachaP2;

      if (isWO) {
        if (tipoResultado === 'wo_j1') { p1NuevaConf = Math.max(0, baseConfP1 - 1.0); p1NuevaRacha = 0; }
        if (tipoResultado === 'wo_j2') { p2NuevaConf = Math.max(0, baseConfP2 - 1.0); p2NuevaRacha = 0; }
      } else {
        const res1 = calcularNuevaConfianza(baseConfP1, baseRachaP1); p1NuevaConf = res1.nuevaConfianza; p1NuevaRacha = res1.nuevaRacha;
        const res2 = calcularNuevaConfianza(baseConfP2, baseRachaP2); p2NuevaConf = res2.nuevaConfianza; p2NuevaRacha = res2.nuevaRacha;
      }
      
      const { error: err1 } = await supabase.from('Perfiles').update({ elo: p1NuevoElo, confianza: p1NuevaConf, racha_asistencia: p1NuevaRacha }).eq('id', p1.id);
      if (err1) throw err1;
      const { error: err2 } = await supabase.from('Perfiles').update({ elo: p2NuevoElo, confianza: p2NuevaConf, racha_asistencia: p2NuevaRacha }).eq('id', p2.id);
      if (err2) throw err2;

      const dataUpdate = { 
        estado: isWO ? 'wo' : 'finalizado', 
        marcador: marcadorFinal, 
        ganador_id: ganadorIdCalculado, 
        reportado_por: currentUser.id, 
        puntos_j1: p1NuevoElo - baseEloP1, 
        puntos_j2: p2NuevoElo - baseEloP2,
        delta_conf_j1: p1NuevaConf - baseConfP1,
        delta_conf_j2: p2NuevaConf - baseConfP2,
        racha_previa_j1: baseRachaP1,
        racha_previa_j2: baseRachaP2
      };
      
      const { error: err3 } = await supabase.from('partidos').update(dataUpdate).eq('id', partido.id); 
      if (err3) throw err3;
      
      await fetchClubPartidos(); 
      setBloqueoActivo(null); setPartidoAdmin(null);
      mostrarAlerta("Override Exitoso", "El partido ha sido procesado/revertido correctamente.");
    } catch (error) { mostrarError("Error", error.message || "Error al actualizar la base de datos."); }
  };

  const handleWO = (partido) => {
    mostrarConfirmacion("Reportar W.O.", "¿Seguro de reportar W.O. por inasistencia del rival? Tu rival tendrá que confirmarlo o se irá a disputa administrativa.", async () => {
        try {
          await supabase.from('partidos').update({ estado: 'en_revision', marcador: "W.O.", ganador_id: currentUser.id, reportado_por: currentUser.id }).eq('id', partido.id);
          fetchPartidos(); mostrarAlerta("Enviado", "Reporte de W.O. enviado al rival para confirmación.");
        } catch (error) { mostrarError("Error", "No se pudo procesar el W.O."); }
    });
  };

  // --- FUNCIONES DE ACCESO CORRECTAS ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); setAuthError(''); setAuthLoading(true);
    if (phoneNumber.length < 10) { setAuthError('El celular debe tener 10 dígitos.'); setAuthLoading(false); return; }
    
    const fullPhone = `${phonePrefix}${phoneNumber}`;
    try {
      const { data: existingUser } = await supabase.from('Perfiles').select('*').eq('telefono', fullPhone).maybeSingle();
      if (existingUser) {
        if (existingUser.pin === pin) { setCurrentUser(existingUser); setIsLoggedIn(true); setTab(existingUser.rol === 'club' ? 'club_agenda' : 'home'); localStorage.setItem('vad_session', JSON.stringify(existingUser)); } 
        else { setAuthError('PIN incorrecto.'); }
      } else { setAuthError('Número no registrado. Regístrate primero.'); }
    } catch (error) { setAuthError('Error de conexión.'); } finally { setAuthLoading(false); }
  };

  const handleRegisterCheckPhone = async (e) => {
    e.preventDefault(); setAuthError(''); setAuthLoading(true); 
    if (!regNombre.trim() || !regApellido.trim()) { setAuthError('Ingresa tu nombre y apellido.'); setAuthLoading(false); return; }
    if (phoneNumber.length < 10) { setAuthError('El celular debe tener 10 dígitos exactos.'); setAuthLoading(false); return; }

    const fullPhone = `${phonePrefix}${phoneNumber}`;
    try {
      const { data: existingUser } = await supabase.from('Perfiles').select('id').eq('telefono', fullPhone).maybeSingle();
      if (existingUser) setAuthError('Este número ya está registrado.');
      else setRegStep(2);
    } catch (error) { setAuthError('Error al verificar el número.'); } finally { setAuthLoading(false); }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault(); if (pin.length < 4) { setAuthError('El PIN debe tener 4 dígitos.'); return; }
    setAuthError(''); setAuthLoading(true); const fullPhone = `${phonePrefix}${phoneNumber}`; const fullName = `${regNombre.trim()} ${regApellido.trim()}`;
    try {
      const { data: newUser, error } = await supabase.from('Perfiles').insert([{ telefono: fullPhone, pin: pin, nombre: fullName, elo: 1200, confianza: 5.0, racha_asistencia: 0, comodines: 2, rol: 'gratis' }]).select().single();
      if (error) throw error;
      setCurrentUser(newUser); setIsLoggedIn(true); setIsRegistering(false); setRegNombre(''); setRegApellido(''); setRegStep(1); setPin(''); setTab('home'); localStorage.setItem('vad_session', JSON.stringify(newUser));
    } catch (error) { setAuthError('Error al crear tu cuenta.'); } finally { setAuthLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem('vad_session'); setIsLoggedIn(false); setCurrentUser(null); window.location.href = window.location.pathname; };
  
  const handleSearchSubmit = async (e) => {
    e.preventDefault(); setSearchError(''); 
    if (!isLoggedIn || !currentUser) { handleLogout(); setTab('auth'); return; }
    const getMins = (timeStr) => { if (!timeStr) return 0; const p = timeStr.split(':'); return (parseInt(p[0], 10) * 60) + parseInt(p[1], 10); };
    const startMins = getMins(startTime); const endMins = getMins(endTime);
    
    // --- FIX: RANGO MÍNIMO DE 1 HORA ---
    if ((endMins - startMins) < 60) { 
      setSearchError('El rango de búsqueda debe ser de al menos 1 hora.'); 
      return; 
    }
    
    const now = new Date(); const [year, month, day] = searchDate.split('-').map(Number); const [sH, sM] = startTime.split(':').map(Number);
    if ((new Date(year, month - 1, day, sH, sM) - now) / (1000 * 60 * 60) < 2) { 
      setSearchError('Debes programar tu búsqueda con al menos 2 horas de anticipación.'); 
      return; 
    }

    const hasOverlap = activeSearches.some(s => s.fecha === searchDate && startMins < getMins(s.hora_fin) && endMins > getMins(s.hora_inicio));
    if (hasOverlap) { setSearchError('Ya tienes una búsqueda activa en este rango.'); return; }
    const hasMatchOverlap = misPartidos.some(p => p.fecha === searchDate && p.estado !== 'finalizado' && p.estado !== 'wo' && startMins < getMins(p.hora_fin) && endMins > getMins(p.hora_inicio));
    if (hasMatchOverlap) { setSearchError('Ya tienes un partido programado en este horario.'); return; }

    try {
      // 2. CHECK DE SATURACIÓN DE CANCHAS
      const inventario = { 'Césped': [9, 10], 'Dura': [1, 2, 3, 4, 5, 6, 7, 8] };
      const { data: ocupadas } = await supabase.from('partidos').select('cancha_numero').eq('fecha', searchDate).eq('superficie', superficie).lt('hora_inicio', endTime).gt('hora_fin', startTime);
      
      const canchasOcupadasIds = ocupadas ? [...new Set(ocupadas.map(o => o.cancha_numero))] : [];
      const hayCanchasLibres = inventario[superficie].some(id => !canchasOcupadasIds.includes(id));

      const publicarBusqueda = async (standby = false) => {
        const { data: nb, error: eI } = await supabase.from('buscar').insert([{ jugador_id: currentUser.id, nombre: currentUser.nombre, fecha: searchDate, hora_inicio: startTime, hora_fin: endTime, superficie: superficie, estado: 'activa' }]).select().single();
        if (eI) throw eI;
        setActiveSearches([...activeSearches, nb]);
        mostrarAlerta(standby ? "Lista de Espera" : "Búsqueda Publicada", standby ? "Las canchas están llenas, pero te avisaremos si alguien cancela." : "Te avisaremos al hacer match.");
      };

      if (!hayCanchasLibres) {
        mostrarConfirmacion(
          "Canchas Llenas", 
          `Lo sentimos, todas las canchas de ${superficie} están ocupadas en este horario.\n\n¿Quieres publicarla de todos modos como "Lista de Espera" por si alguien cancela?`,
          () => publicarBusqueda(true)
        );
        return;
      }

      const { data: posiblesRivales } = await supabase.from('buscar').select('*').eq('fecha', searchDate).eq('superficie', superficie).neq('jugador_id', currentUser.id).eq('estado', 'activa');
      let matchEncontrado = null, matchInicio = '', matchFin = '', canchaAsignada = null;

      if (posiblesRivales && posiblesRivales.length > 0) {
        for (let rival of posiblesRivales) {
          const rStartMins = getMins(rival.hora_inicio); const rEndMins = getMins(rival.hora_fin);
          if (startMins < rEndMins && endMins > rStartMins) {
            const startCruce = Math.max(startMins, rStartMins); const endCruce = Math.min(endMins, rEndMins);
            const { data: perfilRival } = await supabase.from('Perfiles').select('elo').eq('id', rival.jugador_id).single();
            
            // --- FIX: MOTOR CALIBRADO A 120 MINUTOS (2 HORAS) ---
            if (Math.abs(currentUser.elo - (perfilRival?.elo || 1000)) <= 200 && (endCruce - startCruce) >= 120) {
              const propInicioStr = `${String(Math.floor(startCruce / 60)).padStart(2, '0')}:${String(startCruce % 60).padStart(2, '0')}`;
              // Separamos el bloque sumando 120 mins exactos
              const propFinStr = `${String(Math.floor((startCruce + 120) / 60)).padStart(2, '0')}:${String((startCruce + 120) % 60).padStart(2, '0')}`;
              
              const { data: pCruce } = await supabase.from('partidos').select('cancha_numero').eq('fecha', searchDate).eq('superficie', superficie).lt('hora_inicio', propFinStr).gt('hora_fin', propInicioStr);
              const canchaLibre = inventario[superficie].find(n => !(pCruce ? pCruce.map(p => p.cancha_numero) : []).includes(n));
              if (canchaLibre) { matchEncontrado = rival; matchInicio = propInicioStr; matchFin = propFinStr; canchaAsignada = canchaLibre; break; }
            }
          }
        }
      }

      if (matchEncontrado) {
        const { data: choque } = await supabase.from('partidos').select('id').eq('fecha', searchDate).eq('cancha_numero', canchaAsignada).lt('hora_inicio', matchFin).gt('hora_fin', matchInicio);
        if (choque && choque.length > 0) throw new Error("¡Interferencia! Alguien reservó esta cancha. Intenta de nuevo.");
        const { data: mc, error: eM } = await supabase.from('partidos').insert([{ jugador1_id: matchEncontrado.jugador_id, jugador2_id: currentUser.id, fecha: searchDate, hora_inicio: matchInicio, hora_fin: matchFin, superficie: superficie, cancha_numero: canchaAsignada, estado: 'confirmado', tipo_creacion: 'matchmaking' }]).select();
        if (eM || !mc || mc.length === 0) throw new Error("Error en el servidor.");
        await supabase.from('buscar').update({ estado: 'match' }).eq('id', matchEncontrado.id);
        await supabase.from('buscar').insert([{ jugador_id: currentUser.id, nombre: currentUser.nombre, fecha: searchDate, hora_inicio: startTime, hora_fin: endTime, superficie: superficie, estado: 'match' }]);
        mostrarAlerta("¡MATCH ENCONTRADO!", `Tienes un partido en Cancha ${canchaAsignada} (${superficie}).`); setTab('partidos'); fetchPartidos();
      } else {
        await publicarBusqueda(false);
      }
    } catch (error) { setSearchError(error.message || 'Error en el circuito.'); }
  };

  const handleCancelSearch = async (id) => { try { await supabase.from('buscar').delete().eq('id', id); setActiveSearches(prev => prev.filter(s => s.id !== id)); } catch (e) { mostrarError("Error", "Error al eliminar."); } };
  const handleBookSubmit = (e) => { e.preventDefault(); if (!isLoggedIn) { setTab('auth'); return; } mostrarAlerta("Reserva", "Redirigiendo al pago..."); };

  const roundToHalfHour = (rawTime) => {
    if (!rawTime) return ''; let [h, m] = rawTime.split(':').map(Number);
    if (m > 0 && m <= 15) m = 0; else if (m > 15 && m <= 45) m = 30; else if (m > 45) { m = 0; h = (h + 1) % 24; }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const handleStartTimeChange = (rawTime, isMatch) => {
    if (!rawTime) return; const rounded = roundToHalfHour(rawTime);
    if (isMatch) setStartTime(rounded); else setBookStart(rounded);
    const [h, m] = rounded.split(':').map(Number); const d = new Date(); d.setHours(h); d.setMinutes(m); d.setHours(d.getHours() + 4);
    const end = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (isMatch) setEndTime(end); else setBookEnd(end);
  };
  const handleEndTimeChange = (rawTime, isMatch) => { if (!rawTime) return; const r = roundToHalfHour(rawTime); if (isMatch) setEndTime(r); else setBookEnd(r); };

  const obtenerEstadoCelda = (canchaId, horaFloat, fechaStr) => {
    const cellStartMins = horaFloat * 60; const cellEndMins = cellStartMins + 30;
    return clubPartidos.find(p => p.fecha === fechaStr && p.cancha_numero === canchaId && (parseInt(p.hora_inicio.split(':')[0]) * 60 + parseInt(p.hora_inicio.split(':')[1])) < cellEndMins && (parseInt(p.hora_fin.split(':')[0]) * 60 + parseInt(p.hora_fin.split(':')[1])) > cellStartMins);
  };

  const handleCellClick = async (cancha, horaFloat, fechaStr) => {
    const partido = obtenerEstadoCelda(cancha, horaFloat, fechaStr);
    if (partido) {
     const esAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'club';
      if (esAdmin) {
        if (partido.estado !== 'bloqueo_admin' && (partido.estado === 'en_disputa' || obtenerEstadoTiempo(partido) === 'terminado')) {
           setPartidoAdmin(partido);
           setModalAccion('reportar_admin');
           setS1Mi(''); setS1Rival(''); setS2Mi(''); setS2Rival(''); setS3Mi(''); setS3Rival('');
           setBloqueoActivo({ cancha, horaFloat, fechaStr });
           return;
        }
        
        const msj = partido.estado === 'bloqueo_admin' ? `¿Liberar Cancha ${cancha}?` : `¿ELIMINAR PARTIDO?\n\nSe notificará a los jugadores pero NO se les regresará a la lista de espera.`;
        
        mostrarConfirmacion("Administrar Celda", msj, async () => {
            try {
              if (partido.estado !== 'bloqueo_admin') {
                await supabase.from('partidos').update({ estado: 'cancelado_admin' }).eq('id', partido.id);
              }
              await supabase.from('partidos').delete().eq('id', partido.id); 
              
              fetchClubPartidos();
              resolverListaDeEspera(partido.fecha, partido.superficie, partido.cancha_numero, partido.hora_inicio, partido.hora_fin);
            } catch (err) { mostrarError("Error", "No se pudo procesar la cancelación."); }
        });
      }
    } else {
      const hI = Math.floor(horaFloat); const mI = horaFloat % 1 === 0 ? '00' : '30';
      const startStr = `${String(hI).padStart(2,'0')}:${mI}`;
      const hF = Math.floor(horaFloat + 2); const mF = (horaFloat + 2) % 1 === 0 ? '00' : '30';
      const endStr = `${String(hF >= 24 ? 23 : hF).padStart(2,'0')}:${hF >= 24 ? '59' : mF}`;

      // --- LIMPIEZA ABSOLUTA DE FORMULARIO ---
      setModalAccion('bloqueo');
      setBloqueoMotivo('Mantenimiento');
      setPartidoJ1('');
      setPartidoJ2('');
      setBusquedaJ1('');
      setBusquedaJ2('');
      setFrecuencia('unica');
      setIteraciones(1);
      setDiasRecurrencia([]);
      
      setBloqueoActivo({ cancha, horaFloat, fechaStr });
      setModalHoraInicio(startStr); 
      setModalHoraFin(endStr);
      cargarUsuariosAdmin();
    }
  };

  const confirmarAccionModal = async () => {
    const { cancha, fechaStr } = bloqueoActivo;
    const startStr = `${modalHoraInicio}:00`;
    const endStr = `${modalHoraFin}:00`;
    if (modalHoraInicio >= modalHoraFin) { mostrarError("Error", "La hora de fin debe ser después del inicio."); return; }

    try {
      if (modalAccion === 'partido') {
        if (!partidoJ1 || !partidoJ2 || partidoJ1 === partidoJ2) throw new Error("Selecciona 2 jugadores distintos.");
        const { data: choqueJ } = await supabase.from('partidos').select('jugador1_id, jugador2_id').eq('fecha', fechaStr).lt('hora_inicio', endStr).gt('hora_fin', startStr)
          .or(`jugador1_id.in.(${partidoJ1},${partidoJ2}),jugador2_id.in.(${partidoJ1},${partidoJ2})`);
        if (choqueJ?.length > 0) throw new Error("Uno de los jugadores ya tiene partido en ese horario.");
      }

      let fechasAProcesar = [fechaStr];
      
      if (modalAccion === 'bloqueo') {
        if (frecuencia === 'diaria') {
          fechasAProcesar = Array.from({ length: iteraciones }, (_, i) => {
            const d = new Date(fechaStr + 'T12:00:00');
            d.setDate(d.getDate() + i);
            return d.toISOString().split('T')[0];
          });
        } else if (frecuencia === 'semanal') {
          fechasAProcesar = [];
          for (let w = 0; w < iteraciones; w++) {
            diasRecurrencia.forEach(dayIdx => {
              const d = new Date(fechaStr + 'T12:00:00');
              const currentDay = d.getDay();
              d.setDate(d.getDate() + (dayIdx - currentDay) + (w * 7));
              if (d >= new Date(fechaStr + 'T12:00:00')) fechasAProcesar.push(d.toISOString().split('T')[0]);
            });
          }
        }
      }

      const inserts = [...new Set(fechasAProcesar)].map(f => ({
        jugador1_id: modalAccion === 'bloqueo' ? currentUser.id : partidoJ1,
        jugador2_id: modalAccion === 'bloqueo' ? currentUser.id : partidoJ2,
        fecha: f, hora_inicio: startStr, hora_fin: endStr,
        superficie: cancha <= 8 ? 'Dura' : 'Césped',
        cancha_numero: cancha,
        estado: modalAccion === 'bloqueo' ? 'bloqueo_admin' : 'confirmado',
        marcador: modalAccion === 'bloqueo' ? bloqueoMotivo : null,
        tipo_creacion: modalAccion === 'bloqueo' ? 'bloqueo' : 'manual'
      }));

      const { error } = await supabase.from('partidos').insert(inserts);
      if (error) throw error;
      fetchClubPartidos(); setBloqueoActivo(null);
      mostrarAlerta("Éxito", "Agenda actualizada correctamente.");
    } catch (e) { mostrarError("Error", e.message); }
  };

  return (
    <div className={`min-h-screen font-sans pb-32 transition-colors duration-500 selection:bg-[#29C454]/30 ${theme.bg} ${theme.text}`}>
      
      {/* HEADER SUPERIOR */}
      <header className={`fixed top-0 left-0 w-full backdrop-blur-md shadow-sm z-50 h-16 flex items-center justify-center border-b transition-colors duration-500 ${theme.nav} ${theme.border}`}>
        <h1 className="text-2xl font-black italic tracking-tighter flex items-end gap-1"><div><span className="text-[#1D873B]">V</span><span className="text-[#1268B0]">Ad.</span></div><span className={`text-[9px] font-bold mb-1.5 ${theme.muted}`}>v1.42</span></h1>
        {isLoggedIn && currentUser?.rol === 'club' && (
          <button onClick={() => setTab(tab === 'perfil' ? 'club_agenda' : 'perfil')} className={`absolute right-6 text-xl p-2 rounded-full ${theme.card} shadow-sm border ${theme.border} active:scale-95`}>
            {tab === 'perfil' ? '📅' : '⚙️'}
          </button>
        )}
      </header>

      <main className={`pt-24 px-4 md:px-8 mx-auto w-full flex flex-col items-center transition-all duration-500 ${tab === 'club_agenda' ? 'max-w-full' : 'max-w-lg'}`}>
        
        {/* VISTA HOME */}
        {tab === 'home' && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center pb-10 px-2">
            <section className="flex flex-col items-center">
              <h2 className={`${theme.text} font-black uppercase tracking-[0.4em] text-[13px] mb-4 drop-shadow-sm`}>Donde el tennis se vive</h2>
              <h1 className="text-7xl font-black italic tracking-tighter leading-[0.9] uppercase mb-8 text-[#29C454]">VENTAJA <br /> <span className="text-transparent" style={{ WebkitTextStroke: '2px #1268B0' }}>ADENTRO.</span></h1>
              <p className={`${theme.text} text-lg max-w-sm leading-relaxed italic border-t-2 border-[#29C454] pt-4`}>La comunidad que premia a los que sí aparecen.<br/>Matchmaking inteligente con sistema ELO para un ranking justo y real.</p>
              {isLoggedIn ? (
                <button onClick={() => setTab(currentUser?.rol === 'club' ? 'club_agenda' : 'jugar')} className="mt-8 w-fit mx-auto block px-10 bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-[#29C454]/30 active:scale-95 transition-all hover:brightness-105">
                  Buscar partido ➜
                </button>
              ) : (
                <div className="mt-8 flex gap-3 justify-center w-full max-w-sm mx-auto px-4">
                  <button onClick={() => { setIsRegistering(false); setAuthError(''); setPhoneNumber(''); setPin(''); setTab('auth'); }} className={`flex-1 ${modoOscuro ? 'bg-white text-[#0F172A]' : 'bg-[#1A1C1E] text-white'} py-4 rounded-2xl font-black italic uppercase text-xs shadow-lg active:scale-95 transition-all`}>
                    Iniciar Sesión
                  </button>
                  <button onClick={() => { setIsRegistering(true); setRegStep(1); setAuthError(''); setRegNombre(''); setRegApellido(''); setPhoneNumber(''); setPin(''); setTab('auth'); }} className="flex-1 bg-[#29C454] text-white py-4 rounded-2xl font-black italic uppercase text-xs shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all">
                    Registrarte
                  </button>
                </div>
              )}
            </section>

            <section className="w-full text-left space-y-6">
              <div className={`${theme.card} border ${theme.border} rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 opacity-5 text-9xl">🔍</div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">El Matchmaking</h3>
                <p className={`${theme.muted} text-sm font-bold mb-6 relative z-10 leading-relaxed`}>El buscador mas sencillo para encontrar con quien jugar tennis.</p>
                <ul className={`space-y-4 relative z-10 text-xs font-bold ${theme.muted}`}>
                  <li className="flex gap-3"><span className="text-[#1268B0] font-black leading-none pt-0.5">•</span><span className="text-sm font-bold mb-1 relative z-10 leading-relaxed">Busqueda desde 2 horas de anticipacion.</span></li>
                  <li className="flex gap-3"><span className="text-[#1268B0] font-black leading-none pt-0.5">•</span><span className="text-sm font-bold mb-1 relative z-10 leading-relaxed">Busqueda activa con hasta 1 semana de anticipación.</span></li>
                  <li className="flex gap-3"><span className="text-[#1268B0] font-black leading-none pt-0.5">•</span><span className="text-sm font-bold mb-1 relative z-10 leading-relaxed">Emparejamiento por diferencia de puntos:<span className="text-[#1268B0]"> +/-200 puntos </span>.</span></li>
                  <li className="flex gap-3"><span className="text-[#1268B0] font-black leading-none pt-0.5">•</span><span className="text-sm font-bold mb-1 relative z-10 leading-relaxed"><span className="text-[#1268B0]">Si el rival cancela, el buscador te reactivará automáticamente.</span></span></li>
                </ul>
              </div>

              <div className={`${theme.card} border ${theme.border} rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden`}>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#29C454]/10 rounded-full blur-3xl"></div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">Ranking ELO</h3>
                <p className={`${theme.muted} text-sm font-bold mb-6 relative z-10 leading-relaxed`}>Transparencia total. Un sistema diseñado para que tu ascenso dependa de tu nivel real en la cancha.</p>
                <div className={`space-y-6 relative z-10 text-xs ${theme.text}`}>
                  <div className={`${theme.bg} p-5 rounded-2xl border ${theme.border} shadow-inner space-y-5`}>
                    <div><p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#1268B0]">1.</span> Inicio y Fuerzas</p><p className={`font-bold leading-relaxed ${theme.muted}`}>Todos inician en <span className="text-[#1268B0]">5ta Fuerza (1,200 pts)</span>. El sistema te empareja con rivales en un rango de ±200 puntos. El piso mínimo es de 1,000 pts para proteger tu progreso.</p></div>
                    <div><p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#1268B0]">2.</span> Velocidad K-Max (60)</p><p className={`font-bold leading-relaxed ${theme.muted}`}>El 'Factor K' es la potencia de ascenso. Si juegas contra alguien de tu nivel, K es 40. Si el rival te supera por 200 puntos, K sube a 60 para acelerar tu subida.</p></div>
                    <div><p className="font-black uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-2"><span className="text-[#1268B0]">3.</span> Probabilidad Lineal VAd.</p><p className={`font-bold leading-relaxed ${theme.muted}`}>Contra un rival 200 pts arriba, tu probabilidad de ganar es del 10%. Dar la sorpresa ahí te da el premio máximo de puntos.</p></div>
                    <div className={`pt-2 border-t ${theme.border}`}>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2"><span className="text-[#1268B0]">4.</span> Desglose de la Fórmula</p>
                      <div className="bg-[#29C454] p-5 rounded-2xl shadow-lg shadow-[#29C454]/20 text-left relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                        <p className="font-mono text-white text-[14px] tracking-widest text-center mb-4 font-black whitespace-nowrap drop-shadow-sm">R' = R + K × (S - E)</p>
                        <ul className="space-y-2 text-[9px] font-bold text-white/90 uppercase tracking-tight"><li><span className="font-black text-white text-[10px]">R':</span> Tu nuevo puntaje.</li><li><span className="font-black text-white text-[10px]">R:</span> Tus puntos actuales.</li><li><span className="font-black text-white text-[10px]">K:</span> Constante de cambio = 60.</li><li><span className="font-black text-white text-[10px]">S:</span> Resultado (1.0 si ganas 2-0 / 0.85 si 2-1).</li><li><span className="font-black text-white text-[10px]">E:</span> Probabilidad.</li></ul>
                      </div>
                    </div>
                    <div className={`pt-4 border-t ${theme.border}`}>
                      <p className="font-black uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2"><span className="text-[#1268B0]">5.</span> Ejemplos (Victoria 2-0)</p>
                      <div className="space-y-2">
                        <div className={`${theme.card} p-3.5 rounded-xl border ${theme.border} flex justify-between items-center shadow-sm gap-2`}><div className="flex-1 pr-2"><p className={`font-black ${theme.text} text-[9px] uppercase tracking-wider`}>La Gran Sorpresa (K=60)</p><p className={`text-[10px] font-bold ${theme.muted} leading-tight mt-0.5`}>1200 pts vs Rival de 1400 pts</p></div><div className="shrink-0 text-right"><span className="bg-[#29C454] text-white px-3 py-1.5 rounded-lg font-black text-[11px] shadow-md shadow-[#29C454]/20 inline-block">+54 Pts</span></div></div>
                        <div className={`${theme.card} p-3.5 rounded-xl border ${theme.border} flex justify-between items-center shadow-sm gap-2`}><div className="flex-1 pr-2"><p className={`font-black ${theme.text} text-[9px] uppercase tracking-wider`}>Duelo Equilibrado (K=60)</p><p className={`text-[10px] font-bold ${theme.muted} leading-tight mt-0.5`}>1200 pts vs Rival de 1200 pts</p></div><div className="shrink-0 text-right"><span className="bg-[#29C454]/10 text-[#29C454] px-3 py-1.5 rounded-lg font-black text-[11px] border border-[#29C454]/20 inline-block">+30 Pts</span></div></div>
                        <div className={`${theme.card} p-3.5 rounded-xl border ${theme.border} flex justify-between items-center shadow-sm gap-2`}><div className="flex-1 pr-2"><p className={`font-black ${theme.text} text-[9px] uppercase tracking-wider`}>Favorito (K=60)</p><p className={`text-[10px] font-bold ${theme.muted} leading-tight mt-0.5`}>1400 pts vs Rival de 1200 pts</p></div><div className="shrink-0 text-right"><span className={`${theme.bg} ${theme.muted} px-3 py-1.5 rounded-lg font-black text-[11px] border ${theme.border} inline-block`}>+6 Pts</span></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${theme.card} border ${theme.border} rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden`}>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#E5B824]/10 rounded-full blur-3xl"></div>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-5 relative z-10 tracking-tighter">Confiabilidad</h3>
                <p className={`${theme.muted} text-sm font-bold mb-6 relative z-10 leading-relaxed`}>En Ventaja Adentro respetamos el tiempo de todos. Tienes 5 Pelotas de Confiabilidad, protégelas:</p>
                <div className={`space-y-4 relative z-10 text-xs ${theme.text}`}>
                  <div className={`${theme.bg} p-5 rounded-2xl border ${theme.border} shadow-inner space-y-5`}>
                    <div className="flex gap-4 items-start"><span className="text-[#29C454] text-xl leading-none drop-shadow-sm">🟢</span><div><p className="font-black uppercase tracking-wider text-[11px] mb-1">Cancelación Libre (24h+)</p><p className={`font-bold leading-relaxed ${theme.muted}`}>Avisar con más de un día de anticipación no tiene penalización. El buscador tiene tiempo para otro rival.</p></div></div>
                    <div className="flex gap-4 items-start"><span className="text-[#E5B824] text-xl leading-none drop-shadow-sm">🟡</span><div><p className="font-black uppercase tracking-wider text-[11px] mb-1">Los 2 Comodines (24h a 3h)</p><p className={`font-bold leading-relaxed ${theme.muted}`}>Tienes 2 cancelaciones al mes para imprevistos. <span className="text-[#E5B824]">Ojo: Solo 1 comodín</span> sirve para emergencias extremas. Si te los acabas, perderás Confiabilidad.</p></div></div>
                    <div className="flex gap-4 items-start"><span className="text-red-500 text-xl leading-none drop-shadow-sm">🔴</span><div><p className="font-black uppercase tracking-wider text-[11px] mb-1">Walkover / W.O. (-30 mins)</p><p className={`font-bold leading-relaxed ${theme.muted}`}>Faltar a la cancha o cancelar a menos de 30 mins es castigo máximo. <span className="text-[#F50514]">Tu ELO caerá (como perder 6-0, 6-0) y tu Confiabilidad se desplomará</span>.</p></div></div>
                  </div>
                </div>
              </div>

              <div className={`${theme.card} border ${theme.border} rounded-[2.5rem] p-8 shadow-sm`}>
                <h3 className="text-2xl font-black italic uppercase text-[#29C454] mb-2 tracking-tighter">Buzón</h3>
                <p className={`${theme.muted} text-sm font-bold mb-5 leading-relaxed`}>¿Ideas, reportes de error o sugerencias? Háznoslo saber.</p>
                <div className="space-y-3">
                  <textarea placeholder="Escribe tu comentario aquí..." value={comentario} onChange={(e) => setComentario(e.target.value)} className={`w-full ${theme.bg} border ${theme.border} rounded-2xl px-5 py-4 ${theme.text} font-bold text-sm focus:outline-none focus:border-[#29C454] resize-none h-28 shadow-inner`} />
                  <button onClick={async (e) => {
                      e.preventDefault(); if(!comentario.trim()) return; const btn = e.currentTarget; const textoOriginal = btn.innerText; btn.innerText = 'Enviando...';
                      try { const { error } = await supabase.from('sugerencias').insert([{ jugador_id: isLoggedIn && currentUser ? currentUser.id : null, nombre: isLoggedIn && currentUser ? currentUser.nombre : 'Anónimo', comentario: comentario.trim(), estado: 'nueva' }]); if (error) throw error; mostrarAlerta("Buzón", "¡Gracias por hacer VAd. mejor! Hemos recibido tu comentario y lo revisaremos pronto."); setComentario(''); } catch (error) { mostrarError("Error", "Hubo un error al enviar el mensaje. Intenta de nuevo."); } finally { btn.innerText = textoOriginal; }
                    }} className="w-full bg-[#29C454] text-white py-4 rounded-xl font-black italic uppercase text-xs shadow-lg shadow-[#29C454]/20 active:scale-95 transition-all hover:brightness-105">
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
                <div className="text-center"><h2 className={`text-3xl font-black italic ${theme.text} uppercase tracking-tight mb-2`}>Iniciar Sesión</h2><p className={`${theme.muted} text-sm`}>Ingresa con tu celular y PIN.</p></div>
                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div className="space-y-2 text-left"><label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme.muted}`}>Celular</label><div className="flex gap-2"><select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)} className={`w-1/3 ${theme.card} border ${theme.border} rounded-2xl px-2 py-4 ${theme.text} font-bold shadow-sm appearance-none cursor-pointer`}><option value="+52">🇲🇽 +52</option><option value="+1">🇺🇸 +1</option></select><input type="tel" required maxLength="10" placeholder="123 456 7890" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className={`w-2/3 ${theme.card} border ${theme.border} rounded-2xl px-5 py-4 ${theme.text} font-bold tracking-widest focus:outline-none focus:border-[#29C454]`} /></div></div>
                  <div className="space-y-2 text-left mt-2"><label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme.muted}`}>PIN (4 dígitos)</label><input type="password" inputMode="numeric" required maxLength="4" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className={`w-full ${theme.card} border ${theme.border} rounded-2xl px-5 py-4 text-center text-2xl tracking-[1em] ${theme.text} font-black focus:outline-none focus:border-[#29C454]`} /></div>
                  {authError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center animate-in fade-in">{authError}</div>}
                  <button type="submit" disabled={authLoading} className="w-full bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all mt-4">{authLoading ? 'Conectando...' : 'Entrar al Circuito ➜'}</button>
                </form>
                <button onClick={() => setTab('home')} className={`w-full text-[10px] font-black uppercase tracking-widest pt-2 ${theme.muted}`}>Cancelar</button>
              </>
            ) : (
              <div className="animate-in fade-in space-y-8">
                <div className="text-center"><h2 className={`text-3xl font-black italic ${theme.text} uppercase tracking-tight mb-2`}>Nuevo Jugador</h2><p className={`${theme.muted} text-sm`}>{regStep === 1 ? 'Ingresa tus datos' : 'Crea tu PIN de seguridad'}</p></div>
                {regStep === 1 ? (
                  <form onSubmit={handleRegisterCheckPhone} className="space-y-4">
                    <input type="text" required placeholder="Nombre" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} className={`w-full ${theme.card} border ${theme.border} rounded-2xl px-5 py-4 ${theme.text} font-bold focus:outline-none focus:border-[#29C454]`} />
                    <input type="text" required placeholder="Apellido" value={regApellido} onChange={(e) => setRegApellido(e.target.value)} className={`w-full ${theme.card} border ${theme.border} rounded-2xl px-5 py-4 ${theme.text} font-bold focus:outline-none focus:border-[#29C454]`} />
                    <div className="flex gap-2"><select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)} className={`w-1/3 ${theme.card} border ${theme.border} rounded-2xl px-2 py-4 ${theme.text} font-bold shadow-sm appearance-none cursor-pointer`}><option value="+52">🇲🇽 +52</option><option value="+1">🇺🇸 +1</option></select><input type="tel" required maxLength="10" placeholder="123 456 7890" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className={`w-2/3 ${theme.card} border ${theme.border} rounded-2xl px-5 py-4 ${theme.text} font-bold tracking-widest focus:outline-none focus:border-[#29C454]`} /></div>
                    {authError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center">{authError}</div>}
                    <button type="submit" disabled={authLoading} className={`w-full ${modoOscuro ? 'bg-white text-[#0F172A]' : 'bg-[#1A1C1E] text-white'} py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all`}>{authLoading ? 'Verificando...' : 'Siguiente ➜'}</button>
                    <button type="button" onClick={() => { setIsRegistering(false); setAuthError(''); }} className={`w-full text-[10px] font-black uppercase tracking-widest pt-4 ${theme.muted}`}>Ya tengo cuenta</button>
                  </form>
                ) : (
                  <form onSubmit={handleCompleteRegistration} className="space-y-4">
                    <div className="space-y-2 text-left"><label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme.muted}`}>PIN (4 dígitos)</label><input type="password" inputMode="numeric" required maxLength="4" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className={`w-full ${theme.card} border ${theme.border} rounded-2xl px-5 py-4 text-center text-2xl tracking-[1em] ${theme.text} font-black focus:outline-none focus:border-[#29C454]`} /></div>
                    {authError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center">{authError}</div>}
                    <button type="submit" disabled={authLoading} className="w-full bg-[#29C454] text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all mt-4">{authLoading ? 'Creando...' : 'Finalizar Registro ➜'}</button>
                    <button type="button" onClick={() => setRegStep(1)} className={`w-full text-[10px] font-black uppercase tracking-widest pt-4 ${theme.muted}`}>Volver</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* VISTA UNIFICADA: JUGAR (MATCH O RESERVA) */}
        {tab === 'jugar' && (
          <div className="w-full max-w-sm mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500 mt-4 flex flex-col items-center pb-20">
            <div className={`${theme.card} p-1.5 rounded-2xl border ${theme.border} shadow-sm flex w-full relative z-20`}><button onClick={() => setModoCancha('match')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${modoCancha === 'match' ? 'bg-[#29C454] text-white shadow-md' : `${theme.muted} hover:${theme.bg}`}`}>🏆 Match (Puntos)</button><button onClick={() => setModoCancha('libre')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${modoCancha === 'libre' ? 'bg-[#007AFF] text-white shadow-md' : `${theme.muted} hover:${theme.bg}`}`}>🎾 Reserva Libre</button></div>
            <form onSubmit={modoCancha === 'match' ? handleSearchSubmit : handleBookSubmit} className="w-full">
              <div className={`${theme.card} border ${theme.border} rounded-[2.5rem] p-6 shadow-sm space-y-6 relative w-full`}>
                <div className="text-center mb-2"><h2 className={`text-3xl font-black italic uppercase transition-colors duration-300 ${modoCancha === 'match' ? 'text-[#29C454]' : 'text-[#007AFF]'}`}>{modoCancha === 'match' ? 'Buscar Rival' : 'Reserva Libre'}</h2><p className={`text-[10px] font-bold mt-1 ${theme.muted}`}>{modoCancha === 'match' ? 'Juega por ELO en el circuito.' : 'Entrena sin afectar tus puntos.'}</p></div>
                <div className="space-y-3 text-left w-full"><label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme.muted}`}>Día de Juego</label><input type="date" min={initData.date} value={modoCancha === 'match' ? searchDate : bookDate} onChange={(e) => modoCancha === 'match' ? setSearchDate(e.target.value) : setBookDate(e.target.value)} required className={`w-full ${theme.bg} border ${theme.border} rounded-2xl px-5 py-4 ${theme.text} font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none`} /></div>
                <div className="space-y-3 text-left w-full"><label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${theme.muted}`}>Superficie</label><select value={superficie} onChange={(e) => setSuperficie(e.target.value)} className={`w-full ${theme.bg} border ${theme.border} rounded-2xl px-5 py-4 ${theme.text} font-black uppercase tracking-wider focus:outline-none focus:border-[#29C454] shadow-inner appearance-none`}><option value="Dura">Cancha Dura (1 al 8)</option><option value="Césped">Césped (9 y 10)</option></select></div>
                <div className="space-y-3 text-left w-full">
                  <div className="ml-2"><label className={`text-[15px] font-black uppercase tracking-widest transition-colors duration-300 ${modoCancha === 'match' ? 'text-[#29C454]' : 'text-[#007AFF]'}`}>Rango de disponibilidad</label>{modoCancha === 'match' && <p className="text-[13px] font-bold text-[#29C454]/80 mt-1 leading-snug">Abre tu rango lo más posible para hacer match.</p>}</div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <input type="time" step="1800" value={modoCancha === 'match' ? startTime : bookStart} onChange={(e) => handleStartTimeChange(e.target.value, modoCancha === 'match')} required className={`w-full ${theme.bg} border ${theme.border} rounded-2xl py-4 ${theme.text} font-black text-center focus:outline-none focus:ring-2 transition-all ${modoCancha === 'match' ? 'focus:ring-[#29C454]/50' : 'focus:ring-[#007AFF]/50'}`} />
                    <input type="time" step="1800" value={modoCancha === 'match' ? endTime : bookEnd} onChange={(e) => handleEndTimeChange(e.target.value, modoCancha === 'match')} required className={`w-full ${theme.bg} border ${theme.border} rounded-2xl py-4 ${theme.text} font-black text-center focus:outline-none focus:ring-2 transition-all ${modoCancha === 'match' ? 'focus:ring-[#29C454]/50' : 'focus:ring-[#007AFF]/50'}`} />
                  </div>
                </div>
                {searchError && modoCancha === 'match' && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-bold text-center leading-relaxed">{searchError}</div>}
              </div>
              <div className="pt-6 flex flex-col items-center"><button type="submit" className={`w-full flex items-center justify-center gap-2 px-8 text-white py-5 rounded-2xl font-black italic uppercase text-sm shadow-lg active:scale-95 transition-all duration-300 ${modoCancha === 'match' ? 'bg-[#29C454] hover:bg-[#29C454]/90 shadow-[#29C454]/30' : 'bg-[#007AFF] hover:bg-[#007AFF]/90 shadow-[#007AFF]/30'}`}>{modoCancha === 'match' ? <><span className="text-[#F8F7F2] animate-pulse">●</span> Buscar rival</> : 'Pagar Reserva ➜'}</button></div>
            </form>
            
            {isLoggedIn && activeSearches.length > 0 && modoCancha === 'match' && (
              <div className="pt-4 space-y-4 animate-in fade-in w-full">
                <h3 className={`text-sm font-black italic ${theme.text} uppercase border-b ${theme.border} pb-2`}>Búsquedas Activas</h3>
                <div className="space-y-3">
                  {activeSearches.map((search) => (
                    <div key={search.id} className={`${theme.card} border border-[#29C454]/30 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden`}>
                      <div className="absolute left-0 top-0 w-1 h-full bg-[#29C454] animate-pulse"></div>
                      <div className="pl-2 text-left">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}>{new Date(search.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} {search.superficie && ` • ${search.superficie}`}</p>
                        <p className={`text-sm font-black mt-1 ${theme.text}`}>{formatTime(search.hora_inicio)} - {formatTime(search.hora_fin)}</p>
                      </div>
                      <button onClick={() => handleCancelSearch(search.id)} className={`w-10 h-10 ${theme.bg} ${theme.muted} rounded-full hover:bg-red-50 hover:text-red-500 transition-colors`}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISTA: MIS PARTIDOS CON TODOS LOS BOTONES RESTAURADOS */}
        {tab === 'partidos' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-sm mx-auto pb-20">
            <h2 className={`text-3xl font-black italic ${theme.text} uppercase tracking-tight text-center`}>Partidos</h2>
            <div className={`space-y-4 text-left ${!isLoggedIn && 'opacity-80'}`}>
              {!isLoggedIn ? (
                <div className={`${theme.card} border-2 border-[#29C454]/30 rounded-[2rem] p-6 shadow-sm relative overflow-hidden`}><div className="absolute right-0 top-0 opacity-5 text-8xl transform translate-x-4 -translate-y-4">🎾</div><div className="relative z-10"><p className="text-xs font-bold uppercase tracking-widest text-[#29C454] mb-1">Jueves, 16 Abril</p><h4 className={`text-3xl font-black italic mb-4 ${theme.text}`}>6:00 PM - 8:00 PM</h4></div></div>
              ) : misPartidos.length === 0 ? (
                <div className={`text-center ${theme.card} border ${theme.border} rounded-[2.5rem] p-8 shadow-sm`}><p className="text-4xl mb-4 opacity-50">🕸️</p><p className={`${theme.muted} font-bold text-sm`}>Aún no tienes partidos.</p></div>
              ) : (
                misPartidos.map((partido) => {
                  const esVictoria = partido.ganador_id === currentUser.id;
                  const colorAcento = esVictoria ? 'text-[#E5B824]' : 'text-[#007AFF]';
                  const bgAcento = esVictoria ? 'bg-[#E5B824]/10' : 'bg-[#007AFF]/10';
                  const borderAcento = esVictoria ? 'border-[#E5B824]/30' : 'border-[#007AFF]/30';

                  return (
                    <React.Fragment key={partido.id}>
                      {partido.estado === 'finalizado' || partido.estado === 'wo' ? (
                        <div className={`${theme.card} border ${borderAcento} rounded-2xl p-4 shadow-sm flex items-center justify-between animate-in fade-in`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black italic uppercase shadow-inner text-white text-xs" style={{ backgroundColor: partido.rival.color || '#1A1C1E' }}>{getInitials(partido.rival.nombre)}</div>
                            <div>
                              <p className={`text-[9px] font-bold uppercase tracking-widest opacity-50 mb-0.5 ${theme.text}`}>{new Date(partido.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {partido.estado === 'wo' ? 'W.O.' : 'Terminó'}</p>
                              <p className={`font-black italic text-sm ${colorAcento}`}>{partido.estado === 'wo' ? 'W.O. vs ' : esVictoria ? '🏆 W vs ' : '❌ L vs '} <span className={theme.text}>{partido.rival.nombre}</span></p>
                            </div>
                          </div>
                          <div className={`text-right ${bgAcento} px-3 py-2 rounded-xl border ${borderAcento}`}><p className={`text-[8px] font-black uppercase tracking-widest ${colorAcento} opacity-80 mb-1`}>Marcador</p><p className={`font-black italic text-base leading-none ${colorAcento}`}>{getRelativeMarcador(partido)}</p></div>
                        </div>
                      ) : (
                        <div className={`${theme.card} border-2 ${partido.estado === 'confirmado' ? 'border-[#29C454]/40' : 'border-[#E5B824]/40'} rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-colors`}>
                          <div className="absolute right-0 top-0 opacity-5 text-8xl transform translate-x-4 -translate-y-4">🎾</div>
                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-xs font-bold uppercase tracking-widest ${partido.estado === 'confirmado' ? 'text-[#29C454]' : 'text-[#E5B824]'}`}>{new Date(partido.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                              {partido.cancha_numero && <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${partido.estado === 'confirmado' ? 'bg-[#29C454]/10 text-[#29C454] border border-[#29C454]/20' : 'bg-[#E5B824]/10 text-[#E5B824] border border-[#E5B824]/20'}`}>Cancha {partido.cancha_numero}</span>}
                            </div>
                            <h4 className={`text-3xl font-black italic mb-4 ${theme.text}`}>{formatTime(partido.hora_inicio)} - {formatTime(partido.hora_fin)}</h4>
                            <div className={`flex items-center gap-4 ${theme.bg} p-3 rounded-xl border ${theme.border} mb-4 shadow-inner`}>
                              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black italic text-xl uppercase shadow-md text-white" style={{ backgroundColor: partido.rival.color || '#1A1C1E' }}>{getInitials(partido.rival.nombre)}</div>
                              <div><p className={`text-[10px] uppercase tracking-widest font-black ${theme.muted}`}>Rival Confirmado</p><p className={`font-black italic text-xl ${theme.text}`}>{partido.rival.nombre}</p></div>
                            </div>

                            {/* LOGICA RESTAURADA DE BOTONES DE REPORTE Y CANCELACIÓN */}
                            {partido.estado === 'confirmado' && (
                              obtenerEstadoTiempo(partido) === 'terminado' ? (
                                reportingMatch === partido.id ? (
                                  <div className={`mt-4 ${theme.bg} p-4 rounded-2xl space-y-4 border ${theme.border}`}>
                                    
                                    {/* Encabezados de Score */}
                                    <div className={`flex justify-between px-1 text-[9px] font-black uppercase tracking-widest ${theme.muted}`}>
                                      <span className="w-14 text-center text-[#29C454]">Mi Score</span>
                                      <span className="text-center">Set</span>
                                      <span className="w-14 text-center text-[#007AFF]">Su Score</span>
                                    </div>

                                    {/* Sets */}
                                    <div className="flex gap-2 items-center justify-between">
                                      <select value={s1Mi} onChange={(e)=>setS1Mi(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black text-black bg-white appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                      <span className="font-bold text-[10px] text-gray-500">1</span>
                                      <select value={s1Rival} onChange={(e)=>setS1Rival(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black text-black bg-white appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                    </div>
                                    <div className="flex gap-2 items-center justify-between">
                                      <select value={s2Mi} onChange={(e)=>setS2Mi(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black text-black bg-white appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                      <span className="font-bold text-[10px] text-gray-500">2</span>
                                      <select value={s2Rival} onChange={(e)=>setS2Rival(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black text-black bg-white appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                    </div>
                                    <div className={`flex gap-2 items-center justify-between transition-all ${partidoDefinidoEnDosSets ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                      <select disabled={partidoDefinidoEnDosSets} value={partidoDefinidoEnDosSets ? '' : s3Mi} onChange={(e)=>setS3Mi(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black text-black bg-white appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                      <span className="font-bold text-[10px] text-gray-500">3</span>
                                      <select disabled={partidoDefinidoEnDosSets} value={partidoDefinidoEnDosSets ? '' : s3Rival} onChange={(e)=>setS3Rival(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black text-black bg-white appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                      <button onClick={() => setReportingMatch(null)} className="flex-1 py-3 rounded-xl font-black text-xs bg-gray-500/10 hover:bg-gray-500/20">Cancelar</button>
                                      <button onClick={() => handleSubmitReport(partido)} className="flex-1 bg-[#29C454] text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all">Enviar</button>
                                    </div>
                                    <button onClick={() => handleWO(partido)} className="w-full border-2 border-red-500/40 bg-red-500/10 text-red-600 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] mt-2 active:scale-95 transition-all">🚨 El rival no se presentó (W.O.)</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setReportingMatch(partido.id)} className="w-full bg-[#29C454] text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all">Reportar Resultado ➜</button>
                                )
                              ) : obtenerEstadoTiempo(partido) === 'en_curso' ? (
                                <div className="text-center py-4 bg-[#29C454]/10 rounded-2xl border border-dashed border-[#29C454]/50"><p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-[#29C454]">Partido en curso 🔥</p><p className={`text-[9px] opacity-60 mt-1 ${theme.text}`}>El reporte se habilitará al terminar.</p></div>
                              ) : (
                                <div className={`text-center pt-8 pb-4 ${theme.bg} rounded-[1.8rem] shadow-inner relative overflow-hidden border ${theme.border}`}>
                                  {((new Date(`${partido.fecha}T${partido.hora_inicio}`) - currentTime) / (1000 * 60 * 60)) > 0.5 ? (
                                    <button onClick={() => handleCancelMatch(partido)} className={`absolute top-3 right-4 w-8 h-8 ${theme.card} ${theme.muted} border ${theme.border} rounded-full flex items-center justify-center text-xs font-black hover:bg-red-500 hover:text-white transition-all z-20`}>✕</button>
                                  ) : (
                                    <button onClick={() => handleSelfWO(partido)} className="absolute top-3 right-4 bg-red-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-md hover:scale-105 active:scale-95 transition-all z-20">(W.O.)</button>
                                  )}
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#29C454] mb-3 relative z-10">El partido inicia en</p>
                                  <p className={`text-3xl font-black italic tracking-[0.1em] font-mono ${theme.text}`}>{getCountdown(partido)}</p>
                                </div>
                              )
                            )}

                            {partido.estado === 'en_revision' && (
                              <div className="bg-[#E5B824]/10 p-4 rounded-xl border border-[#E5B824]/30 mt-4">
                                {partido.reportado_por === currentUser.id ? (
                                  <p className="text-xs font-black uppercase text-[#E5B824] text-center">⏳ Esperando que el rival confirme</p>
                                ) : (
                                  <div className="text-center space-y-3">
                                    <p className="text-xs font-black text-[#E5B824] uppercase tracking-widest mb-2">
                                      {partido.marcador === 'W.O.' ? '🚨 Tu rival reportó W.O. por inasistencia' : `Tu rival reportó: ${partido.marcador}`}
                                    </p>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleRejectReport(partido)} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black uppercase text-xs shadow-md active:scale-95 transition-all">Impugnar</button>
                                      <button onClick={() => handleConfirmReport(partido)} className="flex-1 bg-[#007AFF] text-white py-3 rounded-xl font-black uppercase text-xs shadow-md active:scale-95 transition-all">Confirmar</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {partido.estado === 'en_disputa' && (
                              <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 mt-4 text-center">
                                <p className="text-xs font-black uppercase text-red-500 tracking-widest">⚠️ En Disputa Administrativa</p>
                                <p className={`text-[9px] mt-1 opacity-70 ${theme.text}`}>El club resolverá el resultado pronto.</p>
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
            <div className={`w-full ${theme.card} border ${theme.border} rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden`}>
              
              <div className="absolute top-0 left-0 w-full py-4 shadow-md transition-colors duration-300" style={{ backgroundColor: (isLoggedIn && currentUser?.color) ? currentUser.color : '#29C454' }}>
                <p className="text-sm font-black tracking-[0.4em] uppercase text-white drop-shadow-sm">
                  {isLoggedIn && currentUser ? (currentUser.rol === 'club' ? 'Modo Club' : getFuerza(currentUser.elo)) : 'Modo Espectador'}
                </p>
              </div>

              <div className="relative mt-12 mb-4">
                <div className={`w-28 h-28 ${theme.bg} rounded-full border-[5px] flex items-center justify-center font-black italic text-5xl uppercase shadow-inner transition-colors duration-300`} style={{ borderColor: (isLoggedIn && currentUser?.color) ? currentUser.color : (modoOscuro ? '#F8F9FA' : '#1A1C1E'), color: (isLoggedIn && currentUser?.color) ? currentUser.color : (modoOscuro ? '#F8F9FA' : '#1A1C1E') }}>
                  {isLoggedIn && currentUser ? getInitials(currentUser.nombre) : '🎾'}
                </div>
                {isLoggedIn && (
                  <button onClick={() => setShowColorPicker(!showColorPicker)} className={`absolute bottom-0 right-0 ${theme.card} p-1.5 rounded-full shadow-md border ${theme.border} text-sm hover:scale-110 transition-transform active:scale-95`} title="Cambiar Color">🎨</button>
                )}
              </div>

              {showColorPicker && (
                <div className={`flex gap-3 mb-6 p-3 ${theme.bg} rounded-2xl shadow-inner border ${theme.border} animate-in fade-in slide-in-from-top-2`}>
                  {['#29C454', '#007AFF', '#FF3B30', '#AF52DE', '#FF9500', '#1A1C1E'].map(colorHex => (
                    <button key={colorHex} onClick={() => handleColorChange(colorHex)} className="w-8 h-8 rounded-full shadow-md active:scale-90 transition-all border-2 border-white" style={{ backgroundColor: colorHex }} />
                  ))}
                </div>
              )}
              
              <h2 className="text-4xl font-black italic uppercase tracking-tight transition-colors duration-300" style={{ color: (isLoggedIn && currentUser?.color) ? currentUser.color : (modoOscuro ? '#F8F9FA' : '#1A1C1E') }}>
                {isLoggedIn && currentUser ? currentUser.nombre : 'Jugador Pro'}
              </h2>
              <p className={`${theme.muted} font-bold tracking-widest text-xs mb-6 uppercase mt-1`}>
                {isLoggedIn && currentUser ? (currentUser.rol === 'club' ? 'Panel de Administración' : `Miembro • ${currentUser.rol || 'Gratis'}`) : 'Regístrate para jugar'}
              </p>

              {/* SI NO ES CLUB, MOSTRAR STATS DE JUGADOR */}
              {isLoggedIn && currentUser?.rol !== 'club' && (
                <>
                  <div className={`${theme.bg} w-full rounded-2xl p-4 border ${theme.border} mb-6`}>
                    <div className="flex justify-between items-center mb-2">
                      <p className={`text-[9px] font-black uppercase tracking-widest ${theme.muted}`}>Confiabilidad</p>
                      <span className="text-[9px] font-black text-[#E5B824] uppercase tracking-widest bg-[#E5B824]/10 px-2 py-0.5 rounded-md">Comodines: {currentUser.comodines !== undefined ? currentUser.comodines : 2}</span>
                    </div>
                    {renderBalls(currentUser.confianza)}
                  </div>
                  <div className={`flex gap-3 w-full border-t ${theme.border} pt-6`}>
                    <div className={`flex-1 ${theme.card} border ${theme.border} rounded-2xl py-4 shadow-sm`}><p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme.muted}`}>Tu ELO</p><p className="text-2xl font-black italic text-[#29C454]">{currentUser.elo}</p></div>
                    <div className={`flex-1 ${theme.card} border ${theme.border} rounded-2xl py-4 shadow-sm relative overflow-hidden`}><p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme.muted}`}>Racha Actual</p><p className={`text-2xl font-black italic ${theme.text}`}>{currentUser.racha_asistencia || 0} 🔥</p></div>
                  </div>
                </>
              )}

              {/* SI ES CLUB, MOSTRAR INSIGNIA DE SOCIO */}
              {isLoggedIn && currentUser?.rol === 'club' && (
                <div className={`py-6 w-full border-t ${theme.border}`}>
                  <span className="bg-[#007AFF]/10 text-[#007AFF] px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest border border-[#007AFF]/20">Socio Comercial VAd.</span>
                </div>
              )}

              <div className={`w-full ${theme.card} border ${theme.border} rounded-2xl p-4 flex items-center justify-between shadow-sm mt-6`}>
                <div className="flex items-center gap-3"><span className="text-xl">{modoOscuro ? '🌙' : '☀️'}</span><p className={`font-black uppercase tracking-widest text-[11px] ${theme.text}`}>Modo Oscuro</p></div>
                <button onClick={toggleTheme} className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner ${modoOscuro ? 'bg-[#29C454]' : 'bg-[#1A1C1E]/20'}`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${modoOscuro ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* --- SECCIÓN EXCLUSIVA ADMIN --- */}
              {isLoggedIn && currentUser?.rol === 'admin' && (
                <div className={`w-full mt-8 pt-8 border-t ${theme.border} space-y-4`}>
                  <h3 className="text-sm font-black italic uppercase text-[#29C454]">Consola Master</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { cargarSugerenciasAdmin(); setTab('admin_buzon'); }} className={`w-full ${modoOscuro ? 'bg-white text-[#0F172A]' : 'bg-[#1A1C1E] text-white'} py-4 rounded-2xl font-black italic uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 relative transition-transform active:scale-95`}>
                      📩 Buzón {sugerenciasNuevas > 0 && <span className="absolute -top-2 -right-2 bg-[#29C454] text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-4 border-[#F8F7F2] animate-bounce">{sugerenciasNuevas}</span>}
                    </button>
                    <button onClick={() => { cargarUsuariosAdmin(); setTab('admin_usuarios'); }} className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-black italic uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">👥 Jugadores</button>
                    <button onClick={() => { fetchClubPartidos(); setTab('club_agenda'); }} className="col-span-2 w-full bg-[#E5B824] text-[#1A1C1E] py-4 rounded-2xl font-black italic uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                      📅 Master Schedule (Vista Club)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <button onClick={handleLogout} className="w-full bg-transparent border-2 border-red-500/20 text-red-500/80 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-colors mt-4">
                Cerrar Sesión
              </button>
            )}
          </div>
        )}

        {/* =========================================
            VISTA B2B: MASTER SCHEDULE (FULL SCREEN + FILTROS)
        ========================================= */}
        {tab === 'club_agenda' && (currentUser?.rol === 'club' || currentUser?.rol === 'admin') && (() => {
          
          // Generamos las columnas basadas en los Días y las Canchas seleccionadas
          const columnasGrid = selectedDays.flatMap(day => filtroCanchas.map(c => ({ day, c })));
          // Generamos las filas en intervalos de 30 minutos (0.5)
          const horasGrid = [];
          for (let h = rangoHoras.start; h <= rangoHoras.end; h += 0.5) { horasGrid.push(h); }

          return (
            <div className="w-full px-2 md:px-8 space-y-6 animate-in fade-in pb-20 max-w-[1600px] mx-auto">
              
              {/* CABECERA CENTRADA Y BOTONERA */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div>
                  <h2 className={`text-5xl font-black italic uppercase tracking-tighter ${theme.text}`}>Control Maestro de Canchas</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#007AFF] mt-1">Centro Tenistico de Alto Rendimiento Punta Azul</p>
                </div>
                
                {/* Panel de Filtros */}
                <div className={`w-full max-w-4xl ${theme.card} border ${theme.border} p-4 rounded-3xl shadow-sm space-y-4`}>
                  
                  {/* Selector de Días (Multi-Select) */}
                  <div className="flex items-center gap-2 justify-center bg-[#007AFF]/5 p-2 rounded-2xl border border-[#007AFF]/10">
                    <button onClick={() => changeWeek(-1)} className={`p-3 rounded-xl font-black ${theme.card} border ${theme.border} text-[#007AFF] active:scale-95 shadow-sm`}>⇇</button>
                    <div className="flex gap-2 overflow-x-auto max-w-[80vw] md:max-w-none pb-1 scrollbar-hide px-2">
                      {weekDays.map((date, i) => {
                        const dateStr = getFormatDate(date);
                        const isSelected = selectedDays.includes(dateStr);
                        const dName = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][date.getDay()];
                        return (
                          <button key={i} onClick={() => toggleSelectedDay(date)} className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[4rem] transition-all border active:scale-95 ${isSelected ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md scale-105' : `${theme.bg} ${theme.text} ${theme.border}`}`}>
                            <span className="text-[9px] uppercase font-black opacity-70 mb-0.5">{dName}</span>
                            <span className="text-lg font-black leading-none">{date.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => changeWeek(1)} className={`p-3 rounded-xl font-black ${theme.card} border ${theme.border} text-[#007AFF] active:scale-95 shadow-sm`}>⇉</button>
                  </div>

                  <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 pt-2">
                    {/* Selector de Canchas */}
                    <div className="flex flex-wrap justify-center items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase opacity-40 mr-1 ${theme.text}`}>Canchas:</span>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button key={n} onClick={() => toggleFiltroCancha(n)} className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all border ${filtroCanchas.includes(n) ? 'bg-[#29C454] text-white border-[#29C454] shadow-sm' : `${theme.bg} ${theme.muted} ${theme.border}`}`}>
                          C{n}
                        </button>
                      ))}
                    </div>

                    {/* Selector de Horas */}
                    <div className={`flex items-center gap-2 md:border-l ${theme.border} md:pl-8`}>
                      <span className={`text-[10px] font-black uppercase opacity-40 ${theme.text}`}>De:</span>
                      <select value={rangoHoras.start} onChange={e => setRangoHoras(p => ({...p, start: Number(e.target.value)}))} className={`bg-transparent border ${theme.border} rounded-lg p-1.5 text-xs font-black ${theme.text} focus:outline-none`}>
                        {[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map(h => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                      <span className={`text-[10px] font-black uppercase opacity-40 ${theme.text}`}>Hasta:</span>
                      <select value={rangoHoras.end} onChange={e => setRangoHoras(p => ({...p, end: Number(e.target.value)}))} className={`bg-transparent border ${theme.border} rounded-lg p-1.5 text-xs font-black ${theme.text} focus:outline-none`}>
                        {[8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map(h => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                    </div>
                    
                    {/* Botón Limpiar Filtros */}
                    <button 
                      onClick={limpiarFiltrosAgenda}
                      className={`md:border-l ${theme.border} md:pl-1 flex items-center gap- px-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme.muted} hover:bg-red-500/10 hover:text-red-500 active:scale-95`}
                    >
                      <span>🧹</span> Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* CUADRÍCULA RESULTANTE (Transpuesta - Línea de Tiempo Horizontal con División de Días) */}
              <div className={`${theme.card} border ${theme.border} rounded-3xl p-4 shadow-2xl overflow-x-auto overflow-y-auto max-h-[75vh] custom-scrollbar`}>
                <div className="flex flex-col gap-1.5 min-w-max pb-4 pr-4">
                  
                  {/* ENCABEZADO DE HORAS (Eje X Fijo Superior) */}
                  <div className={`flex gap-1.5 sticky top-0 z-20 ${theme.card} pb-2 border-b ${theme.border}`}>
                    <div className={`w-28 md:w-36 shrink-0 sticky left-0 z-30 ${theme.card} flex items-end justify-end pr-4`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${theme.muted} mb-1`}>Línea de Tiempo ➜</span>
                    </div>
                    {horasGrid.map(horaFloat => {
                      const hInt = Math.floor(horaFloat);
                      const mInt = horaFloat % 1 === 0 ? 0 : 30;
                      const isHalfHour = mInt === 30;
                      return (
                        <div key={horaFloat} className="w-20 md:w-24 shrink-0 flex flex-col items-center justify-end">
                          <span className={`text-[10px] md:text-xs font-black ${isHalfHour ? theme.muted : theme.text} ${isHalfHour ? 'opacity-40' : 'opacity-100'}`}>
                            {hInt > 12 ? hInt - 12 : hInt}:{mInt === 0 ? '00' : '30'}
                          </span>
                          <span className={`text-[8px] font-bold ${theme.muted} uppercase`}>{hInt >= 12 ? 'PM' : 'AM'}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* FILAS DE CANCHAS AGRUPADAS POR DÍA (Eje Y) */}
                  {selectedDays.map((dayStr) => (
                    <React.Fragment key={dayStr}>
                      {/* DIVISIÓN DE CAMBIO DE DÍA */}
                      {selectedDays.length > 1 && (
                        <div className={`flex w-full sticky left-0 z-10 bg-[#007AFF]/10 border-y border-[#007AFF]/20 p-2 mt-4 mb-2 rounded-r-xl`}>
                          <span className="text-[#007AFF] font-black text-xs uppercase tracking-widest">
                            📅 {new Date(dayStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}

                      {filtroCanchas.map(c => {
                        const [y, m, d] = dayStr.split('-');
                        return (
                          <div key={`${dayStr}-${c}`} className="flex gap-1.5 group">
                            
                            {/* Cabecera de Fila Fija Izquierda */}
                            <div className={`w-28 md:w-36 shrink-0 sticky left-0 z-10 ${theme.card} p-2 flex flex-col justify-center items-end pr-4 rounded-r-2xl shadow-[4px_0_10px_-4px_rgba(0,0,0,0.08)] border-r border-[#007AFF]/10`}>
                              <span className={`text-xs md:text-sm font-black uppercase ${theme.text}`}>Cancha {c}</span>
                              {selectedDays.length === 1 && <span className="text-[#007AFF] text-[9px] font-black tracking-widest opacity-80 mt-0.5">{d}/{m}</span>}
                            </div>

                            {/* Bloques de Tiempo Interactivos */}
                            {horasGrid.map(horaFloat => {
                              const partido = obtenerEstadoCelda(c, horaFloat, dayStr);
                              const esDisputa = partido?.estado === 'en_disputa';
                              const esVAd = partido && partido.estado !== 'bloqueo_admin' && !esDisputa;
                              const esBloqueo = partido && partido.estado === 'bloqueo_admin';
                              const tooltipText = esVAd ? `Partido VAd\n${partido.j1_nombre} vs ${partido.j2_nombre}\n(${formatTime(partido.hora_inicio)} - ${formatTime(partido.hora_fin)})` : esBloqueo ? `Bloqueo: ${partido.marcador || 'Administración'}` : esDisputa ? `DISPUTA: ${partido.j1_nombre} vs ${partido.j2_nombre}` : '';
                              
                              return (
                                <div 
                                  key={`${dayStr}-${c}-${horaFloat}`} 
                                  className={`w-20 md:w-24 shrink-0 h-16 relative rounded-xl transition-all duration-100 cursor-pointer active:scale-95 ${
                                    !esVAd && !esBloqueo && !esDisputa ? `bg-[#FFFFFF] dark:bg-white/5 border-2 border-[#A7F3D0] hover:bg-[#A7F3D0]/30 hover:shadow-md` : ''
                                  }`}
                                  onClick={() => handleCellClick(c, horaFloat, dayStr)}
                                >
                                  {esVAd && (
                                    <div title={tooltipText} className="absolute inset-0 bg-[#064E3B] rounded-xl flex items-center justify-center shadow-md overflow-hidden p-1 transform hover:scale-105 transition-transform z-10">
                                      <div className="flex flex-col items-center justify-center w-full">
                                        <span className="text-[8px] text-[#F9F8F1]/70 font-black uppercase mb-0.5 leading-none">
                                          {(partido.estado === 'finalizado' || partido.estado === 'wo') ? partido.marcador : 'VAd'}
                                        </span>
                                        <span className="text-[9px] md:text-[10px] text-[#F9F8F1] font-black text-center leading-tight truncate w-full">
                                          {partido.j1_nombre.split(' ')[0]}<br/><span className="text-[7px] opacity-70">vs</span><br/>{partido.j2_nombre.split(' ')[0]}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {esBloqueo && (
                                    <div title={tooltipText} className="absolute inset-0 bg-[#FECACA] rounded-xl flex flex-col items-center justify-center shadow-md hover:brightness-95 transform hover:scale-105 transition-all p-1 z-10">
                                      <span className="text-[#991B1B] text-xs mb-0.5">🔒</span>
                                      <span className="text-[8px] md:text-[9px] text-[#991B1B] font-black text-center leading-tight truncate w-full">
                                        {partido.marcador || 'Bloqueado'}
                                      </span>
                                    </div>
                                  )}

                                  {esDisputa && (
                                    <div title={tooltipText} className="absolute inset-0 bg-[#991B1B] rounded-xl flex flex-col items-center justify-center shadow-md hover:brightness-95 transform hover:scale-105 transition-all p-1 z-10 border-2 border-red-500 animate-pulse">
                                      <span className="text-[12px] text-white font-black mb-0.5 leading-none">⚠️</span>
                                      <span className="text-[8px] md:text-[9px] text-white font-black text-center leading-tight truncate w-full">
                                        DISPUTA<br/>{partido.j1_nombre.split(' ')[0]} v {partido.j2_nombre.split(' ')[0]}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      </main>

      {vadAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1A1C1E]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`${theme.card} w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border ${theme.border} animate-in zoom-in-95 duration-300`}>
            <div className="text-center mb-6 mt-2">
              <div className="text-4xl mb-3">{vadAlert.tipo === 'info' ? '🎾' : vadAlert.tipo === 'error' ? '🚨' : '⚠️'}</div>
              <h3 className={`text-xl font-black italic uppercase tracking-tight mb-2 ${vadAlert.tipo === 'error' ? 'text-red-500' : theme.text}`}>{vadAlert.titulo}</h3>
              <p className={`${theme.muted} font-bold text-sm leading-relaxed whitespace-pre-wrap`}>{vadAlert.mensaje}</p>
            </div>
            <div className="flex gap-3">
              {vadAlert.tipo === 'confirm' ? (
                <>
                  <button onClick={cerrarAlerta} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest ${theme.muted} ${theme.bg} border ${theme.border} hover:opacity-70 transition-opacity`}>Cancelar</button>
                  <button onClick={() => { vadAlert.accionConfirmar(); cerrarAlerta(); }} className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#29C454] shadow-lg shadow-[#29C454]/30 active:scale-95 transition-all">Confirmar</button>
                </>
              ) : (
                <button onClick={cerrarAlerta} className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all ${vadAlert.tipo === 'error' ? 'bg-red-500 shadow-red-500/30' : 'bg-[#29C454] shadow-[#29C454]/30'}`}>Entendido</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE ACCIÓN UX TÁCTIL v1.42 --- */}
      {bloqueoActivo && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#F9F8F1] w-full max-w-sm rounded-[24px] p-6 shadow-2xl border border-black/5 max-h-[90vh] overflow-y-auto">
            {modalAccion === 'reportar_admin' && partidoAdmin ? (
              <div className="space-y-4 mb-6 p-4 bg-white border border-black/10 rounded-2xl text-left">
                <h3 className="text-sm font-black text-[#991B1B]">⚠️ Override Administrativo</h3>
                <p className="text-[10px] text-black/60">Fuerza el resultado o decreta W.O. La decisión es final.</p>
                
                <div className="flex justify-between px-1 text-[9px] font-black uppercase tracking-widest text-black/40 mt-4">
                  <span className="w-14 text-center text-[#064E3B]">{partidoAdmin.j1_nombre.split(' ')[0]}</span>
                  <span className="text-center">Set</span>
                  <span className="w-14 text-center text-[#007AFF]">{partidoAdmin.j2_nombre.split(' ')[0]}</span>
                </div>
                
                <div className="flex gap-2 items-center justify-between">
                  <select value={s1Mi} onChange={(e)=>setS1Mi(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black bg-black/5 appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                  <span className="font-bold text-[10px] text-black/40">1</span>
                  <select value={s1Rival} onChange={(e)=>setS1Rival(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black bg-black/5 appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                </div>
                <div className="flex gap-2 items-center justify-between">
                  <select value={s2Mi} onChange={(e)=>setS2Mi(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black bg-black/5 appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                  <span className="font-bold text-[10px] text-black/40">2</span>
                  <select value={s2Rival} onChange={(e)=>setS2Rival(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black bg-black/5 appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                </div>
                <div className="flex gap-2 items-center justify-between">
                  <select value={s3Mi} onChange={(e)=>setS3Mi(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black bg-black/5 appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                  <span className="font-bold text-[10px] text-black/40">3</span>
                  <select value={s3Rival} onChange={(e)=>setS3Rival(e.target.value)} className="w-14 p-2 rounded-lg text-center font-black bg-black/5 appearance-none cursor-pointer"><option value="">-</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select>
                </div>
                
                <button onClick={() => handleAdminOverride(partidoAdmin, 'score')} className="w-full bg-[#064E3B] text-white py-3 rounded-xl font-black uppercase text-xs shadow-md mt-4 active:scale-95 transition-all">Sobrescribir Resultado</button>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleAdminOverride(partidoAdmin, 'wo_j1')} className="flex-1 border border-[#991B1B] text-[#991B1B] py-3 rounded-xl font-black uppercase text-[10px] hover:bg-[#991B1B]/10 active:scale-95 transition-all">W.O. {partidoAdmin.j1_nombre.split(' ')[0]}</button>
                  <button onClick={() => handleAdminOverride(partidoAdmin, 'wo_j2')} className="flex-1 border border-[#991B1B] text-[#991B1B] py-3 rounded-xl font-black uppercase text-[10px] hover:bg-[#991B1B]/10 active:scale-95 transition-all">W.O. {partidoAdmin.j2_nombre.split(' ')[0]}</button>
                </div>
                <button onClick={() => { setPartidoAdmin(null); setBloqueoActivo(null); }} className="w-full text-black/40 font-bold text-[10px] uppercase mt-4 active:scale-95">Cancelar</button>
              </div>
            ) : (
              <>
                <div className="flex bg-black/5 p-1 rounded-2xl mb-6">
                  <button onClick={() => setModalAccion('bloqueo')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${modalAccion === 'bloqueo' ? 'bg-[#991B1B] text-white shadow-md' : 'text-black/40'}`}>Bloquear</button>
                  <button onClick={() => setModalAccion('partido')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${modalAccion === 'partido' ? 'bg-[#064E3B] text-white shadow-md' : 'text-black/40'}`}>Partido</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-left">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-2">Inicio</label>
                    <input type="time" step="1800" value={modalHoraInicio} onChange={(e)=>setModalHoraInicio(e.target.value)} className="w-full mt-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20" />
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-2">Fin</label>
                    <input type="time" step="1800" value={modalHoraFin} onChange={(e)=>setModalHoraFin(e.target.value)} className="w-full mt-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20" />
                  </div>
                </div>

                {modalAccion === 'bloqueo' ? (
                  <div className="space-y-4 mb-8 text-left">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-2">Motivo del Bloqueo</label>
                    <select value={bloqueoMotivo} onChange={e => setBloqueoMotivo(e.target.value)} className="w-full bg-white border border-black/10 rounded-xl p-4 text-lg font-bold text-black appearance-none shadow-sm">
                      <option value="Administrativo">Administrativo</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Clase">Clase</option>
                      <option value="Torneo">Torneo</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8 text-left">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase opacity-40 ml-2">Jugador 1</label>
                      <input type="text" placeholder="Buscar nombre..." value={busquedaJ1} onChange={(e)=>{ const val = e.target.value; setBusquedaJ1(val); if (val === '') setPartidoJ1('');}} className="w-full mt-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-bold text-black" />
                      {busquedaJ1 && !partidoJ1 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-black/10 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                          {listaUsuarios.filter(u => u.nombre?.toLowerCase().includes(busquedaJ1.toLowerCase())).map(u => (
                            <div key={u.id} onClick={()=>{setPartidoJ1(u.id); setBusquedaJ1(u.nombre);}} className="p-4 text-sm font-bold border-b border-black/5 cursor-pointer hover:bg-[#064E3B]/5">{u.nombre}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase opacity-40 ml-2">Jugador 2</label>
                      <input type="text" placeholder="Buscar nombre..." value={busquedaJ2} onChange={(e)=>{ const val = e.target.value; setBusquedaJ2(val); if (val === '') setPartidoJ2('');}} className="w-full mt-1 bg-white border border-black/10 rounded-xl p-3 text-lg font-bold text-black" />
                      {busquedaJ2 && !partidoJ2 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-black/10 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                          {listaUsuarios.filter(u => u.nombre?.toLowerCase().includes(busquedaJ2.toLowerCase())).map(u => (
                            <div key={u.id} onClick={()=>{setPartidoJ2(u.id); setBusquedaJ2(u.nombre);}} className="p-4 text-sm font-bold border-b border-black/5 cursor-pointer hover:bg-[#064E3B]/5">{u.nombre}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {modalAccion === 'bloqueo' && (
                  <div className="space-y-4 mb-6 p-4 bg-white border border-black/10 rounded-2xl text-left">
                    <div>
                      <label className="text-[10px] font-black uppercase opacity-40">Frecuencia</label>
                      <select value={frecuencia} onChange={(e) => { setFrecuencia(e.target.value); setIteraciones(1); setDiasRecurrencia([]); }} className="w-full mt-1 bg-transparent text-sm font-bold outline-none">
                        <option value="unica">Evento Único</option>
                        <option value="diaria">Repetición Diaria</option>
                        <option value="semanal">Repetición Semanal</option>
                      </select>
                    </div>
                    {frecuencia === 'diaria' && (
                      <div className="pt-2 border-t border-black/5 animate-in fade-in">
                        <label className="text-[10px] font-black uppercase opacity-40">¿Cuántos días seguidos?</label>
                        <input type="number" min="1" max="30" value={iteraciones} onChange={(e) => setIteraciones(parseInt(e.target.value))} className="w-full mt-1 bg-black/5 rounded-lg p-2 font-bold" />
                      </div>
                    )}
                    {frecuencia === 'semanal' && (
                      <div className="pt-2 border-t border-black/5 space-y-3 animate-in fade-in">
                        <label className="text-[10px] font-black uppercase opacity-40">Días de la semana</label>
                        <div className="flex flex-wrap gap-2">
                          {['D','L','M','M','J','V','S'].map((d, i) => (
                            <button key={i} onClick={() => setDiasRecurrencia(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${diasRecurrencia.includes(i) ? 'bg-[#064E3B] text-white' : 'bg-black/5 text-black/40'}`}>{d}</button>
                          ))}
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase opacity-40">¿Cuántas semanas? (Máx 52)</label>
                          <input type="number" min="1" max="52" value={iteraciones} onChange={(e) => { let val = parseInt(e.target.value); if (val > 52) val = 52; setIteraciones(isNaN(val) ? '' : val); }} onBlur={() => { if (iteraciones === '' || iteraciones < 1) setIteraciones(1); }} className="w-full mt-1 bg-black/5 rounded-xl p-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button onClick={confirmarAccionModal} className={`w-full h-[56px] rounded-2xl font-bold text-[24px] text-[#F9F8F1] shadow-lg active:scale-[0.97] transition-all duration-100 ${modalAccion === 'bloqueo' ? 'bg-[#991B1B] shadow-[#991B1B]/20' : 'bg-[#064E3B] shadow-[#064E3B]/20'}`}>
                    {modalAccion === 'bloqueo' ? 'Bloquear Cancha' : 'Agendar VAd.'}
                  </button>
                  <button onClick={() => { setBloqueoActivo(null); setPartidoAdmin(null); }} className="w-full h-[56px] font-bold text-[18px] text-black/40 uppercase tracking-widest active:scale-[0.97] transition-all duration-100">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR */}
      {(!isLoggedIn || currentUser?.rol !== 'club') && (
        <nav className={`fixed bottom-0 left-0 w-full z-50 backdrop-blur-lg border-t px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-colors duration-500 ${theme.nav} ${theme.border}`}>
          <div className="flex justify-between items-center max-w-sm mx-auto px-4">
            {[ { id: 'home', icon: '🏠', label: 'Inicio' }, { id: 'jugar', icon: '🎾', label: 'Jugar' }, { id: 'partidos', icon: '📋', label: 'Partidos' }, { id: 'perfil', icon: '👤', label: 'Perfil' } ].map((item) => (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-150 active:scale-90 ${tab === item.id ? 'bg-[#29C454] text-white scale-110 shadow-lg shadow-[#29C454]/20' : (modoOscuro ? 'text-white/40 hover:text-white/70' : 'text-[#1A1C1E]/40 hover:text-[#1A1C1E]/70')}`}>
                <div className="relative flex flex-col items-center gap-1">
                  <span className="text-xl mb-0.5">{item.icon}</span>
                  {item.id === 'partidos' && misPartidos.length > 0 && misPartidos.some(p => p.estado === 'confirmado' || (p.estado === 'en_revision' && p.reportado_por !== currentUser?.id)) && ( <span className="absolute -top-1 -right-2 w-3 h-3 bg-[#007AFF] rounded-full animate-pulse border-2 border-[#F8F7F2] shadow-md"></span> )}
                </div>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}