"use client";

import { useEffect, useState, type FormEvent } from "react";

import type { Professional, Service } from "@agendaai/contracts";

import type {
  PublicAvailabilitySlot,
  PublicBookingResponse,
  PublicCatalogSnapshot
} from "../../lib/public-api";

interface BookingFlowProps {
  readonly slug: string;
  readonly initialCatalog: PublicCatalogSnapshot;
  readonly initialDate: string;
}

interface BookingFormState {
  readonly nome: string;
  readonly telefone: string;
  readonly email: string;
  readonly origem: string;
}

const defaultFormState: BookingFormState = {
  nome: "",
  telefone: "",
  email: "",
  origem: "instagram"
};

export function BookingFlow({
  slug,
  initialCatalog,
  initialDate
}: BookingFlowProps) {
  const [selectedServiceId, setSelectedServiceId] = useState(initialCatalog.services[0]?.id ?? "");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [selectedSlotStartAt, setSelectedSlotStartAt] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [form, setForm] = useState<BookingFormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PublicBookingResponse | null>(null);

  const selectedService = initialCatalog.services.find((service) => service.id === selectedServiceId);
  const professionals = getSupportedProfessionals(
    initialCatalog.professionals,
    selectedServiceId
  );
  const selectedProfessional = professionals.find(
    (professional) => professional.id === selectedProfessionalId
  );
  const selectedSlot = slots.find((slot) => slot.startAt === selectedSlotStartAt);
  const progressSteps = [
    { id: "01", label: "Servico", complete: Boolean(selectedService) },
    { id: "02", label: "Profissional", complete: Boolean(selectedProfessional) },
    { id: "03", label: "Horario", complete: Boolean(selectedSlot) },
    { id: "04", label: "Dados", complete: Boolean(form.nome && form.telefone && form.email) }
  ];

  useEffect(() => {
    if (professionals.length === 0) {
      setSelectedProfessionalId("");
      return;
    }

    if (!professionals.some((professional) => professional.id === selectedProfessionalId)) {
      setSelectedProfessionalId(professionals[0].id);
    }
  }, [professionals, selectedProfessionalId]);

  useEffect(() => {
    if (!selectedServiceId || !selectedProfessionalId || !selectedDate) {
      setSlots([]);
      setSelectedSlotStartAt("");
      return;
    }

    const search = new URLSearchParams({
      serviceId: selectedServiceId,
      professionalId: selectedProfessionalId,
      date: selectedDate
    });

    const abortController = new AbortController();

    async function loadSlots() {
      setLoadingSlots(true);
      setSlotError(null);

      try {
        const response = await fetch(
          `/api/public/tenants/${slug}/availability?${search.toString()}`,
          {
            cache: "no-store",
            signal: abortController.signal
          }
        );

        const payload = (await response.json()) as
          | { items?: PublicAvailabilitySlot[]; message?: string }
          | undefined;

        if (!response.ok) {
          throw new Error(payload?.message ?? "Nao foi possivel carregar os horarios.");
        }

        setSlots(payload?.items ?? []);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setSlots([]);
        setSlotError(error instanceof Error ? error.message : "Falha ao carregar horarios.");
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingSlots(false);
        }
      }
    }

    void loadSlots();

    return () => {
      abortController.abort();
    };
  }, [selectedDate, selectedProfessionalId, selectedServiceId, slug]);

  useEffect(() => {
    if (!slots.some((slot) => slot.startAt === selectedSlotStartAt)) {
      setSelectedSlotStartAt(slots[0]?.startAt ?? "");
    }
  }, [selectedSlotStartAt, slots]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedService || !selectedProfessional || !selectedSlot) {
      setSubmitError("Selecione servico, profissional e horario antes de confirmar.");
      return;
    }

    if (selectedService.exigeSinal) {
      setSubmitError("Este servico exige sinal. Ele ainda nao esta liberado para reserva online.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/public/tenants/${slug}/bookings`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          professionalId: selectedProfessional.id,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          client: form
        })
      });

      const payload = (await response.json()) as
        | PublicBookingResponse
        | { message?: string }
        | undefined;

      if (!response.ok) {
        const maybeError = payload as { message?: string } | undefined;
        throw new Error(
          typeof maybeError?.message === "string"
            ? maybeError.message
            : "Nao foi possivel confirmar seu horario."
        );
      }

      setReceipt(payload as PublicBookingResponse);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Falha ao confirmar reserva.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (receipt) {
    return (
      <main className="booking-page">
        <section className="confirmation-shell">
          <p className="eyebrow">reserva confirmada</p>
          <h1>{receipt.tenant.nome}</h1>
          <p className="description">
            {receipt.client.nome}, seu horario foi confirmado com {receipt.professional.nome}.
          </p>

          <div className="confirmation-grid">
            <article className="summary-card">
              <span>servico</span>
              <strong>{receipt.service.nome}</strong>
            </article>
            <article className="summary-card">
              <span>horario</span>
              <strong>
                {formatDateLabel(receipt.booking.startAt)} · {sliceTime(receipt.booking.startAt)}
              </strong>
            </article>
            <article className="summary-card">
              <span>profissional</span>
              <strong>{receipt.professional.nome}</strong>
            </article>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setReceipt(null);
              setSelectedSlotStartAt("");
              setSubmitError(null);
            }}
          >
            Agendar outro horario
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">agenda aberta</p>
          <h1>{initialCatalog.tenant.nome}</h1>
          <p className="description">
            Escolha servico, profissional e horario. Todo o fluxo foi pensado para
            finalizar rapido no celular.
          </p>
        </div>
        <div className="hero-meta">
          <span>{initialCatalog.tenant.timezone}</span>
          <span>slug /{slug}</span>
        </div>
      </section>

      <section className="progress-strip" aria-label="Progresso do agendamento">
        {progressSteps.map((step) => (
          <div
            className={step.complete ? "progress-pill is-done" : "progress-pill"}
            key={step.id}
          >
            <strong>{step.id}</strong>
            <span>{step.label}</span>
          </div>
        ))}
      </section>

      <form className="booking-shell" onSubmit={handleSubmit}>
        <section className="section-card">
          <div className="section-heading">
            <span>01</span>
            <div>
              <h2>Escolha o servico</h2>
              <p>Comece pelo tempo e pelo tipo de atendimento.</p>
            </div>
          </div>

          <div className="service-list">
            {initialCatalog.services.map((service) => (
              <button
                className={service.id === selectedServiceId ? "service-card is-active" : "service-card"}
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                type="button"
              >
                <strong>{service.nome}</strong>
                <span>{service.duracaoMin} min</span>
                <span>{formatCurrency(service.precoBase)}</span>
                {service.exigeSinal ? <small>Requer sinal</small> : <small>Reserva imediata</small>}
              </button>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <span>02</span>
            <div>
              <h2>Escolha quem atende</h2>
              <p>Mostramos apenas profissionais compatíveis com o servico selecionado.</p>
            </div>
          </div>

          <div className="professional-list">
            {professionals.map((professional) => (
              <button
                className={
                  professional.id === selectedProfessionalId
                    ? "professional-card is-active"
                    : "professional-card"
                }
                key={professional.id}
                onClick={() => setSelectedProfessionalId(professional.id)}
                type="button"
              >
                <strong>{professional.nome}</strong>
                <span>{professional.especialidades.length} especialidades ativas</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <span>03</span>
            <div>
              <h2>Escolha o horario</h2>
              <p>Atualizamos a disponibilidade em tempo real para o profissional selecionado.</p>
            </div>
          </div>

          <label className="field">
            <span>Data</span>
            <input
              min={initialDate}
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          {loadingSlots ? <p className="helper">Carregando horarios...</p> : null}
          {slotError ? <p className="error-banner">{slotError}</p> : null}
          {!loadingSlots && !slotError && slots.length === 0 ? (
            <p className="empty-state">
              Nenhum horario disponivel para esta combinacao. Tente outra data ou outro profissional.
            </p>
          ) : null}

          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                className={slot.startAt === selectedSlotStartAt ? "slot-button is-active" : "slot-button"}
                key={slot.startAt}
                onClick={() => setSelectedSlotStartAt(slot.startAt)}
                type="button"
              >
                {slot.startTime}
              </button>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <span>04</span>
            <div>
              <h2>Dados para confirmacao</h2>
              <p>Preencha o minimo necessario para fechar sua reserva.</p>
            </div>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Nome</span>
              <input
                required
                autoComplete="name"
                type="text"
                value={form.nome}
                onChange={(event) => setForm({ ...form, nome: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Telefone</span>
              <input
                required
                autoComplete="tel"
                inputMode="tel"
                type="tel"
                value={form.telefone}
                onChange={(event) => setForm({ ...form, telefone: event.target.value })}
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                required
                autoComplete="email"
                inputMode="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Como nos encontrou</span>
              <select
                value={form.origem}
                onChange={(event) => setForm({ ...form, origem: event.target.value })}
              >
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="indicacao">Indicacao</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </label>
          </div>
        </section>

        <aside className="sticky-summary">
          <div>
            <p className="eyebrow">resumo</p>
            <h3>{selectedService?.nome ?? "Escolha um servico"}</h3>
            <p>
              {selectedProfessional?.nome ?? "Profissional"} -{" "}
              {selectedSlot ? `${formatDateLabel(selectedSlot.startAt)} ${selectedSlot.startTime}` : "Horario pendente"}
            </p>
            <p className="summary-meta">
              {selectedService
                ? `${selectedService.duracaoMin} min - ${formatCurrency(selectedService.precoBase)}`
                : "Selecione um servico para ver o resumo."}
            </p>
          </div>

          {selectedService?.exigeSinal ? (
            <p className="summary-note">
              Este servico exige sinal. Nesta entrega, a reserva online fecha apenas servicos
              com confirmacao imediata.
            </p>
          ) : (
            <p className="summary-note">
              Servicos sem sinal obrigatorio sao confirmados imediatamente no fluxo online.
            </p>
          )}

          {submitError ? <p className="error-banner">{submitError}</p> : null}

          <button
            className="primary-button"
            disabled={
              isSubmitting ||
              !selectedService ||
              !selectedProfessional ||
              !selectedSlot ||
              selectedService.exigeSinal
            }
            type="submit"
          >
            {isSubmitting
              ? "Confirmando..."
              : selectedService?.exigeSinal
                ? "Sinal em breve"
                : "Confirmar horario"}
          </button>
        </aside>
      </form>
    </main>
  );
}

function getSupportedProfessionals(
  professionals: Professional[],
  serviceId: string
): Professional[] {
  if (!serviceId) {
    return professionals;
  }

  return professionals.filter((professional) => professional.especialidades.includes(serviceId));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    weekday: "short"
  }).format(date);
}

function sliceTime(value: string): string {
  const match = value.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : value;
}
