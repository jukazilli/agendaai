import {
  type CashEntry,
  contractVersion,
  type AdminFinancialReadModel,
  type Bank,
  type BankBalance,
  type BankMovement,
  type ExpenseSchedule,
  type FinancialFilters,
  type RevenueSchedule
} from "@agendaai/contracts";

export interface BuildAdminFinancialReadModelInput extends FinancialFilters {
  readonly banks: readonly Bank[];
  readonly balances: readonly BankBalance[];
  readonly revenues: readonly RevenueSchedule[];
  readonly expenses: readonly ExpenseSchedule[];
  readonly movements: readonly BankMovement[];
  readonly cashEntries: readonly CashEntry[];
}

export function buildAdminFinancialReadModel(
  input: BuildAdminFinancialReadModelInput
): AdminFinancialReadModel {
  const visibleBanks = input.bankId
    ? input.banks.filter((bank) => bank.id === input.bankId)
    : input.banks;

  const visibleBalances = input.balances.filter((balance) =>
    visibleBanks.some((bank) => bank.id === balance.bankId)
  );

  const visibleMovements = filterMovementsByRange(input.movements, input.range).filter((movement) => {
    if (!input.bankId) {
      return true;
    }
    return movement.bankIdOrigem === input.bankId || movement.bankIdDestino === input.bankId;
  });

  const receivables = filterSchedulesBySituationAndRange(input.revenues, input.range, input.situation);
  const payables = filterSchedulesBySituationAndRange(input.expenses, input.range, input.situation);
  const operationalReceivables = filterCashEntriesByRange(input.cashEntries, input.range).filter((entry) => {
    if (input.situation === "baixado") {
      return false;
    }
    return entry.status === "open" && !input.movements.some(
      (movement) =>
        movement.sourceType === "cash_entry" &&
        movement.sourceId === entry.id &&
        movement.status === "lancado" &&
        !movement.reversedMovementId
    );
  });

  const consolidatedBalance = visibleBalances.reduce((total, balance) => total + balance.saldoAtual, 0);
  const receivableTotal = receivables
    .filter((entry) => entry.status === "aberta")
    .reduce((total, entry) => total + entry.valor, 0) +
    operationalReceivables.reduce((total, entry) => total + entry.amount, 0);
  const payableTotal = payables
    .filter((entry) => entry.status === "aberta")
    .reduce((total, entry) => total + entry.valor, 0);
  const projectedBalance = consolidatedBalance + receivableTotal - payableTotal;
  const mergedMovements = [...visibleMovements.map((entry) => ({
    id: entry.id,
    codigo: entry.codigo,
    tipo: entry.tipo,
    valor: entry.valor,
    historico: entry.historico,
    dataMovimento: entry.dataMovimento,
    contaOrigem: formatBankMovementAccount(entry.bankIdOrigem, visibleBanks),
    contaDestino: formatBankMovementAccount(entry.bankIdDestino, visibleBanks),
    status: entry.status
  }))]
    .sort((left, right) => right.dataMovimento.localeCompare(left.dataMovimento))
    .slice(0, 8);

  return {
    version: contractVersion,
    filters: {
      range: input.range,
      bankId: input.bankId,
      situation: input.situation
    },
    summary: [
      { id: "saldo-consolidado", label: "Saldo consolidado", value: roundMoney(consolidatedBalance) },
      { id: "total-receber", label: "Total a receber", value: roundMoney(receivableTotal) },
      { id: "total-pagar", label: "Total a pagar", value: roundMoney(payableTotal) },
      { id: "saldo-projetado", label: "Saldo projetado", value: roundMoney(projectedBalance) }
    ],
    bankAccounts: visibleBalances.map((balance) => {
      const bank = visibleBanks.find((entry) => entry.id === balance.bankId);
      return {
        bankId: balance.bankId,
        codigo: bank?.codigo ?? balance.codigo,
        bacenCode: bank?.bacenCode ?? "000",
        nomeBanco: bank?.nomeBanco ?? "Banco removido",
        agencia: bank?.agencia ?? "",
        conta: bank?.conta ?? "",
        saldoInicial: balance.saldoInicial,
        saldoAtual: balance.saldoAtual,
        ativo: bank?.ativo ?? false
      };
    }),
    receivables: [
      ...receivables.map((entry) => ({
        id: entry.id,
        codigo: entry.codigo,
        descricao: entry.descricao,
        valor: entry.valor,
        dataVencimento: entry.dataVencimento,
        status: entry.status,
        origem: entry.origem,
        pessoa: undefined
      })),
      ...operationalReceivables.map((entry) => ({
        id: entry.id,
        codigo: entry.id.slice(0, 8).toUpperCase(),
        descricao: entry.description,
        valor: entry.amount,
        dataVencimento: entry.occurredAt.slice(0, 10),
        status: "aberta",
        origem: entry.source === "payment_reconciliation" ? "pagamento" : "booking",
        pessoa: undefined
      }))
    ]
      .sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento))
      .slice(0, 8),
    payables: payables.slice(0, 8).map((entry) => ({
      id: entry.id,
      codigo: entry.codigo,
      descricao: entry.descricao,
      valor: entry.valor,
      dataVencimento: entry.dataVencimento,
      status: entry.status,
      origem: entry.origem,
      pessoa: entry.beneficiarioNome
    })),
    recentMovements: mergedMovements
  };
}

function filterSchedulesBySituationAndRange<T extends RevenueSchedule | ExpenseSchedule>(
  items: readonly T[],
  range: FinancialFilters["range"],
  situation: FinancialFilters["situation"]
): T[] {
  const nextItems = items.filter((entry) => {
    if (situation === "aberto") {
      return entry.status === "aberta";
    }
    if (situation === "baixado") {
      return entry.status !== "aberta";
    }
    return true;
  });

  if (range === "all") {
    return [...nextItems].sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento));
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (range === "7d" ? 6 : 29));
  start.setHours(0, 0, 0, 0);

  return nextItems
    .filter((entry) => {
      const due = new Date(`${entry.dataVencimento}T00:00:00`);
      return due >= start && due <= end;
    })
    .sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento));
}

function filterMovementsByRange(
  items: readonly BankMovement[],
  range: FinancialFilters["range"]
): BankMovement[] {
  if (range === "all") {
    return [...items].sort((left, right) => right.dataMovimento.localeCompare(left.dataMovimento));
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (range === "7d" ? 6 : 29));
  start.setHours(0, 0, 0, 0);

  return items
    .filter((entry) => {
      const movementDate = new Date(entry.dataMovimento);
      return movementDate >= start && movementDate <= end;
    })
    .sort((left, right) => right.dataMovimento.localeCompare(left.dataMovimento));
}

function filterCashEntriesByRange(
  items: readonly CashEntry[],
  range: FinancialFilters["range"]
): CashEntry[] {
  if (range === "all") {
    return [...items].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (range === "7d" ? 6 : 29));
  start.setHours(0, 0, 0, 0);

  return items
    .filter((entry) => {
      const occurredAt = new Date(entry.occurredAt);
      return occurredAt >= start && occurredAt <= end;
    })
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

function formatBankMovementAccount(bankId: string | undefined, banks: readonly Bank[]): string | undefined {
  if (!bankId) {
    return undefined;
  }
  const bank = banks.find((entry) => entry.id === bankId);
  if (!bank) {
    return undefined;
  }
  return `${bank.nomeBanco} ${bank.agencia}/${bank.conta}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
