import { TermsView } from "../components/PageViews";
import { pageMetadata } from "../content";

export const metadata = pageMetadata("es", "terms", "Términos de uso", "Términos de uso del sitio informativo de El Gran Tamal Colombiano.");
export default function Page() { return <TermsView locale="es" />; }
