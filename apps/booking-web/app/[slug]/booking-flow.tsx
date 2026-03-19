"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import type { Booking, Client, Professional, Service } from "@agendaai/contracts";

import type {
  PublicAvailabilitySlot,
  PublicBookingResponse,
  PublicCatalogSnapshot,
  PublicPaymentIntentResponse,
  PublicPaymentIntentStateResponse
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

type BookingStep = 1 | 2 | 3 | 4;

interface StoredCheckoutContext {
  readonly tenant: PublicCatalogSnapshot["tenant"];
  readonly client: Client;
  readonly service: Service;
  readonly professional: Professional;
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
  const searchParams = useSearchParams();
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
  const [paymentStatus, setPaymentStatus] = useState<PublicPaymentIntentStateResponse | null>(null);
  const [paymentContext, setPaymentContext] = useState<StoredCheckoutContext | null>(null);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);

  const selectedService = initialCatalog.services.find((service) => service.id === selectedServiceId);
  const professionals = getSupportedProfessionals(
    initialCatalog.professionals,
    selectedServiceId
  );
  const selectedProfessional = professionals.find(
    (professional) => professional.id === selectedProfessionalId
  );
  const selectedSlot = slots.find((slot) => slot.startAt === selectedSlotStartAt);
  const requiresPayment = requiresOnlinePayment(selectedService);
  const progressSteps = [
    {
      step: 1 as BookingStep,
      id: "01",
      label: "Servico",
      complete: Boolean(selectedService),
      available: true
    },
    {
      step: 2 as BookingStep,
      id: "02",
      label: "Profissional",
      complete: Boolean(selectedProfessional),
      available: Boolean(selectedService)
    },
    {
      step: 3 as BookingStep,
      id: "03",
      label: "Horario",
      complete: Boolean(selectedSlot),
      available: Boolean(selectedService && selectedProfessional)
    },
    {
      step: 4 as BookingStep,
      id: "04",
      label: "Dados",
      complete: Boolean(form.nome && form.telefone && form.email),
      available: Boolean(selectedService && selectedProfessional && selectedSlot)
    }
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

  useEffect(() => {
    const paymentIntentIdFromUrl = searchParams.get("paymentIntentId");
    if (!paymentIntentIdFromUrl) {
      return;
    }
    const paymentIntentId = paymentIntentIdFromUrl;

    const paymentId =
      searchParams.get("payment_id") ?? searchParams.get("collection_id") ?? undefined;
    const storedContext = readStoredCheckoutContext(paymentIntentId);
    if (storedContext) {
      setPaymentContext(storedContext);
    }

    let ignore = false;

    async function syncReturnedPayment() {
      setIsSyncingPayment(true);
      setSubmitError(null);

      try {
        const response = await fetch(
          `/api/public/tenants/${slug}/payment-intents/${paymentIntentId}/sync`,
          {
            method: "POST",
            headers: paymentId ? { "content-type": "application/json" } : undefined,
            body: paymentId ? JSON.stringify({ paymentId }) : undefined
          }
        );

        const payload = (await response.json()) as
          | PublicPaymentIntentStateResponse
          | { message?: string }
          | undefined;

        if (!response.ok) {
          const maybeError = payload as { message?: string } | undefined;
          throw new Error(maybeError?.message ?? "Nao foi possivel atualizar o pagamento.");
        }

        const result = payload as PublicPaymentIntentStateResponse;
        if (ignore) {
          return;
        }

        setPaymentStatus(result);

        if (storedContext && isApprovedPaymentStatus(result.item.status)) {
          setReceipt({
            ...storedContext,
            booking: result.booking
          });
          clearStoredCheckoutContext(paymentIntentId);
        }
      } catch (error) {
        if (!ignore) {
          setSubmitError(
            error instanceof Error ? error.message : "Falha ao atualizar o pagamento."
          );
        }
      } finally {
        if (!ignore) {
          setIsSyncingPayment(false);
        }
      }
    }

    void syncReturnedPayment();

    return () => {
      ignore = true;
    };
  }, [searchParams, slug]);

  async function syncPaymentStatus(paymentIntentId: string, paymentId?: string) {
    setIsSyncingPayment(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/public/tenants/${slug}/payment-intents/${paymentIntentId}/sync`, {
        method: "POST",
        headers: paymentId ? { "content-type": "application/json" } : undefined,
        body: paymentId ? JSON.stringify({ paymentId }) : undefined
      });

      const payload = (await response.json()) as
        | PublicPaymentIntentStateResponse
        | { message?: string }
        | undefined;

      if (!response.ok) {
        const maybeError = payload as { message?: string } | undefined;
        throw new Error(maybeError?.message ?? "Nao foi possivel sincronizar o pagamento.");
      }

      const result = payload as PublicPaymentIntentStateResponse;
      setPaymentStatus(result);

      if (paymentContext && isApprovedPaymentStatus(result.item.status)) {
        setReceipt({
          ...paymentContext,
          booking: result.booking
        });
        clearStoredCheckoutContext(paymentIntentId);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Falha ao sincronizar o pagamento.");
    } finally {
      setIsSyncingPayment(false);
    }
  }

  function handleGoToStep(step: BookingStep) {
    const targetStep = progressSteps.find((item) => item.step === step);
    if (!targetStep?.available) {
      return;
    }

    setSubmitError(null);
    setCurrentStep(step);
  }

  function handleNextStep() {
    const nextStep = Math.min(currentStep + 1, 4) as BookingStep;
    if (currentStep === 4) {
      return;
    }

    if (!isStepComplete(currentStep, selectedService, selectedProfessional, selectedSlot, form)) {
      setSubmitError(getStepValidationMessage(currentStep));
      return;
    }

    setSubmitError(null);
    setCurrentStep(nextStep);
  }

  function handlePreviousStep() {
    if (currentStep === 1) {
      return;
    }

    setSubmitError(null);
    setCurrentStep((currentStep - 1) as BookingStep);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedService || !selectedProfessional || !selectedSlot) {
      setSubmitError("Selecione servico, profissional e horario antes de confirmar.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (requiresOnlinePayment(selectedService)) {
        const response = await fetch(`/api/public/tenants/${slug}/payment-intents`, {
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
          | PublicPaymentIntentResponse
          | { message?: string }
          | undefined;

        if (!response.ok) {
          const maybeError = payload as { message?: string } | undefined;
          throw new Error(
            typeof maybeError?.message === "string"
              ? maybeError.message
              : "Nao foi possivel iniciar o checkout."
          );
        }

        const paymentPayload = payload as PublicPaymentIntentResponse;
        const checkoutContext: StoredCheckoutContext = {
          tenant: paymentPayload.tenant,
          client: paymentPayload.client,
          service: paymentPayload.service,
          professional: paymentPayload.professional
        };

        persistCheckoutContext(paymentPayload.paymentIntent.id, checkoutContext);
        setPaymentContext(checkoutContext);
        setPaymentStatus({
          item: paymentPayload.paymentIntent,
          booking: paymentPayload.booking
        });

        if (!paymentPayload.paymentIntent.initPoint) {
          throw new Error("Checkout nao retornou uma URL de redirecionamento.");
        }

        window.location.assign(paymentPayload.paymentIntent.initPoint);
        return;
      }

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
                {formatDateLabel(receipt.booking.startAt)} - {sliceTime(receipt.booking.startAt)}
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
              clearPaymentQueryParams();
              setReceipt(null);
              setPaymentStatus(null);
              setPaymentContext(null);
              setSelectedSlotStartAt("");
              setSubmitError(null);
              setCurrentStep(1);
            }}
          >
            Agendar outro horario
          </button>
        </section>
      </main>
    );
  }

  if (paymentStatus) {
    const currentContext =
      paymentContext ??
      readStoredCheckoutContext(paymentStatus.item.id) ??
      buildFallbackCheckoutContext(paymentStatus.booking, initialCatalog);

    return (
      <main className="booking-page">
        <section className="confirmation-shell">
          <p className="eyebrow">
            {isApprovedPaymentStatus(paymentStatus.item.status) ?
              "pagamento aprovado"
            : isFailedPaymentStatus(paymentStatus.item.status) ?
              "pagamento nao concluido"
            : "aguardando confirmacao"}
          </p>
          <h1>{currentContext?.tenant.nome ?? initialCatalog.tenant.nome}</h1>
          <p className="description">
            {describePaymentStatus(paymentStatus.item.status, currentContext?.service.nome)}
          </p>

          <div className="confirmation-grid">
            <article className="summary-card">
              <span>servico</span>
              <strong>{currentContext?.service.nome ?? "Servico"}</strong>
            </article>
            <article className="summary-card">
              <span>horario</span>
              <strong>
                {formatDateLabel(paymentStatus.booking.startAt)} - {sliceTime(paymentStatus.booking.startAt)}
              </strong>
            </article>
            <article className="summary-card">
              <span>profissional</span>
              <strong>{currentContext?.professional.nome ?? "Profissional"}</strong>
            </article>
          </div>

          {submitError ? <p className="error-banner">{submitError}</p> : null}

          <div className="confirmation-actions">
            {!isApprovedPaymentStatus(paymentStatus.item.status) ? (
              <button
                className="primary-button"
                disabled={isSyncingPayment}
                type="button"
                onClick={() =>
                  void syncPaymentStatus(paymentStatus.item.id, paymentStatus.item.paymentId)
                }
              >
                {isSyncingPayment ? "Atualizando..." : "Atualizar status"}
              </button>
            ) : null}
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                clearPaymentQueryParams();
                setPaymentStatus(null);
                setSubmitError(null);
                setCurrentStep(4);
              }}
            >
              {isFailedPaymentStatus(paymentStatus.item.status) ? "Tentar novamente" : "Voltar para agenda"}
            </button>
          </div>
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
          <button
            aria-current={currentStep === step.step ? "step" : undefined}
            aria-label={`Etapa ${step.id}: ${step.label}`}
            className={
              currentStep === step.step ?
                "progress-pill is-active"
              : step.complete ?
                "progress-pill is-done"
              : "progress-pill"
            }
            disabled={!step.available}
            key={step.id}
            onClick={() => handleGoToStep(step.step)}
            type="button"
          >
            <strong>{step.id}</strong>
            <span>{step.label}</span>
          </button>
        ))}
      </section>

      <form className="booking-shell" onSubmit={handleSubmit}>
        {currentStep === 1 ? (
          <section className="section-card step-card">
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
        ) : null}

        {currentStep === 2 ? (
          <section className="section-card step-card">
            <div className="section-heading">
              <span>02</span>
              <div>
                <h2>Escolha quem atende</h2>
                <p>Mostramos apenas profissionais compativeis com o servico selecionado.</p>
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
        ) : null}

        {currentStep === 3 ? (
          <section className="section-card step-card">
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
        ) : null}

        {currentStep === 4 ? (
          <section className="section-card step-card">
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

            <aside className="inline-summary">
              <div>
                <p className="eyebrow">resumo</p>
                <h3>{selectedService?.nome ?? "Escolha um servico"}</h3>
                <p>{buildSummaryScheduleLabel(selectedProfessional?.nome, selectedSlot)}</p>
                <p className="summary-meta">
                  {selectedService
                    ? `${selectedService.duracaoMin} min - ${formatCurrency(selectedService.precoBase)}`
                    : "Selecione um servico para ver o resumo."}
                </p>
              </div>

              {requiresPayment ? (
                <p className="summary-note">
                  Este servico exige pagamento online antes da confirmacao final da reserva.
                </p>
              ) : (
                <p className="summary-note">
                  Servicos sem sinal obrigatorio sao confirmados imediatamente no fluxo online.
                </p>
              )}
            </aside>
          </section>
        ) : null}

        {submitError ? <p className="error-banner">{submitError}</p> : null}

        <div className="step-actions">
          {currentStep > 1 ? (
            <button className="secondary-button" onClick={handlePreviousStep} type="button">
              Voltar
            </button>
          ) : (
            <div aria-hidden="true" className="step-actions-spacer" />
          )}

          {currentStep < 4 ? (
            <button className="primary-button" onClick={handleNextStep} type="button">
              Avancar
            </button>
          ) : (
            <button
              className="primary-button"
              disabled={
                isSubmitting ||
                !selectedService ||
                !selectedProfessional ||
                !selectedSlot ||
                isSyncingPayment
              }
              type="submit"
            >
              {isSubmitting
                ? requiresPayment
                  ? "Abrindo checkout..."
                  : "Confirmando..."
                : requiresPayment
                  ? getCheckoutCallToAction(selectedService)
                  : "Confirmar horario"}
            </button>
          )}
        </div>
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

function isStepComplete(
  step: BookingStep,
  service?: Service,
  professional?: Professional,
  slot?: PublicAvailabilitySlot,
  form?: BookingFormState
): boolean {
  if (step === 1) {
    return Boolean(service);
  }

  if (step === 2) {
    return Boolean(service && professional);
  }

  if (step === 3) {
    return Boolean(service && professional && slot);
  }

  return Boolean(
    service &&
      professional &&
      slot &&
      form?.nome.trim() &&
      form.telefone.trim() &&
      form.email.trim()
  );
}

function getStepValidationMessage(step: BookingStep): string {
  if (step === 1) {
    return "Escolha um servico para continuar.";
  }

  if (step === 2) {
    return "Escolha um profissional para continuar.";
  }

  if (step === 3) {
    return "Escolha uma data e um horario para continuar.";
  }

  return "Preencha nome, telefone e e-mail para continuar.";
}

function buildSummaryScheduleLabel(
  professionalName: string | undefined,
  slot: PublicAvailabilitySlot | undefined
): string {
  if (!slot) {
    return `${professionalName ?? "Profissional"} - Horario pendente`;
  }

  return `${professionalName ?? "Profissional"} - ${formatDateLabel(slot.startAt)} ${slot.startTime}`;
}

function requiresOnlinePayment(service?: Service): boolean {
  return Boolean(
    service &&
      (service.paymentPolicy.collectionMode !== "none" || service.exigeSinal)
  );
}

function getCheckoutCallToAction(service?: Service): string {
  if (!service) {
    return "Pagar e confirmar";
  }

  return service.paymentPolicy.collectionMode === "full" ? "Pagar e confirmar" : "Pagar sinal";
}

function isApprovedPaymentStatus(status: string): boolean {
  return status === "approved" || status === "authorized";
}

function isFailedPaymentStatus(status: string): boolean {
  return ["rejected", "cancelled", "expired", "refunded", "charged_back"].includes(status);
}

function describePaymentStatus(status: string, serviceName?: string): string {
  if (isApprovedPaymentStatus(status)) {
    return `O pagamento de ${serviceName ?? "sua reserva"} foi aprovado e o horario esta confirmado.`;
  }

  if (isFailedPaymentStatus(status)) {
    return `O pagamento de ${serviceName ?? "sua reserva"} nao foi concluido. Voce pode tentar novamente.`;
  }

  return `Estamos aguardando a confirmacao do pagamento de ${serviceName ?? "sua reserva"}.`;
}

function persistCheckoutContext(paymentIntentId: string, context: StoredCheckoutContext): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    `agendaai-payment:${paymentIntentId}`,
    JSON.stringify(context)
  );
}

function readStoredCheckoutContext(paymentIntentId: string): StoredCheckoutContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(`agendaai-payment:${paymentIntentId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredCheckoutContext;
  } catch {
    return null;
  }
}

function clearStoredCheckoutContext(paymentIntentId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(`agendaai-payment:${paymentIntentId}`);
}

function clearPaymentQueryParams(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.history.replaceState({}, "", window.location.pathname);
}

function buildFallbackCheckoutContext(
  booking: Booking,
  catalog: PublicCatalogSnapshot
): StoredCheckoutContext | null {
  const service = catalog.services.find((item) => item.id === booking.serviceId);
  const professional = catalog.professionals.find((item) => item.id === booking.professionalId);

  if (!service || !professional) {
    return null;
  }

  return {
    tenant: catalog.tenant,
    client: {
      version: "v1",
      id: booking.clientId,
      tenantId: booking.tenantId,
      nome: "Cliente",
      telefone: "",
      email: "",
      origem: "booking_publico"
    },
    service,
    professional
  };
}
