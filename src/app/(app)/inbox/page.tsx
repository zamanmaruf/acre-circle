import type { Metadata } from "next";
import { InboxView } from "./inbox-view";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Plot requests from growers for fictional Nova Scotia listings, with engine fit checks and accept or decline actions.",
};

export default function InboxPage() {
  return <InboxView />;
}
