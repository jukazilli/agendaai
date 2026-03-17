import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">AgendaAI / booking-web</p>
        <h1>Base do agendamento publico por slug.</h1>
        <p className="description">
          Esta app ainda nao implementa disponibilidade, pagamento ou fechamento de
          reserva. O objetivo do B-01 aqui e deixar a stack pronta para evoluir com
          seguranca.
        </p>
        <div className="actions">
          <Link href="/demo-studio">Abrir slug de exemplo</Link>
        </div>
      </section>
    </main>
  );
}

