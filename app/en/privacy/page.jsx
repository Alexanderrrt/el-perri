import { PrivacyView } from "../../components/PageViews";
import { pageMetadata } from "../../content";

export const metadata = pageMetadata("en", "privacy", "Privacy policy", "Privacy information for the El Gran Tamal Colombiano informational website.");
export default function Page() { return <PrivacyView locale="en" />; }
