interface BookingSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BookingSlugPage({ params }: BookingSlugPageProps) {
  const { slug } = await params;
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">slug detectado</p>
        <h1>/{slug}</h1>
        <p className="description">
          A rota dinamica ja esta pronta para receber o fluxo publico real quando os
          contratos de tenant, auth e disponibilidade forem congelados.
        </p>
      </section>
    </main>
  );
}
