import { WholesaleView } from "../components/PageViews";
import { pageMetadata } from "../content";

export const metadata = pageMetadata("es", "wholesale", "Tamales al por mayor", "Tamales tolimenses al por mayor para restaurantes, tiendas, cafeterías, empresas y eventos en Fontana y Los Ángeles.");
export default function Page() { return <WholesaleView locale="es" />; }
