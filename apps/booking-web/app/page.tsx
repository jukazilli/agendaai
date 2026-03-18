import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-shell">
        <p className="eyebrow">AgendaAI / booking-web</p>
        <h1>Agendamento publico pronto para mobile.</h1>
        <p className="description">
          Use o link do seu negocio para abrir a jornada de booking. A demo padrao do
          staging fica disponivel no slug abaixo.
        </p>
        <div className="actions">
          <Link href="/demo-studio">Abrir demo-studio</Link>
        </div>
      </section>
    </main>
  );
}
