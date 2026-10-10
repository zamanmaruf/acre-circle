import type { Metadata } from "next";
import { RequestsView } from "./requests-view";

export const metadata: Metadata = {
  title: "My requests",
  description: "Track plot requests sent to fictional Nova Scotia landowners: sent, viewed, accepted or declined.",
};

export default function RequestsPage() {
  return <RequestsView />;
}
