import { HomeView } from "../components/PageViews";
import { pageMetadata } from "../content";

export const metadata = pageMetadata("en", "home", "Colombian food and Tolimense tamales", "Colombian restaurant in San Jose and wholesale Tolimense tamales for Fontana and Los Angeles.");
export default function Page() { return <HomeView locale="en" />; }
