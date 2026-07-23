import { PrivacyView } from "../components/PageViews";
import { pageMetadata } from "../content";

export const metadata = pageMetadata("es", "privacy", "Política de privacidad", "Cómo funciona la privacidad en el sitio informativo de El Gran Tamal Colombiano.");
export default function Page() { return <PrivacyView locale="es" />; }
