const cards = [
  {
    title: "Shell administrativo",
    description: "Base pronta para auth, operacao diaria, agenda e dashboards."
  },
  {
    title: "Estado atual",
    description: "B-01 concluido nesta superficie. Fluxos de negocio entram depois de B-02 a B-05."
  },
  {
    title: "Proximo corte",
    description: "Congelar tenancy, auth e slug antes de qualquer tela autenticada real."
  }
] as const;

export function App() {
  return (
    <main className="shell ag-theme-light">
      <section className="hero">
        <p className="eyebrow">AgendaAI / admin-web</p>
        <h1>Fundacao tecnica do shell operacional.</h1>
        <p className="description">
          Esta app existe para validar o monorepo, o build local e o corte da stack
          documentada. Ainda nao ha auth, dominio ou API real conectada.
        </p>
      </section>

      <section className="grid" aria-label="Estado da fundacao">
        {cards.map((card) => (
          <article className="card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
