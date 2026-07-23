import { AboutView } from "../../components/PageViews";
import { pageMetadata } from "../../content";

export const metadata = pageMetadata("en", "about", "Our story", "Discover the Tolimense tradition behind El Gran Tamal Colombiano.");
export default function Page() { return <AboutView locale="en" />; }
