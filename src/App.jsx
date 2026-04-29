import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"
import Login from "./auth/Login"

// EL TEMA Y LOS ICONOS DE REPLIT (MANTENEMOS TODO IGUAL)
const theme = { bg: "#0A0A0A", card: "#121212", gold: "#D4AF37", text: "#FFFFFF", border: "#1F1F1F", muted: "#8E8E93", blue: "#007AFF", success: "#4cd964", danger: "#FF3B30" };

const Icons = {
  Config: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Cash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  Copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
};

export default function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("agenda");
  const [loading, setLoading] = useState(true);
  
  // Persistencia Local (Lo que ya tenías en Replit)
  const [turnos, setTurnos] = useState(() => JSON.parse(localStorage.getItem('bc_turnos')) || []);
  const [movimientos, setMovimientos] = useState(() => JSON.parse(localStorage.getItem('bc_movs')) || []);
  const [barberos, setBarberos] = useState(() => JSON.parse(localStorage.getItem('bc_barberos')) || [{ id: 1, name: "Maxi", comision: 50 }]);
  const [servicios, setServicios] = useState(() => JSON.parse(localStorage.getItem('bc_servicios')) || [{ name: "Corte", price: 5000 }, { name: "Barba", price: 3000 }]);
  const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('bc_config')) || { name: "NABI STYLE", whatsapp: "5491100000000" });

  const [showConfig, setShowConfig] = useState(false);
  const [showAddTurno, setShowAddTurno] = useState(false);

  useEffect(() => {
    localStorage.setItem('bc_turnos', JSON.stringify(turnos));
    localStorage.setItem('bc_movs', JSON.stringify(movimientos));
    localStorage.setItem('bc_barberos', JSON.stringify(barberos));
    localStorage.setItem('bc_servicios', JSON.stringify(servicios));
    localStorage.setItem('bc_config', JSON.stringify(config));
  }, [turnos, movimientos, barberos, servicios, config]);

  // Lógica de Sesión con Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => { listener.subscription.unsubscribe() };
  }, []);

  if (loading) return <div style={loadingStyle}>CARGANDO SISTEMA...</div>
  if (!session) return <Login />

  // Handlers (Misma lógica de Replit)
  const handleAddTurno = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setTurnos([...turnos, { id: Date.now(), client: fd.get("client"), time: fd.get("time"), barberoId: parseInt(fd.get("barberoId")), service: fd.get("service"), status: "PENDIENTE" }]);
    setShowAddTurno(false);
  };

  const handleCobrar = (turno) => {
    const serviceObj = servicios.find(s => s.name === turno.service) || { price: 0 };
    setMovimientos([...movimientos, { id: Date.now(), barberoId: turno.barberoId, price: serviceObj.price, service: turno.service, time: new Date().toLocaleTimeString() }]);
    setTurnos(turnos.filter(t => t.id !== turno.id));
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", position: "relative", fontFamily: "'Inter', sans-serif" }}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ color: theme.gold, margin: 0, fontSize: "20px", fontWeight: "900" }}>{config.name}</h1>
          <small style={{ color: theme.muted }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</small>
        </div>
        <button onClick={() => setShowConfig(true)} style={avatarStyle}>{config.name[0]}</button>
      </header>

      <main style={{ padding: "20px", paddingBottom: "120px" }}>
        {tab === "agenda" && <AgendaSection turnos={turnos} handleCobrar={handleCobrar} />}
        {tab === "barberos" && <StaffSection movs={movimientos} barberos={barberos} />}
        {tab === "caja" && <CajaSection movs={movimientos} setMovs={setMovimientos} />}
      </main>

      <button onClick={() => setShowAddTurno(true)} style={fabStyle}><Icons.Plus /></button>

      <nav style={navStyle}>
        <TabButton icon={<Icons.Calendar />} label="Agenda" active={tab === "agenda"} onClick={() => setTab("agenda")} />
        <TabButton icon={<Icons.Users />} label="Staff" active={tab === "barberos"} onClick={() => setTab("barberos")} />
        <TabButton icon={<Icons.Cash />} label="Caja" active={tab === "caja"} onClick={() => setTab("caja")} />
      </nav>

      {/* MODALES Y CONFIGURACIÓN (REPLICANDO REPLIT) */}
      {showConfig && (
        <Modal title="CONFIGURACIÓN" onClose={() => setShowConfig(false)}>
            <button onClick={() => supabase.auth.signOut()} style={{...btnStyle, background: theme.danger, color: "#fff"}}>CERRAR SESIÓN</button>
            <p style={{textAlign: 'center', fontSize: '10px', marginTop: '10px', color: theme.muted}}>V1.1 - PRO PACK</p>
        </Modal>
      )}

      {showAddTurno && (
        <Modal title="NUEVO TURNO" onClose={() => setShowAddTurno(false)}>
          <form onSubmit={handleAddTurno} style={{display: "flex", flexDirection: "column", gap: "15px"}}>
            <input name="client" style={inputStyle} placeholder="Nombre del cliente" required />
            <input name="time" type="time" style={inputStyle} required />
            <select name="barberoId" style={inputStyle}>
              {barberos.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select name="service" style={inputStyle}>
              {servicios.map(s => <option key={s.name} value={s.name}>{s.name} - ${s.price}</option>)}
            </select>
            <button type="submit" style={btnStyle}>GUARDAR TURNO</button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// SUB-COMPONENTES (MANTENEMOS ESTILOS DE REPLIT)
function AgendaSection({ turnos, handleCobrar }) {
  return (
    <div>
      <h3 style={{fontSize: "12px", color: theme.muted, marginBottom: "15px"}}>PRÓXIMOS TURNOS</h3>
      {turnos.map(t => (
        <div key={t.id} style={cardStyle}>
          <div style={rowBetween}>
            <div>
              <span style={{color: theme.gold, fontWeight: "900"}}>{t.time}</span>
              <div style={{fontSize: "16px", fontWeight: "700"}}>{t.client}</div>
              <small style={{color: theme.muted}}>{t.service}</small>
            </div>
            <button onClick={() => handleCobrar(t)} style={cobrarBtn}>COBRAR</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffSection({ movs, barberos }) {
    return (
      <div style={cardStyle}>
        <h3 style={{color: theme.gold}}>RESUMEN STAFF</h3>
        {barberos.map(b => (
            <div key={b.id} style={rowBetween}>
                <span>{b.name}</span>
                <span>${movs.filter(m => m.barberoId === b.id).reduce((s, m) => s + m.price, 0)}</span>
            </div>
        ))}
      </div>
    );
}

function CajaSection({ movs, setMovs }) {
  const total = movs.reduce((s, m) => s + m.price, 0);
  return (
    <div style={{textAlign: "center"}}>
      <div style={{fontSize: "48px", fontWeight: "900", color: theme.gold}}>${total}</div>
      <p style={{color: theme.muted}}>TOTAL DEL DÍA</p>
      <button onClick={() => setMovs([])} style={{...btnStyle, background: "transparent", border: `1px solid ${theme.danger}`, color: theme.danger, marginTop: "20px"}}>RESETEAR CAJA</button>
    </div>
  );
}

// ESTILOS (IGUALES A REPLIT PARA QUE NO VARÍE EL DISEÑO)
const headerStyle = { padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: theme.bg, zIndex: 10 };
const avatarStyle = { width: "40px", height: "40px", borderRadius: "12px", background: theme.gold, color: "#000", border: "none", fontWeight: "900" };
const navStyle = { position: "fixed", bottom: 0, left: 0, right: 0, height: "85px", background: "#0D0D0D", display: "flex", borderTop: `1px solid ${theme.border}`, paddingBottom: "10px" };
const cardStyle = { background: theme.card, padding: "20px", borderRadius: "16px", marginBottom: "15px", border: `1px solid ${theme.border}` };
const fabStyle = { position: "fixed", bottom: "105px", right: "20px", width: "65px", height: "65px", borderRadius: "20px", background: theme.gold, color: "#000", border: "none", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: `0 8px 30px ${theme.gold}55` };
const btnStyle = { width: "100%", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "900", background: theme.gold, color: "#000" };
const inputStyle = { background: "#1A1A1A", border: `1px solid ${theme.border}`, padding: "14px", borderRadius: "10px", color: "#fff", width: "100%" };
const cobrarBtn = { background: theme.success, color: "#000", border: "none", borderRadius: "8px", padding: "8px 15px", fontWeight: "900" };
const rowBetween = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const loadingStyle = { background: "#000", color: theme.gold, height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "900" };

function TabButton({ icon, label, active, onClick }) { return (<button onClick={onClick} style={{ background: "none", border: "none", color: active ? theme.gold : theme.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>{icon} <span style={{ fontSize: "10px", fontWeight: active ? "900" : "500" }}>{label.toUpperCase()}</span></button>); }
function Modal({ title, children, onClose }) { return (<div style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 1000}}><div style={{background: theme.card, width: "100%", padding: "30px", borderTopLeftRadius: "30px", borderTopRightRadius: "30px"}}><div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}><h2 style={{fontSize: "14px", color: theme.gold}}>{title}</h2><button onClick={onClose} style={{background: "none", border: "none", color: "#fff", fontSize: "24px"}}>×</button></div>{children}</div></div>); }
// ... (continuación de App.jsx)

function StaffSection({ movs, barberos }) {
    return (
      <div style={cardStyle}>
        <h3 style={{color: theme.gold, fontSize: "14px"}}>RESUMEN STAFF</h3>
        {barberos.map(b => {
            const ganado = movs.filter(m => m.barberoId === b.id).reduce((s, m) => s + m.price, 0);
            return (
                <div key={b.id} style={{...rowBetween, marginTop: "10px", borderBottom: `1px solid ${theme.border}`, paddingBottom: "5px"}}>
                    <span>{b.name}</span>
                    <span style={{fontWeight: "900", color: theme.success}}>${ganado}</span>
                </div>
            );
        })}
      </div>
    );
}

function CajaSection({ movs, setMovs }) {
  const total = movs.reduce((s, m) => s + m.price, 0);
  return (
    <div style={{textAlign: "center", padding: "20px"}}>
      <div style={{fontSize: "48px", fontWeight: "900", color: theme.gold}}>${total}</div>
      <p style={{color: theme.muted, fontSize: "12px", letterSpacing: "1px"}}>TOTAL RECAUDADO HOY</p>
      <button onClick={() => { if(confirm("¿Cerrar caja?")) setMovs([]); }} style={{...btnStyle, background: "transparent", border: `1px solid ${theme.danger}`, color: theme.danger, marginTop: "40px"}}>CERRAR CAJA</button>
    </div>
  );
}