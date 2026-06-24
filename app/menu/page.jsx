import { DynamicMenu } from "../components/DynamicMenu";
import { SITE } from "../site.config";

export const metadata = {
  title: `Menú · ${SITE.name}`,
  description:
    "El menú completo de El Perri Latin Food en San José: entradas, arepas rellenas, patacones, salchipapas, hamburguesas, conos de la casa y adiciones.",
};

export default function MenuPage() {
  return (
    <main>
      <header className="page-head">
        <p className="kicker">El menú</p>
        <h1 className="h1">Comida hecha con ❤️</h1>
        <p className="lead">{SITE.tagline}</p>
      </header>

      <section className="section" style={{ paddingTop: 24 }}>
        <DynamicMenu />
      </section>
    </main>
  );
}
