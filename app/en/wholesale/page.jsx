import { WholesaleView } from "../../components/PageViews";
import { pageMetadata } from "../../content";

export const metadata = pageMetadata("en", "wholesale", "Wholesale tamales", "Wholesale Tolimense tamales for restaurants, stores, cafés, businesses, and events across Fontana and Los Angeles.");
export default function Page() { return <WholesaleView locale="en" />; }
