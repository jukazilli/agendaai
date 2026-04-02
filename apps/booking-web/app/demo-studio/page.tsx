import { redirect } from "next/navigation";

import { BOOKING_WEB_DEMO_SLUG } from "../../lib/demo-slug";

export default function LegacyDemoStudioPage() {
  redirect(`/${BOOKING_WEB_DEMO_SLUG}`);
}
