import { redirect } from "next/navigation";

// The Insights view was merged into the dashboard at `/`. Keep this route as a
// permanent redirect so existing links and bookmarks still resolve.
export default function InsightsRedirect() {
  redirect("/");
}
