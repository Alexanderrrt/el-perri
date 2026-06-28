"use client";

/**
 * Global error boundary — catches unhandled errors in the root layout/render.
 * Renders a minimal, branded fallback. When an error tracker (e.g. Sentry) is
 * wired up, report `error` here.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          background: "#100d09",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ color: "#ffd700", margin: 0 }}>Algo salió mal</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: 420 }}>
          Tuvimos un problema cargando la página. Intenta de nuevo.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "#ffd700",
            color: "#000",
            border: "none",
            borderRadius: 6,
            padding: "0.75rem 1.5rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
