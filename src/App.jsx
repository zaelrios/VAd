import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="main-container">
      <header>
        <h1 className="logo-text">VAd</h1>
        <p className="tagline">Ventaja Adentro — Rosarito</p>
      </header>

      <section className="status-card">
        <div className="badge">🎾 En Desarrollo</div>
        <h2>Ranking ELO y Matchmaking</h2>
        <p>Estamos preparando el sistema de retos para la comunidad de tenis de CART.</p>
      </section>

      <footer>
        <p>© 2026 VAd Project</p>
      </footer>
    </div>
  )
}

export default App
