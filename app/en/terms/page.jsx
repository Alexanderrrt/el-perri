import { TermsView } from "../../components/PageViews";
import { pageMetadata } from "../../content";

export const metadata = pageMetadata("en", "terms", "Terms of use", "Terms for using the El Gran Tamal Colombiano informational website.");
export default function Page() { return <TermsView locale="en" />; }
