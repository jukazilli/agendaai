import { notFound } from "next/navigation";

import { BookingFlow } from "./booking-flow";
import { PublicApiError, getPublicCatalog } from "../../lib/public-api";

interface BookingSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function BookingSlugPage({ params }: BookingSlugPageProps) {
  const { slug } = await params;

  try {
    const catalog = await getPublicCatalog(slug);

    return (
      <BookingFlow
        slug={slug}
        initialCatalog={catalog}
        initialDate={formatToday()}
      />
    );
  } catch (error: unknown) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
