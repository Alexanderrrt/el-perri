import { MenuView } from "../../components/PageViews";
import { pageMetadata } from "../../content";

export const metadata = pageMetadata("en", "menu", "Menu", "Explore tamales, breakfast, Colombian favorites, drinks, and add-ons from El Gran Tamal Colombiano.");
export default function Page() { return <MenuView locale="en" />; }
