import { MenuView } from "../components/PageViews";
import { pageMetadata } from "../content";

export const metadata = pageMetadata("es", "menu", "Menú", "Consulta el menú de El Gran Tamal Colombiano: tamales, desayunos, antojitos, bebidas y adicionales.");
export default function Page() { return <MenuView locale="es" />; }
