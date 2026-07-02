import { CheckoutClient } from "../components";
import { SITE } from "../site.config";

export const metadata = {
  title: `Checkout · ${SITE.name}`,
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main>
      <header className="page-head" style={{ paddingBottom: 8 }}>
        <p className="kicker">Tu pedido</p>
        <h1 className="h1">Confirmar y pagar</h1>
      </header>
      <section className="section" style={{ paddingTop: 24 }}>
        <CheckoutClient />
      </section>
    </main>
  );
}
