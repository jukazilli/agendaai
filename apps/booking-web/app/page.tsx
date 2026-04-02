import Link from "next/link";

import { BOOKING_WEB_DEMO_SLUG } from "../lib/demo-slug";

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-shell">
        <p className="eyebrow">AgendaAI / booking-web</p>
        <h1>Agendamento publico pronto para mobile.</h1>
        <p className="description">
          Use o link do seu negocio para abrir a jornada de booking. A demo padrao do
          staging fica disponivel em <strong>/{BOOKING_WEB_DEMO_SLUG}</strong>.
        </p>
        <div className="actions">
          <Link href={`/${BOOKING_WEB_DEMO_SLUG}`}>Abrir demo de staging</Link>
        </div>
      </section>
    </main>
  );
}
