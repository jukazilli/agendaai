import { useEffect, useState, type FormEvent } from "react";

import {
  defaultServicePaymentPolicy,
  paymentChargeTypeValues,
  paymentCheckoutModeValues,
  paymentCollectionModeValues,
  paymentMethodValues,
  paymentProviderStatusValues,
  type AvailabilityRule,
  type Booking,
  type Client,
  type CreateTenantCommand,
  type Professional,
  type Service,
  type TenantPaymentSettings
} from "@agendaai/contracts";

import {
  AdminApiError,
  DEFAULT_ADMIN_API_BASE_URL,
  type AdminBootstrapPayload,
  createProfessional,
  createService,
  createTenantOnboarding,
  fetchAdminBootstrap,
  fetchProfessionalAvailability,
  loginAdmin,
  resolveAdminApiBaseUrl,
  savePaymentSettings,
  saveProfessionalAvailability,
  updateBooking,
  updateProfessional,
  updateService,
  updateTenantSlug
} from "./lib/admin-api";

type AuthMode = "login" | "onboarding";
type BookingFilter = "today" | "open" | "all";
type PaymentCollectionMode = (typeof paymentCollectionModeValues)[number];
type PaymentCheckoutMode = (typeof paymentCheckoutModeValues)[number];
type PaymentChargeType = (typeof paymentChargeTypeValues)[number];
type PaymentMethod = (typeof paymentMethodValues)[number];
type PaymentProviderStatus = (typeof paymentProviderStatusValues)[number];

interface FeedbackState {
  readonly tone: "success" | "error" | "info";
  readonly message: string;
}

interface PaymentFormState {
  readonly status: PaymentProviderStatus;
  readonly checkoutMode: PaymentCheckoutMode;
  readonly publicKey: string;
  readonly accessToken: string;
  readonly collectorId: string;
  readonly statementDescriptor: string;
  readonly notificationUrl: string;
  readonly backSuccess: string;
  readonly backPending: string;
  readonly backFailure: string;
  readonly defaultInstallments: string;
  readonly expirationMinutes: string;
  readonly binaryMode: boolean;
}

interface ServiceFormState {
  readonly nome: string;
  readonly duracaoMin: string;
  readonly precoBase: string;
  readonly status: string;
  readonly collectionMode: PaymentCollectionMode;
  readonly checkoutMode: PaymentCheckoutMode;
  readonly chargeType: PaymentChargeType;
  readonly fixedAmount: string;
  readonly percentage: string;
  readonly acceptedMethods: PaymentMethod[];
}

interface ProfessionalFormState {
  readonly nome: string;
  readonly status: string;
  readonly especialidades: string[];
}

interface AvailabilityDayState {
  readonly weekday: number;
  readonly enabled: boolean;
  readonly startTime: string;
  readonly endTime: string;
}

interface BookingSummary {
  readonly today: number;
  readonly open: number;
  readonly confirmed: number;
  readonly completed: number;
}

interface BookingAction {
  readonly label: string;
  readonly nextStatus: Booking["status"];
  readonly tone: "primary" | "secondary" | "danger";
}

interface ClientInsight {
  readonly client: Client;
  readonly totalBookings: number;
  readonly openBookings: number;
  readonly completedBookings: number;
  readonly lastBooking?: Booking;
}

const API_BASE_STORAGE_KEY = "agendaai.admin.apiBaseUrl";
const SESSION_STORAGE_KEY = "agendaai.admin.sessionToken";
const BOOKING_BASE_URL =
  (import.meta.env.VITE_BOOKING_BASE_URL as string | undefined)?.trim() || "http://127.0.0.1:3000";
const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;

const defaultPaymentForm: PaymentFormState = {
  status: "draft",
  checkoutMode: "checkout_pro",
  publicKey: "",
  accessToken: "",
  collectorId: "",
  statementDescriptor: "",
  notificationUrl: "",
  backSuccess: "",
  backPending: "",
  backFailure: "",
  defaultInstallments: "1",
  expirationMinutes: "30",
  binaryMode: true
};

