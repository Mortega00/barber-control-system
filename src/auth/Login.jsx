import { useState } from "react"
import { supabase } from "../lib/supabase"

/* ================= THEME & ICONS ================= */
const theme = { 
  bg: "#000000", 
  card: "#121212", 
  gold: "#D4AF37", 
  text: "#FFFFFF", 
  border: "#1F1F1F", 
  muted: "#8E8E93" 
}

const Icons = {
  Chevron: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}

/* ================= PANTALLA: LOGIN PRO (FUSIÓN) ================= */
export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    // Usamos Password para evitar el límite de emails de Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error Auth:", error.message)
      setErrorMsg(`❌ ${error.message}`)
    }
    setLoading(false)
  }

  return (
    <div style={containerStyle}>
      
      {/* HEADER NABI STYLE */}
      <header style={headerStyle}>
        <div>
          <h1 style={logoStyle}>BARBERCONTROL</h1>
          <p style={{ color: theme.muted, fontSize: "11px", marginTop: "4px", fontWeight: "700", letterSpacing: "1px" }}>
            MODO QA ACTIVADO
          </p>
        </div>
      </header>

      {/* CUERPO DEL LOGIN */}
      <main style={mainStyle}>
        <div style={cardStyle}>
          <div style={{ marginBottom: "25px" }}>
             <h3 style={titleStyle}>INGRESAR AL PANEL</h3>
             <p style={{ color: theme.muted, fontSize: "13px", marginTop: "5px" }}>Introduce tus credenciales de acceso.</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>EMAIL PROFESIONAL</label>
              <input 
                style={inputStyle} 
                type="email"
                placeholder="nombre@ejemplo.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={labelStyle}>CONTRASEÑA</label>
              <input 
                style={inputStyle} 
                type="password"
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
            
            {/* Mensajes de Error */}
            {errorMsg && (
                <p style={errorMessageStyle}>
                    {errorMsg}
                </p>
            )}

            <button type="submit" style={btnGold} disabled={loading}>
              {loading ? (
                <div style={spinnerContainer}>
                  <div style={spinnerStyle}></div>
                  VERIFICANDO...
                </div>
              ) : (
                <>ACCEDER AHORA <Icons.Chevron /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "30px", borderTop: `1px solid ${theme.border}`, paddingTop: "20px" }}>
              <p style={{ color: theme.muted, fontSize: "11px" }}>
                  ¿Problemas de acceso? Contactá con soporte técnico.
              </p>
          </div>
        </div>
      </main>

      <footer style={footerStyle}>
        BARBERCONTROL PRO v1.7 • 2026
      </footer>
    </div>
  )
}

/* ================= ESTILOS ACTUALIZADOS ================= */
const containerStyle = { background: theme.bg, color: theme.text, minHeight: "100vh", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }
const headerStyle = { padding: "40px 25px 20px 25px", textAlign: "center" }
const logoStyle = { color: theme.gold, margin: 0, fontSize: "28px", fontWeight: "900", letterSpacing: "-1px" }
const mainStyle = { padding: "20px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }
const cardStyle = { background: theme.card, width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "32px", border: `1px solid ${theme.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }
const titleStyle = { margin: 0, fontSize: "20px", fontWeight: "900", color: theme.text, letterSpacing: "0.5px" }
const inputStyle = { width: "100%", padding: "18px", background: "#080808", border: `1px solid ${theme.border}`, color: "white", borderRadius: "16px", boxSizing: "border-box", fontSize: "15px", outline: "none", transition: "0.3s" }
const labelStyle = { display: "block", fontSize: "11px", color: theme.gold, fontWeight: "800", marginBottom: "8px", letterSpacing: "1px" }
const btnGold = { width: "100%", padding: "18px", background: theme.gold, color: "black", fontWeight: "900", border: "none", borderRadius: "18px", cursor: "pointer", fontSize: "15px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }
const footerStyle = { textAlign: "center", color: "#222", fontSize: "11px", padding: "30px", fontWeight: "700" }
const errorMessageStyle = { fontSize: "13px", color: "#ff4444", textAlign: "center", marginBottom: "20px", background: "rgba(255,68,68,0.1)", padding: "10px", borderRadius: "10px" }
const spinnerContainer = { display: "flex", alignItems: "center", gap: "10px" }
const spinnerStyle = { width: "14px", height: "14px", border: "3px solid #000", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }