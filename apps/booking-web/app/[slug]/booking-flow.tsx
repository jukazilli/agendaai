"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import type { Booking, Client, Professional, Service } from "@agendaai/contracts";
import {
  DocumentHeader,
  DocumentImpactPanel,
  DocumentSummaryCards,
  DocumentTabs,
  DocumentTimeline,
  DocumentViewLayout,
  EntitySection,
  MasterDetailLayout,
  ViewBadge
} from "@agendaai/ui";
import type {
  DocumentImpactSection,
  DocumentSummaryMetric
} from "@agendaai/ui";

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
  const currentStepDefinition =
    progressSteps.find((item) => item.step === currentStep) ?? progressSteps[0];
  const bookingSummaryFields = [
    {
      id: "service",
      label: "Servico",
      value: selectedService?.nome ?? "Escolha um servico para comecar"
    },
    {
      id: "professional",
      label: "Profissional",
      value: selectedProfessional?.nome ?? "Selecione quem vai atender"
    },
    {
      id: "schedule",
      label: "Horario",
      value: selectedSlot
        ? `${formatDateLabel(selectedSlot.startAt)} - ${selectedSlot.startTime}`
        : "Defina data e horario para seguir"
    },
    {
      id: "payment",
      label: "Cobranca",
      value: selectedService
        ? requiresPayment
          ? "Pagamento online antes da confirmacao"
          : "Confirmacao imediata sem sinal"
        : "A regra aparece ao escolher o servico"
    }
  ];
  const bookingSummaryMetrics: DocumentSummaryMetric[] = [
    {
      id: "step",
      label: "Etapa atual",
      value: currentStepDefinition.label,
      helper: `Passo ${currentStepDefinition.id} da jornada guiada.`
    },
    {
      id: "duration",
      label: "Duracao",
      value: selectedService ? `${selectedService.duracaoMin} min` : "--",
      helper: "Tempo previsto para o atendimento."
    },
    {
      id: "price",
      label: "Valor",
      value: selectedService ? formatCurrency(selectedService.precoBase) : "--",
      helper: "Preco base do servico escolhido.",
      tone: selectedService ? "success" : undefined
    },
    {
      id: "client",
      label: "Cliente",
      value: form.nome || "Seus dados entram na etapa final",
      helper: form.email || "Nome, telefone e e-mail sao solicitados no fechamento."
    }
  ];
  const bookingImpactSections: DocumentImpactSection[] = [
    {
      id: "next-step",
      title: "O que falta para confirmar",
      tone: selectedSlot ? "success" : "warning",
      items: [
        isStepComplete(currentStep, selectedService, selectedProfessional, selectedSlot, form)
          ? "A etapa atual ja esta consistente. Voce pode seguir para o proximo passo."
          : getStepValidationMessage(currentStep),
        requiresPayment
          ? "Este servico exige checkout online antes da confirmacao final."
          : "Servicos sem sinal entram direto na agenda apos a confirmacao."
      ]
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

  function resetBookingExperience() {
    clearPaymentQueryParams();
    setReceipt(null);
    setPaymentStatus(null);
    setPaymentContext(null);
    setSelectedSlotStartAt("");
    setSubmitError(null);
    setCurrentStep(1);
  }

  function reopenBookingAfterPayment() {
    clearPaymentQueryParams();
    setPaymentStatus(null);
    setSubmitError(null);
    setCurrentStep(4);
  }

  if (receipt) {
    return (
      <main className="booking-page" style={buildTenantThemeStyle(receipt.tenant)}>
        <div className="booking-document-shell">
          <DocumentViewLayout
            eyebrow="reserva confirmada"
            title={receipt.tenant.nome}
            subtitle={`${receipt.client.nome}, seu horario foi confirmado com ${receipt.professional.nome}.`}
            documentNumber={shortDocumentId(receipt.booking.id)}
            statusBadge={<ViewBadge tone="success">Confirmada</ViewBadge>}
            pageActions={
              <button className="primary-button" onClick={resetBookingExperience} type="button">
                Agendar outro horario
              </button>
            }
            header={
              <DocumentHeader
                fields={[
                  {
                    id: "service",
                    label: "Servico",
                    value: receipt.service.nome
                  },
                  {
                    id: "schedule",
                    label: "Horario",
                    value: `${formatDateLabel(receipt.booking.startAt)} - ${sliceTime(receipt.booking.startAt)}`
                  },
                  {
                    id: "professional",
                    label: "Profissional",
                    value: receipt.professional.nome
                  },
                  {
                    id: "client",
                    label: "Cliente",
                    value: receipt.client.nome
                  }
                ]}
              />
            }
            summary={
              <DocumentSummaryCards
                metrics={[
                  {
                    id: "value",
                    label: "Valor",
                    value: formatCurrency(receipt.service.precoBase),
                    helper: "Preco base confirmado na reserva.",
                    tone: "success"
                  },
                  {
                    id: "duration",
                    label: "Duracao",
                    value: `${receipt.service.duracaoMin} min`,
                    helper: "Tempo previsto do atendimento."
                  },
                  {
                    id: "payment",
                    label: "Pagamento",
                    value: receipt.service.exigeSinal ? "Com sinal" : "Sem sinal",
                    helper: receipt.service.exigeSinal
                      ? "O servico foi fechado com pagamento previo."
                      : "Reserva entrou sem etapa de checkout."
                  }
                ]}
              />
            }
            tabs={
              <DocumentTabs
                tabs={[
                  { id: "reservation", label: "Reserva", active: true },
                  { id: "client", label: "Cliente" },
                  { id: "follow-up", label: "Proximos passos" }
                ]}
              />
            }
            items={
              <EntitySection
                title="Resumo operacional"
                description="A reserva ja entrou na agenda do tenant com os dados escolhidos no fluxo."
              >
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
              </EntitySection>
            }
            timeline={
              <DocumentTimeline
                title="Linha da reserva"
                entries={[
                  {
                    id: "created",
                    title: "Reserva confirmada",
                    description: `${receipt.client.nome} finalizou o agendamento publico.`
                  },
                  {
                    id: "scheduled",
                    title: "Horario reservado",
                    description: `${formatDateLabel(receipt.booking.startAt)} - ${sliceTime(receipt.booking.startAt)}`
                  },
                  {
                    id: "service",
                    title: "Servico vinculado",
                    description: `${receipt.service.nome} com ${receipt.professional.nome}.`
                  }
                ]}
              />
            }
            impactPanel={
              <DocumentImpactPanel
                sections={[
                  {
                    id: "confirmation-impact",
                    title: "O que ja aconteceu",
                    tone: "success",
                    items: [
                      "A reserva foi persistida na agenda.",
                      receipt.service.exigeSinal
                        ? "O fluxo passou pela etapa de checkout antes da confirmacao."
                        : "Nao houve bloqueio de pagamento nesta jornada."
                    ]
                  },
                  {
                    id: "follow-up-impact",
                    title: "Proximo passo esperado",
                    tone: "default",
                    items: [
                      "Comparecer no horario combinado.",
                      "O admin pode operar, concluir ou reagendar essa booking no backoffice."
                    ]
                  }
                ]}
              />
            }
          />
        </div>
      </main>
    );
  }

  if (paymentStatus) {
    const currentContext =
      paymentContext ??
      readStoredCheckoutContext(paymentStatus.item.id) ??
      buildFallbackCheckoutContext(paymentStatus.booking, initialCatalog);
    const paymentTone = isApprovedPaymentStatus(paymentStatus.item.status)
      ? "success"
      : isFailedPaymentStatus(paymentStatus.item.status)
        ? "danger"
        : "warning";
    const paymentLabel = isApprovedPaymentStatus(paymentStatus.item.status)
      ? "pagamento aprovado"
      : isFailedPaymentStatus(paymentStatus.item.status)
        ? "pagamento nao concluido"
        : "aguardando confirmacao";

    return (
      <main
        className="booking-page"
        style={buildTenantThemeStyle(currentContext?.tenant ?? initialCatalog.tenant)}
      >
        <div className="booking-document-shell">
          <DocumentViewLayout
            eyebrow={paymentLabel}
            title={currentContext?.tenant.nome ?? initialCatalog.tenant.nome}
            subtitle={describePaymentStatus(paymentStatus.item.status, currentContext?.service.nome)}
            documentNumber={shortDocumentId(paymentStatus.item.id)}
            statusBadge={<ViewBadge tone={paymentTone}>{formatPaymentStatusLabel(paymentStatus.item.status)}</ViewBadge>}
            pageActions={
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
                <button className="secondary-button" onClick={reopenBookingAfterPayment} type="button">
                  {isFailedPaymentStatus(paymentStatus.item.status) ? "Tentar novamente" : "Voltar para agenda"}
                </button>
              </div>
            }
            header={
              <DocumentHeader
                fields={[
                  {
                    id: "service",
                    label: "Servico",
                    value: currentContext?.service.nome ?? "Servico"
                  },
                  {
                    id: "schedule",
                    label: "Horario",
                    value: `${formatDateLabel(paymentStatus.booking.startAt)} - ${sliceTime(paymentStatus.booking.startAt)}`
                  },
                  {
                    id: "professional",
                    label: "Profissional",
                    value: currentContext?.professional.nome ?? "Profissional"
                  },
                  {
                    id: "payment",
                    label: "Status do pagamento",
                    value: formatPaymentStatusLabel(paymentStatus.item.status)
                  }
                ]}
              />
            }
            summary={
              <DocumentSummaryCards
                metrics={[
                  {
                    id: "payment-status",
                    label: "Pagamento",
                    value: formatPaymentStatusLabel(paymentStatus.item.status),
                    helper: paymentStatus.item.paymentId
                      ? `MP ${paymentStatus.item.paymentId}`
                      : "Sem identificador definitivo do gateway.",
                    tone: paymentTone
                  },
                  {
                    id: "service-value",
                    label: "Valor esperado",
                    value: currentContext?.service
                      ? formatCurrency(currentContext.service.precoBase)
                      : "--",
                    helper: "Valor base vinculado ao servico selecionado."
                  },
                  {
                    id: "checkout-kind",
                    label: "Fluxo",
                    value: "Checkout Pro",
                    helper: "Retorno consultado pelo payment intent real."
                  }
                ]}
              />
            }
            tabs={
              <DocumentTabs
                tabs={[
                  { id: "payment", label: "Pagamento", active: true },
                  { id: "booking", label: "Reserva" },
                  { id: "sync", label: "Sincronizacao" }
                ]}
              />
            }
            items={
              <EntitySection
                title="Resumo do retorno"
                description="Leitura documental do checkout vinculada a booking criada no runtime real."
              >
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
              </EntitySection>
            }
            timeline={
              <DocumentTimeline
                title="Linha do checkout"
                entries={[
                  {
                    id: "checkout-created",
                    title: "Payment intent criado",
                    description: `Documento ${shortDocumentId(paymentStatus.item.id)} preparado para o servico selecionado.`
                  },
                  {
                    id: "booking-pending",
                    title: "Booking vinculada",
                    description: `${formatDateLabel(paymentStatus.booking.startAt)} - ${sliceTime(paymentStatus.booking.startAt)}`
                  },
                  {
                    id: "payment-current",
                    title: "Status atual",
                    description: describePaymentStatus(paymentStatus.item.status, currentContext?.service.nome)
                  }
                ]}
              />
            }
            impactPanel={
              <DocumentImpactPanel
                sections={[
                  {
                    id: "payment-read",
                    title: "Leitura do gateway",
                    tone: paymentTone === "danger" ? "danger" : paymentTone === "success" ? "success" : "warning",
                    items: [
                      describePaymentStatus(paymentStatus.item.status, currentContext?.service.nome),
                      isApprovedPaymentStatus(paymentStatus.item.status)
                        ? "O booking pode ser tratada como confirmada no admin."
                        : "Use a acao de atualizar status para consultar novamente o retorno do gateway."
                    ]
                  }
                ]}
              />
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page" style={buildTenantThemeStyle(initialCatalog.tenant)}>
      <section className="hero-card">
        <div>
          <p className="eyebrow">agenda aberta</p>
          <h1>{initialCatalog.tenant.nome}</h1>
          <p className="description">
            {resolveTenantTagline(initialCatalog.tenant)}
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
        <MasterDetailLayout
          className="booking-master-detail-layout"
          detailClassName="booking-summary-panel"
          detailDescription="A leitura lateral acompanha a selecao atual sem mudar o fluxo real da API."
          detailTitle="Resumo da reserva"
          master={
            <>
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
            </>
          }
          masterClassName="booking-master-host"
          masterDescription="A coluna principal preserva a jornada guiada e os contratos publicos ja existentes."
          masterTitle={`Passo ${currentStepDefinition.id} - ${currentStepDefinition.label}`}
          detail={
            <div className="booking-summary-stack">
              <div className="booking-summary-status">
                <ViewBadge tone={isStepComplete(currentStep, selectedService, selectedProfessional, selectedSlot, form) ? "success" : "warning"}>
                  {isStepComplete(currentStep, selectedService, selectedProfessional, selectedSlot, form)
                    ? "Etapa pronta"
                    : "Etapa em aberto"}
                </ViewBadge>
              </div>
              <DocumentHeader fields={bookingSummaryFields} />
              <DocumentSummaryCards metrics={bookingSummaryMetrics} />
              <EntitySection
                title="Leitura imediata"
                description="O resumo operacional acompanha a etapa atual e evita espalhar informacao em telas separadas."
              >
                <div className="inline-summary">
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
                </div>
              </EntitySection>
              <DocumentImpactPanel title="Orientacao da etapa" sections={bookingImpactSections} />
            </div>
          }
          subtitle="Entity-free master-detail: a etapa segue no fluxo principal enquanto o resumo fica consolidado ao lado."
          title="Jornada guiada de agendamento"
        />
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

function resolveTenantTagline(tenant: PublicCatalogSnapshot["tenant"]): string {
  return (
    tenant.branding?.tagline ??
    "Escolha servico, profissional e horario. Todo o fluxo foi pensado para finalizar rapido no celular."
  );
}

function buildTenantThemeStyle(
  tenant: PublicCatalogSnapshot["tenant"]
): CSSProperties {
  const accentColor = tenant.branding?.accentColor;
  if (!accentColor) {
    return {};
  }

  const rgb = hexToRgbTriplet(accentColor);
  return {
    ["--ag-color-brand-primary" as const]: accentColor,
    ["--ag-color-brand-primary-rgb" as const]: rgb,
    ["--ag-color-status-info" as const]: accentColor,
    ["--tenant-accent" as const]: accentColor,
    ["--tenant-accent-strong" as const]: accentColor,
    ["--tenant-accent-soft" as const]: `rgba(${rgb}, 0.12)`,
    ["--tenant-accent-border" as const]: `rgba(${rgb}, 0.18)`,
    ["--tenant-accent-shadow" as const]: `rgba(${rgb}, 0.22)`
  } as CSSProperties;
}

function hexToRgbTriplet(value: string): string {
  const normalized = value.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `${red}, ${green}, ${blue}`;
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

function formatPaymentStatusLabel(status: string): string {
  if (isApprovedPaymentStatus(status)) {
    return "Aprovado";
  }

  if (isFailedPaymentStatus(status)) {
    return "Nao concluido";
  }

  return "Pendente";
}

function shortDocumentId(value: string): string {
  return value.slice(-8).toUpperCase();
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
      codigo: `CLI-${booking.clientId.slice(0, 6).toUpperCase()}`,
      nome: "Cliente",
      telefone: "",
      email: "",
      origem: "booking_publico"
    },
    service,
    professional
  };
}
