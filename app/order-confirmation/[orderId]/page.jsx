import { SITE, waLink } from "../../site.config";

export const metadata = {
  title: `Pedido recibido · ${SITE.name}`,
  robots: { index: false },
};

export default async function OrderConfirmation({ params, searchParams }) {
  const { orderId } = await params;
  const { tracking } = await searchParams;
  const wa = waLink(`Hola El Perri 👋 Tengo una pregunta sobre mi pedido #${orderId}.`);

  return (
    <main>
      <header className="page-head" style={{ paddingBottom: 40 }}>
        <div className="tricolor-bar" aria-hidden="true" />
        <p className="kicker">¡Gracias!</p>
        <h1 className="h1">Pedido<br />recibido. ✅</h1>
        <p className="lead">
          Tu número de pedido es <strong className="order-id">#{orderId}</strong>.
          {tracking
            ? " Un repartidor va en camino — sigue tu pedido en tiempo real."
            : " Te contactamos para confirmar el tiempo de entrega."
          }
          {" "}Si tienes dudas, escríbenos y te respondemos al instante.
        </p>

        {tracking && (
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <a
              href={tracking}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 18, padding: "14px 32px" }}
            >
              📍 Rastrear mi pedido
            </a>
          </div>
        )}

        <div className="section-actions" style={{ marginTop: 26 }}>
          {wa && (
            <a href={wa} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
              Escríbenos por WhatsApp
            </a>
          )}
          <a href={SITE.phoneHref} className="btn btn-dark">Llámanos</a>
          <a href="/menu" className="btn btn-gold">Volver al menú</a>
        </div>
      </header>
    </main>
  );
}
