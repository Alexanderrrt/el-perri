import { SITE, waLink } from "../../site.config";

export const metadata = {
  title: `Pedido recibido · ${SITE.name}`,
  robots: { index: false },
};

/**
 * OrderConfirmation — thank-you page after guest checkout.
 * Shows the order number and how the customer will be contacted;
 * offers WhatsApp/phone in case of questions.
 */
export default async function OrderConfirmation({ params }) {
  const { orderId } = await params;
  const wa = waLink(`Hola El Perri 👋 Tengo una pregunta sobre mi pedido #${orderId}.`);

  return (
    <main>
      <header className="page-head" style={{ paddingBottom: 40 }}>
        <div className="tricolor-bar" aria-hidden="true" />
        <p className="kicker">¡Gracias!</p>
        <h1 className="h1">Pedido<br />recibido. ✅</h1>
        <p className="lead">
          Tu número de pedido es <strong className="order-id">#{orderId}</strong>. Te contactamos
          para confirmar el tiempo de entrega. Si tienes dudas, escríbenos y te respondemos al
          instante.
        </p>
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
