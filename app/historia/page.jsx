import { AboutView } from "../components/PageViews";
import { pageMetadata } from "../content";

export const metadata = pageMetadata("es", "about", "Nuestra historia", "Conoce la tradición tolimense detrás de El Gran Tamal Colombiano.");
export default function Page() { return <AboutView locale="es" />; }