const defaultServiceForm: ServiceFormState = {
  nome: "",
  duracaoMin: "45",
  precoBase: "90",
  status: "active",
  collectionMode: "none",
  checkoutMode: "checkout_pro",
  chargeType: "percentage",
  fixedAmount: "",
  percentage: "30",
  acceptedMethods: [...defaultServicePaymentPolicy.acceptedMethods]
};

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [apiBaseUrl, setApiBaseUrl] = useState(() =>
    loadStoredValue(API_BASE_STORAGE_KEY, DEFAULT_ADMIN_API_BASE_URL)
  );
  const [sessionToken, setSessionToken] = useState(() => loadStoredValue(SESSION_STORAGE_KEY, ""));
  const [bootstrap, setBootstrap] = useState<AdminBootstrapPayload | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("today");
  const [loginForm, setLoginForm] = useState({
    email: "owner@agendaai.demo",
    password: "agendaai-demo"
  });
  const [onboardingForm, setOnboardingForm] = useState({
    nome: "",
    slug: "",
    timezone: "America/Sao_Paulo",
    adminNome: "",
    adminEmail: "",
    adminTelefone: "",
    senha: ""
  });
  const [slug, setSlug] = useState("");
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentForm);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(defaultServiceForm);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [professionalForm, setProfessionalForm] = useState<ProfessionalFormState>({
    nome: "",
    status: "active",
    especialidades: []
  });
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDayState[]>(
    createDefaultAvailabilityDays()
  );

  useEffect(() => {
    storeValue(API_BASE_STORAGE_KEY, apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    storeValue(SESSION_STORAGE_KEY, sessionToken);
  }, [sessionToken]);

  useEffect(() => {
    if (!sessionToken) {
      setBootstrap(null);
      setBootError(null);
      return;
    }

    let ignore = false;

    async function loadState() {
      try {
        const nextState = await fetchAdminBootstrap(apiBaseUrl, sessionToken);
        if (!ignore) {
          setBootstrap(nextState);
          setBootError(null);
        }
      } catch (error) {
        if (ignore) {
          return;
        }
        if (error instanceof AdminApiError && error.status === 401) {
          setSessionToken("");
        }
        setBootstrap(null);
        setBootError(toErrorMessage(error));
      }
    }

    void loadState();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, sessionToken]);

  useEffect(() => {
    if (!bootstrap) {
      setSlug("");
      setPaymentForm(defaultPaymentForm);
      setServiceForm(defaultServiceForm);
      return;
    }

    setSlug(bootstrap.session.tenant.slug);
    setPaymentForm(toPaymentForm(bootstrap.paymentSettings));

    const service =
      bootstrap.services.find((item) => item.id === selectedServiceId) ?? bootstrap.services[0];
    if (service) {
      if (service.id !== selectedServiceId) {
        setSelectedServiceId(service.id);
      }
      setServiceForm(toServiceForm(service));
    }

    const professional =
      bootstrap.professionals.find((item) => item.id === selectedProfessionalId) ??
      bootstrap.professionals[0];
    if (professional) {
      if (professional.id !== selectedProfessionalId) {
        setSelectedProfessionalId(professional.id);
      }
      setProfessionalForm({
        nome: professional.nome,
        status: professional.status,
        especialidades: [...professional.especialidades]
      });
    }
  }, [bootstrap, selectedProfessionalId, selectedServiceId]);

  useEffect(() => {
    if (!sessionToken || !selectedProfessionalId) {
      setAvailabilityDays(createDefaultAvailabilityDays());
      return;
    }

    let ignore = false;

    async function loadAvailability() {
      try {
        const rules = await fetchProfessionalAvailability(apiBaseUrl, sessionToken, selectedProfessionalId);
        if (!ignore) {
          setAvailabilityDays(toAvailabilityDays(rules));
        }
      } catch (error) {
        if (!ignore) {
          setFeedback({
            tone: "error",
            message: toErrorMessage(error)
          });
        }
      }
    }

    void loadAvailability();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, selectedProfessionalId, sessionToken]);

  const tenant = bootstrap?.session.tenant;
  const publicBookingUrl = tenant ? `${BOOKING_BASE_URL.replace(/\/+$/, "")}/${tenant.slug}` : "";
  const services = bootstrap?.services ?? [];
  const professionals = bootstrap?.professionals ?? [];
  const clients = bootstrap?.clients ?? [];
  const bookings = bootstrap?.bookings ?? [];
  const bookingSummary = summarizeBookings(bookings);
  const agendaBookings = filterAgendaBookings(bookings, bookingFilter);
  const clientInsights = buildClientInsights(clients, bookings);

  async function refreshAdminState(): Promise<void> {
    if (!sessionToken) {
      return;
    }
    setBootstrap(await fetchAdminBootstrap(apiBaseUrl, sessionToken));
  }

  async function runAction(task: () => Promise<void>): Promise<void> {
    setIsBusy(true);
    try {
      await task();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: toErrorMessage(error)
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const session = await loginAdmin(apiBaseUrl, loginForm.email, loginForm.password);
      setSessionToken(session.token);
      setFeedback({ tone: "success", message: "Sessao administrativa aberta." });
    });
  }

  async function handleOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const payload: Omit<CreateTenantCommand, "version"> = {
        nome: onboardingForm.nome,
        slug: onboardingForm.slug,
        timezone: onboardingForm.timezone,
        admin: {
          nome: onboardingForm.adminNome,
          email: onboardingForm.adminEmail,
          telefone: emptyToUndefined(onboardingForm.adminTelefone),
          senha: onboardingForm.senha,
          aceitarTermos: true
        }
      };

      const onboarding = await createTenantOnboarding(apiBaseUrl, payload);
      setSessionToken(onboarding.session.token);
      setFeedback({ tone: "success", message: `Negocio ${onboarding.tenant.nome} criado e autenticado.` });
    });
  }

  async function handleSaveSlug(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await updateTenantSlug(apiBaseUrl, sessionToken, slug);
      await refreshAdminState();
      setFeedback({ tone: "success", message: "Slug publica atualizada." });
    });
  }

  async function handleSavePayments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await savePaymentSettings(apiBaseUrl, sessionToken, buildPaymentPayload(paymentForm));
      await refreshAdminState();
      setFeedback({ tone: "success", message: "Configuracao do Mercado Pago salva." });
    });
  }

  async function handleSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const payload = buildServicePayload(serviceForm);
      const service =
        selectedServiceId ?
          await updateService(apiBaseUrl, sessionToken, selectedServiceId, payload)
        : await createService(apiBaseUrl, sessionToken, payload);
      setSelectedServiceId(service.id);
      await refreshAdminState();
      setFeedback({ tone: "success", message: selectedServiceId ? "Servico atualizado." : "Servico criado." });
    });
  }

  async function handleSaveProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const professional =
        selectedProfessionalId ?
          await updateProfessional(apiBaseUrl, sessionToken, selectedProfessionalId, {
            nome: professionalForm.nome.trim(),
            status: professionalForm.status.trim(),
            especialidades: [...professionalForm.especialidades]
          })
        : await createProfessional(apiBaseUrl, sessionToken, {
            nome: professionalForm.nome.trim(),
            especialidades: [...professionalForm.especialidades]
          });
      setSelectedProfessionalId(professional.id);
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: selectedProfessionalId ? "Profissional atualizado." : "Profissional criado."
      });
    });
  }

  async function handleSaveAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const rules = availabilityDays
        .filter((day) => day.enabled)
        .map((day) => ({
          weekday: day.weekday,
          faixa: { startTime: day.startTime, endTime: day.endTime }
        }));
      if (rules.length === 0) {
        throw new Error("Defina ao menos um dia com horario valido para publicar a agenda.");
      }
      await saveProfessionalAvailability(apiBaseUrl, sessionToken, selectedProfessionalId, rules);
      setFeedback({ tone: "success", message: "Disponibilidade semanal salva." });
    });
  }

  async function handleBookingStatusAction(
    bookingId: string,
    status: Booking["status"]
  ): Promise<void> {
    await runAction(async () => {
      await updateBooking(apiBaseUrl, sessionToken, bookingId, { status });
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: resolveBookingActionFeedback(status)
      });
    });
  }

  if (!sessionToken) {
    return (
      <main className="shell auth-shell">
        <section className="hero-block">
          <p className="eyebrow">AgendaAI / admin-web</p>
          <h1>Onboarding, catalogo, equipe e operacao do dia.</h1>
          <p className="description">
            O cliente final agenda pela slug publica. Aqui o owner cria o negocio, configura
            servicos, liga Mercado Pago, monta a equipe e acompanha a agenda operacional.
          </p>
        </section>

        <section className="workspace-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Conexao</p>
                <h2>Acesso administrativo</h2>
              </div>
              <div className="mode-switch">
                <button
                  className={authMode === "login" ? "secondary-button is-active" : "secondary-button"}
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={
                    authMode === "onboarding" ? "secondary-button is-active" : "secondary-button"
                  }
                  onClick={() => setAuthMode("onboarding")}
                  type="button"
                >
                  Criar negocio
                </button>
              </div>
            </div>

            <label className="field">
              <span>API base URL</span>
              <input
                type="url"
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrl(resolveAdminApiBaseUrl(event.target.value))}
              />
            </label>

            {feedback ? <div className={`feedback-banner is-${feedback.tone}`}>{feedback.message}</div> : null}

            {authMode === "login" ? (
              <form className="stack-form" onSubmit={handleLogin}>
                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Senha</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  />
                </label>
                <button className="primary-button" disabled={isBusy} type="submit">
                  {isBusy ? "Entrando..." : "Entrar no admin"}
                </button>
              </form>
            ) : (
              <form className="stack-form" onSubmit={handleOnboarding}>
                <div className="form-grid">
                  <label className="field">
                    <span>Nome do negocio</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.nome}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, nome: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Slug</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.slug}
                      onChange={(event) =>
                        setOnboardingForm({
                          ...onboardingForm,
                          slug: sanitizeSlug(event.target.value)
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Timezone</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.timezone}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, timezone: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Nome do owner</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.adminNome}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, adminNome: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>E-mail do owner</span>
                    <input
                      required
                      type="email"
                      value={onboardingForm.adminEmail}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, adminEmail: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Telefone</span>
                    <input
                      type="tel"
                      value={onboardingForm.adminTelefone}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, adminTelefone: event.target.value })
                      }
                    />
                  </label>
                  <label className="field field-wide">
                    <span>Senha inicial</span>
                    <input
                      required
                      type="password"
                      value={onboardingForm.senha}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, senha: event.target.value })
                      }
                    />
                  </label>
                </div>
                <button className="primary-button" disabled={isBusy} type="submit">
                  {isBusy ? "Criando..." : "Criar negocio e entrar"}
                </button>
              </form>
            )}
          </article>

          <aside className="panel aside-panel">
            <div className="list-card">
              <strong>Duas visoes</strong>
              <p>Booking publico para o cliente e shell admin para implantar e operar o negocio.</p>
            </div>
            <div className="list-card">
              <strong>Credenciais demo</strong>
              <p>`owner@agendaai.demo` com `agendaai-demo` depois da seed do `api-rest`.</p>
            </div>
            <div className="list-card">
              <strong>Ponto atual</strong>
              <p>Checkout Pro publico ligado e agenda admin entrando em operacao.</p>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="shell admin-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AgendaAI / admin shell</p>
          <h1>Implantacao e operacao do dia.</h1>
        </div>
        <div className="topbar-actions">
          <button
            className="secondary-button"
            disabled={isBusy}
            onClick={() => void refreshAdminState()}
            type="button"
          >
            Atualizar
          </button>
          <button className="secondary-button" onClick={() => setSessionToken("")} type="button">
            Sair
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <article className="hero-card">
          <p className="eyebrow">Tenant ativo</p>
          <h2>{tenant?.nome}</h2>
          <p className="description">
            Slug publica para o cliente; aqui ficam catalogo, equipe, agenda operacional, clientes
            e cobranca.
          </p>
          <div className="hero-meta">
            <span>/{tenant?.slug}</span>
            <span>{tenant?.timezone}</span>
            <span>{resolveAdminApiBaseUrl(apiBaseUrl)}</span>
          </div>
          <a className="link-chip" href={publicBookingUrl} rel="noreferrer" target="_blank">
            Abrir booking publico
          </a>
        </article>

        <div className="stats-strip">
          <article className="stat-card">
            <span>Servicos</span>
            <strong>{services.length}</strong>
          </article>
          <article className="stat-card">
            <span>Profissionais</span>
            <strong>{professionals.length}</strong>
          </article>
          <article className="stat-card">
            <span>Hoje</span>
            <strong>{bookingSummary.today}</strong>
          </article>
          <article className="stat-card">
            <span>Abertas</span>
            <strong>{bookingSummary.open}</strong>
          </article>
          <article className="stat-card">
            <span>Clientes</span>
            <strong>{clients.length}</strong>
          </article>
        </div>
      </section>

      {feedback ? <div className={`feedback-banner is-${feedback.tone}`}>{feedback.message}</div> : null}
      {bootError ? <div className="feedback-banner is-error">{bootError}</div> : null}

      <section className="workspace-grid">
        <article className="panel">
          <form className="stack-form" onSubmit={handleSaveSlug}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Implantacao</p>
                <h2>Slug publica</h2>
              </div>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Nome</span>
                <input disabled type="text" value={tenant?.nome ?? ""} />
              </label>
              <label className="field">
                <span>Status</span>
                <input disabled type="text" value={tenant?.status ?? ""} />
              </label>
              <label className="field">
                <span>Timezone</span>
                <input disabled type="text" value={tenant?.timezone ?? ""} />
              </label>
              <label className="field">
                <span>Slug</span>
                <input
                  required
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(sanitizeSlug(event.target.value))}
                />
              </label>
              <label className="field field-wide">
                <span>URL publica</span>
                <input disabled type="text" value={publicBookingUrl} />
              </label>
            </div>

            <button className="primary-button" disabled={isBusy} type="submit">
              Salvar slug
            </button>
          </form>
        </article>

        <article className="panel">
          <form className="stack-form" onSubmit={handleSavePayments}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Pagamentos</p>
                <h2>Mercado Pago do tenant</h2>
              </div>
              <span className="helper-chip">Checkout Pro recomendado</span>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Status</span>
                <select
                  value={paymentForm.status}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      status: event.target.value as PaymentProviderStatus
                    })
                  }
                >
                  {paymentProviderStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Checkout</span>
                <select
                  value={paymentForm.checkoutMode}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      checkoutMode: event.target.value as PaymentCheckoutMode
                    })
                  }
                >
                  {paymentCheckoutModeValues.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Public key</span>
                <input
                  type="text"
                  value={paymentForm.publicKey}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, publicKey: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Access token</span>
                <input
                  type="password"
                  value={paymentForm.accessToken}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, accessToken: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Collector ID</span>
                <input
                  type="text"
                  value={paymentForm.collectorId}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, collectorId: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Statement descriptor</span>
                <input
                  type="text"
                  value={paymentForm.statementDescriptor}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      statementDescriptor: event.target.value
                    })
                  }
                />
              </label>
              <label className="field field-wide">
                <span>Notification URL</span>
                <input
                  type="url"
                  value={paymentForm.notificationUrl}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      notificationUrl: event.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Back success</span>
                <input
                  type="url"
                  value={paymentForm.backSuccess}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, backSuccess: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Back pending</span>
                <input
                  type="url"
                  value={paymentForm.backPending}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, backPending: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Back failure</span>
                <input
                  type="url"
                  value={paymentForm.backFailure}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, backFailure: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Parcelas</span>
                <input
                  min="1"
                  type="number"
                  value={paymentForm.defaultInstallments}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      defaultInstallments: event.target.value
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Expiracao</span>
                <input
                  min="1"
                  type="number"
                  value={paymentForm.expirationMinutes}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      expirationMinutes: event.target.value
                    })
                  }
                />
              </label>
            </div>

            <label className="toggle-field">
              <input
                checked={paymentForm.binaryMode}
                type="checkbox"
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, binaryMode: event.target.checked })
                }
              />
              <span>Ativar `binary_mode`</span>
            </label>

            <button className="primary-button" disabled={isBusy} type="submit">
              Salvar provider
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Catalogo</p>
              <h2>Servicos e politica comercial</h2>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                setSelectedServiceId("");
                setServiceForm(defaultServiceForm);
              }}
              type="button"
            >
              Novo servico
            </button>
          </div>

          <div className="editor-layout">
            <div className="entity-list">
              {services.length ? (
                services.map((service) => (
                  <button
                    className={service.id === selectedServiceId ? "entity-card is-active" : "entity-card"}
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    type="button"
                  >
                    <strong>{service.nome}</strong>
                    <span>
                      {service.duracaoMin} min - {formatCurrency(service.precoBase)}
                    </span>
                    <small>
                      {service.paymentPolicy.collectionMode === "none"
                        ? "Reserva imediata"
                        : service.paymentPolicy.collectionMode}
                    </small>
                  </button>
                ))
              ) : (
                <p className="empty-state">Nenhum servico cadastrado ainda.</p>
              )}
            </div>

            <form className="stack-form" onSubmit={handleSaveService}>
              <div className="form-grid">
                <label className="field">
                  <span>Nome</span>
                  <input
                    required
                    type="text"
                    value={serviceForm.nome}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, nome: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Duracao</span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={serviceForm.duracaoMin}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, duracaoMin: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Preco</span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={serviceForm.precoBase}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, precoBase: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <input
                    required
                    type="text"
                    value={serviceForm.status}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, status: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Cobranca</span>
                  <select
                    value={serviceForm.collectionMode}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        collectionMode: event.target.value as PaymentCollectionMode
                      })
                    }
                  >
                    {paymentCollectionModeValues.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Checkout</span>
                  <select
                    disabled={serviceForm.collectionMode === "none"}
                    value={serviceForm.checkoutMode}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        checkoutMode: event.target.value as PaymentCheckoutMode
                      })
                    }
                  >
                    {paymentCheckoutModeValues.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Tipo</span>
                  <select
                    disabled={serviceForm.collectionMode === "none"}
                    value={serviceForm.chargeType}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        chargeType: event.target.value as PaymentChargeType
                      })
                    }
                  >
                    {paymentChargeTypeValues.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                {serviceForm.chargeType === "fixed" ? (
                  <label className="field">
                    <span>Valor</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={serviceForm.fixedAmount}
                      onChange={(event) =>
                        setServiceForm({ ...serviceForm, fixedAmount: event.target.value })
                      }
                    />
                  </label>
                ) : (
                  <label className="field">
                    <span>Percentual</span>
                    <input
                      max="100"
                      min="1"
                      type="number"
                      value={serviceForm.percentage}
                      onChange={(event) =>
                        setServiceForm({ ...serviceForm, percentage: event.target.value })
                      }
                    />
                  </label>
                )}
              </div>

              <fieldset className="checkbox-group">
                <legend>Meios aceitos</legend>
                {paymentMethodValues.map((method) => (
                  <label className="check-item" key={method}>
                    <input
                      checked={serviceForm.acceptedMethods.includes(method)}
                      type="checkbox"
                      onChange={() =>
                        setServiceForm({
                          ...serviceForm,
                          acceptedMethods: toggleArrayValue(serviceForm.acceptedMethods, method)
                        })
                      }
                    />
                    <span>{method}</span>
                  </label>
                ))}
              </fieldset>

              <button className="primary-button" disabled={isBusy} type="submit">
                {selectedServiceId ? "Salvar servico" : "Criar servico"}
              </button>
            </form>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Equipe</p>
              <h2>Profissionais e agenda semanal</h2>
            </div>
            <button
              className="secondary-button"
              onClick={() => {
                setSelectedProfessionalId("");
                setProfessionalForm({ nome: "", status: "active", especialidades: [] });
                setAvailabilityDays(createDefaultAvailabilityDays());
              }}
              type="button"
            >
              Novo profissional
            </button>
          </div>

          <div className="editor-layout">
            <div className="entity-list">
              {professionals.length ? (
                professionals.map((professional) => (
                  <button
                    className={
                      professional.id === selectedProfessionalId
                        ? "entity-card is-active"
                        : "entity-card"
                    }
                    key={professional.id}
                    onClick={() => setSelectedProfessionalId(professional.id)}
                    type="button"
                  >
                    <strong>{professional.nome}</strong>
                    <span>{professional.especialidades.length} servicos</span>
                    <small>{professional.status}</small>
                  </button>
                ))
              ) : (
                <p className="empty-state">Nenhum profissional cadastrado ainda.</p>
              )}
            </div>

            <div className="stack-form split-stack">
              <form className="stack-form" onSubmit={handleSaveProfessional}>
                <div className="form-grid">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      required
                      type="text"
                      value={professionalForm.nome}
                      onChange={(event) =>
                        setProfessionalForm({ ...professionalForm, nome: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <input
                      required
                      type="text"
                      value={professionalForm.status}
                      onChange={(event) =>
                        setProfessionalForm({ ...professionalForm, status: event.target.value })
                      }
                    />
                  </label>
                </div>

                <fieldset className="checkbox-group">
                  <legend>Especialidades</legend>
                  {services.length ? (
                    services.map((service) => (
                      <label className="check-item" key={service.id}>
                        <input
                          checked={professionalForm.especialidades.includes(service.id)}
                          type="checkbox"
                          onChange={() =>
                            setProfessionalForm({
                              ...professionalForm,
                              especialidades: toggleArrayValue(
                                professionalForm.especialidades,
                                service.id
                              )
                            })
                          }
                        />
                        <span>{service.nome}</span>
                      </label>
                    ))
                  ) : (
                    <p className="helper">Cadastre servicos antes de vincular equipe.</p>
                  )}
                </fieldset>

                <button className="primary-button" disabled={isBusy} type="submit">
                  {selectedProfessionalId ? "Salvar profissional" : "Criar profissional"}
                </button>
              </form>

              <form className="stack-form" onSubmit={handleSaveAvailability}>
                <div className="panel-header compact">
                  <div>
                    <p className="eyebrow">Disponibilidade</p>
                    <h3>Semana operacional</h3>
                  </div>
                </div>

                <div className="availability-list">
                  {availabilityDays.map((day) => (
                    <div className="availability-row" key={day.weekday}>
                      <label className="check-item inline">
                        <input
                          checked={day.enabled}
                          type="checkbox"
                          onChange={(event) =>
                            setAvailabilityDays((current) =>
                              current.map((item) =>
                                item.weekday === day.weekday
                                  ? { ...item, enabled: event.target.checked }
                                  : item
                              )
                            )
                          }
                        />
                        <span>{weekdayLabels[day.weekday]}</span>
                      </label>
                      <input
                        disabled={!day.enabled}
                        type="time"
                        value={day.startTime}
                        onChange={(event) =>
                          setAvailabilityDays((current) =>
                            current.map((item) =>
                              item.weekday === day.weekday
                                ? { ...item, startTime: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <input
                        disabled={!day.enabled}
                        type="time"
                        value={day.endTime}
                        onChange={(event) =>
                          setAvailabilityDays((current) =>
                            current.map((item) =>
                              item.weekday === day.weekday
                                ? { ...item, endTime: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                  ))}
                </div>

                <button
                  className="primary-button"
                  disabled={isBusy || !selectedProfessionalId}
                  type="submit"
                >
                  Salvar disponibilidade
                </button>
              </form>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Operacao do dia</p>
              <h2>Agenda administrativa</h2>
            </div>
            <div className="mode-switch">
              <button
                className={bookingFilter === "today" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setBookingFilter("today")}
                type="button"
              >
                Hoje
              </button>
              <button
                className={bookingFilter === "open" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setBookingFilter("open")}
                type="button"
              >
                Em aberto
              </button>
              <button
                className={bookingFilter === "all" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setBookingFilter("all")}
                type="button"
              >
                Tudo
              </button>
            </div>
          </div>

          <div className="record-meta">
            <span className="status-pill is-neutral">Hoje {bookingSummary.today}</span>
            <span className="status-pill is-info">Abertas {bookingSummary.open}</span>
            <span className="status-pill is-success">Confirmadas {bookingSummary.confirmed}</span>
            <span className="status-pill is-success">Concluidas {bookingSummary.completed}</span>
          </div>

          <div className="records-column">
            {agendaBookings.length ? (
              agendaBookings.map((booking) => {
                const service = services.find((item) => item.id === booking.serviceId);
                const professional = professionals.find((item) => item.id === booking.professionalId);
                const actions = resolveBookingActions(booking);

                return (
                  <article className="record-card agenda-card" key={booking.id}>
                    <div className="record-card-header">
                      <div className="record-stack">
                        <strong>{resolveBookingTitle(booking, services, professionals)}</strong>
                        <span>{resolveClientName(booking.clientId, clients)}</span>
                      </div>
                      <span className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}>
                        {formatBookingStatus(booking.status)}
                      </span>
                    </div>

                    <div className="record-meta">
                      <span>{formatDateTime(booking.startAt)}</span>
                      <span>{service ? formatCurrency(service.precoBase) : "Preco nao encontrado"}</span>
                      <span>{professional?.nome ?? "Profissional nao encontrado"}</span>
                    </div>

                    {booking.status === "aguardando pagamento" ? (
                      <p className="helper">
                        Este horario segue bloqueado aguardando a conciliacao do pagamento online.
                      </p>
                    ) : null}

                    {actions.length ? (
                      <div className="record-card-actions">
                        {actions.map((action) => (
                          <button
                            className={resolveActionButtonClassName(action.tone)}
                            disabled={isBusy}
                            key={action.label}
                            onClick={() => void handleBookingStatusAction(booking.id, action.nextStatus)}
                            type="button"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="helper">Nenhuma acao operacional adicional para este status.</p>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="empty-state">
                Nenhum booking encontrado para este filtro operacional.
              </p>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Clientes e CRM</p>
              <h2>Clientes capturados pela jornada real</h2>
            </div>
            <span className="helper-chip">Leitura derivada de booking</span>
          </div>

          <div className="records-column">
            {clientInsights.length ? (
              clientInsights.map((entry) => (
                <article className="record-card" key={entry.client.id}>
                  <div className="record-card-header">
                    <div className="record-stack">
                      <strong>{entry.client.nome}</strong>
                      <span>{entry.client.email}</span>
                    </div>
                    <span className="status-pill is-neutral">
                      {entry.totalBookings} bookings
                    </span>
                  </div>

                  <div className="record-meta">
                    <span>{entry.client.telefone || "Sem telefone"}</span>
                    <span>Origem {entry.client.origem}</span>
                    <span>
                      Ultimo movimento{" "}
                      {entry.lastBooking ? formatDateTime(entry.lastBooking.startAt) : "sem booking"}
                    </span>
                  </div>

                  <div className="record-meta">
                    <span className="status-pill is-info">Em aberto {entry.openBookings}</span>
                    <span className="status-pill is-success">
                      Concluidos {entry.completedBookings}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">Nenhum cliente cadastrado ainda.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

function toPaymentForm(settings?: TenantPaymentSettings): PaymentFormState {
  if (!settings) {
    return defaultPaymentForm;
  }
  return {
    status: settings.status,
    checkoutMode: settings.checkoutMode,
    publicKey: settings.publicKey ?? "",
    accessToken: settings.accessToken ?? "",
    collectorId: settings.collectorId ?? "",
    statementDescriptor: settings.statementDescriptor ?? "",
    notificationUrl: settings.notificationUrl ?? "",
    backSuccess: settings.backUrls?.success ?? "",
    backPending: settings.backUrls?.pending ?? "",
    backFailure: settings.backUrls?.failure ?? "",
    defaultInstallments: settings.defaultInstallments ? String(settings.defaultInstallments) : "1",
    expirationMinutes: settings.expirationMinutes ? String(settings.expirationMinutes) : "30",
    binaryMode: settings.binaryMode
  };
}

function toServiceForm(service: Service): ServiceFormState {
  return {
    nome: service.nome,
    duracaoMin: String(service.duracaoMin),
    precoBase: String(service.precoBase),
    status: service.status,
    collectionMode: service.paymentPolicy.collectionMode,
    checkoutMode: service.paymentPolicy.checkoutMode ?? "checkout_pro",
    chargeType: service.paymentPolicy.chargeType ?? "percentage",
    fixedAmount: service.paymentPolicy.fixedAmount ? String(service.paymentPolicy.fixedAmount) : "",
    percentage: service.paymentPolicy.percentage ? String(service.paymentPolicy.percentage) : "30",
    acceptedMethods: service.paymentPolicy.acceptedMethods.length
      ? [...service.paymentPolicy.acceptedMethods]
      : [...defaultServicePaymentPolicy.acceptedMethods]
  };
}

function buildPaymentPayload(
  form: PaymentFormState
): Omit<TenantPaymentSettings, "version" | "tenantId" | "provider"> {
  return {
    status: form.status,
    checkoutMode: form.checkoutMode,
    publicKey: emptyToUndefined(form.publicKey),
    accessToken: emptyToUndefined(form.accessToken),
    collectorId: emptyToUndefined(form.collectorId),
    statementDescriptor: emptyToUndefined(form.statementDescriptor),
    notificationUrl: emptyToUndefined(form.notificationUrl),
    backUrls:
      form.backSuccess && form.backPending && form.backFailure
        ? {
            success: form.backSuccess.trim(),
            pending: form.backPending.trim(),
            failure: form.backFailure.trim()
          }
        : undefined,
    autoReturn: "approved",
    binaryMode: form.binaryMode,
    defaultInstallments: parseOptionalInteger(form.defaultInstallments),
    expirationMinutes: parseOptionalInteger(form.expirationMinutes)
  };
}

function buildServicePayload(form: ServiceFormState): {
  nome: string;
  duracaoMin: number;
  precoBase: number;
  exigeSinal: boolean;
  paymentPolicy: Service["paymentPolicy"];
  status: string;
} {
  const precoBase = parseRequiredNumber(form.precoBase, "precoBase");
  const percentage =
    form.chargeType === "percentage"
      ? parseOptionalNumber(form.percentage) ?? (form.collectionMode === "full" ? 100 : 30)
      : undefined;
  const fixedAmount =
    form.chargeType === "fixed" ? parseOptionalNumber(form.fixedAmount) ?? precoBase : undefined;

  return {
    nome: form.nome.trim(),
    duracaoMin: parseRequiredInteger(form.duracaoMin, "duracaoMin"),
    precoBase,
    exigeSinal: form.collectionMode !== "none",
    status: form.status.trim(),
    paymentPolicy: {
      ...defaultServicePaymentPolicy,
      collectionMode: form.collectionMode,
      provider: form.collectionMode === "none" ? undefined : "mercado_pago",
      checkoutMode: form.collectionMode === "none" ? undefined : form.checkoutMode,
      chargeType: form.collectionMode === "none" ? undefined : form.chargeType,
      fixedAmount: form.collectionMode === "none" ? undefined : fixedAmount,
      percentage: form.collectionMode === "none" ? undefined : percentage,
      acceptedMethods: form.acceptedMethods.length
        ? [...form.acceptedMethods]
        : [...defaultServicePaymentPolicy.acceptedMethods],
      capture: true
    }
  };
}

function createDefaultAvailabilityDays(): AvailabilityDayState[] {
  return [
    { weekday: 0, enabled: false, startTime: "09:00", endTime: "18:00" },
    { weekday: 1, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 2, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 3, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 4, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 5, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 6, enabled: true, startTime: "09:00", endTime: "13:00" }
  ];
}

function toAvailabilityDays(rules: AvailabilityRule[]): AvailabilityDayState[] {
  if (rules.length === 0) {
    return createDefaultAvailabilityDays();
  }

  return createDefaultAvailabilityDays().map((day) => {
    const rule = rules.find((item) => item.weekday === day.weekday);
    return rule
      ? {
          weekday: day.weekday,
          enabled: true,
          startTime: rule.faixa.startTime,
          endTime: rule.faixa.endTime
        }
      : { ...day, enabled: false };
  });
}

function summarizeBookings(bookings: readonly Booking[]): BookingSummary {
  return {
    today: bookings.filter((booking) => isSameCalendarDay(booking.startAt, new Date())).length,
    open: bookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
    confirmed: bookings.filter((booking) => booking.status === "confirmado").length,
    completed: bookings.filter((booking) => booking.status === "concluido").length
  };
}

function filterAgendaBookings(bookings: readonly Booking[], filter: BookingFilter): Booking[] {
  return [...bookings]
    .filter((booking) => {
      if (filter === "today") {
        return isSameCalendarDay(booking.startAt, new Date());
      }
      if (filter === "open") {
        return isOpenBookingStatus(booking.status);
      }
      return true;
    })
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function buildClientInsights(clients: readonly Client[], bookings: readonly Booking[]): ClientInsight[] {
  return clients
    .map((client) => {
      const clientBookings = bookings
        .filter((booking) => booking.clientId === client.id)
        .sort((left, right) => right.startAt.localeCompare(left.startAt));

      return {
        client,
        totalBookings: clientBookings.length,
        openBookings: clientBookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
        completedBookings: clientBookings.filter((booking) => booking.status === "concluido").length,
        lastBooking: clientBookings[0]
      };
    })
    .sort((left, right) => {
      const leftDate = left.lastBooking?.startAt ?? "";
      const rightDate = right.lastBooking?.startAt ?? "";
      return rightDate.localeCompare(leftDate);
    })
    .slice(0, 8);
}

function resolveBookingActions(booking: Booking): BookingAction[] {
  switch (booking.status) {
    case "pendente":
      return [
        { label: "Confirmar", nextStatus: "confirmado", tone: "primary" },
        { label: "Cancelar", nextStatus: "cancelado", tone: "danger" }
      ];
    case "aguardando pagamento":
      return [{ label: "Cancelar", nextStatus: "cancelado", tone: "danger" }];
    case "confirmado":
      return [
        { label: "Concluir", nextStatus: "concluido", tone: "primary" },
        { label: "Cancelar", nextStatus: "cancelado", tone: "danger" }
      ];
    default:
      return [];
  }
}

function resolveBookingActionFeedback(status: Booking["status"]): string {
  switch (status) {
    case "confirmado":
      return "Booking confirmada para operacao.";
    case "concluido":
      return "Atendimento marcado como concluido.";
    case "cancelado":
      return "Booking cancelada no shell admin.";
    default:
      return "Booking atualizada.";
  }
}

function resolveBookingTitle(
  booking: Booking,
  services: readonly Service[],
  professionals: readonly Professional[]
): string {
  const service = services.find((item) => item.id === booking.serviceId);
  const professional = professionals.find((item) => item.id === booking.professionalId);
  return `${service?.nome ?? "Servico"} - ${professional?.nome ?? "Profissional"}`;
}

function resolveClientName(clientId: string, clients: readonly Client[]): string {
  return clients.find((client) => client.id === clientId)?.nome ?? "Cliente";
}

function resolveBookingStatusTone(status: Booking["status"]): string {
  switch (status) {
    case "confirmado":
    case "concluido":
      return "success";
    case "pendente":
    case "aguardando pagamento":
      return "info";
    case "cancelado":
    case "faltou":
      return "danger";
    default:
      return "neutral";
  }
}

function resolveActionButtonClassName(tone: BookingAction["tone"]): string {
  if (tone === "primary") {
    return "primary-button";
  }
  if (tone === "danger") {
    return "secondary-button is-danger";
  }
  return "secondary-button";
}

function formatBookingStatus(status: Booking["status"]): string {
  if (status.length === 0) {
    return status;
  }
  return `${status.slice(0, 1).toUpperCase()}${status.slice(1)}`;
}

function isOpenBookingStatus(status: Booking["status"]): boolean {
  return status === "pendente" || status === "aguardando pagamento" || status === "confirmado";
}

function isSameCalendarDay(value: string, baseDate: Date): boolean {
  const date = new Date(value);
  return (
    date.getFullYear() === baseDate.getFullYear() &&
    date.getMonth() === baseDate.getMonth() &&
    date.getDate() === baseDate.getDate()
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function toggleArrayValue<T extends string>(items: readonly T[], candidate: T): T[] {
  return items.includes(candidate) ? items.filter((item) => item !== candidate) : [...items, candidate];
}

function parseRequiredInteger(value: string, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Campo ${fieldName} precisa ser um inteiro positivo.`);
  }
  return parsed;
}

function parseRequiredNumber(value: string, fieldName: string): number {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Campo ${fieldName} precisa ser um numero valido.`);
  }
  return parsed;
}

function parseOptionalInteger(value: string): number | undefined {
  return value.trim() ? parseRequiredInteger(value, "numero") : undefined;
}

function parseOptionalNumber(value: string): number | undefined {
  return value.trim() ? parseRequiredNumber(value, "valor") : undefined;
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Falha inesperada na operacao administrativa.";
}

function loadStoredValue(key: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function storeValue(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(key, value);
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Local persistence is optional.
  }
}
