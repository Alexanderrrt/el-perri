import { HomeView } from "./components/PageViews";
import { pageMetadata } from "./content";

export const metadata = pageMetadata("es", "home", "Comida colombiana y tamales tolimenses", "Restaurante colombiano en San José y tamales tolimenses al por mayor para Fontana y Los Ángeles.");
export default function Page() { return <HomeView locale="es" />; }
