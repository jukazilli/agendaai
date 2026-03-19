# Execucao B-09 - Calendario Semanal e Capacidade

## 1. Objetivo

Endurecer o modulo de `agenda` do `admin-web` para sair da timeline apenas diaria e ganhar leitura semanal de capacidade sem criar endpoint novo nem read model paralelo.

## 2. Regra de precedencia

- contratos reais de `booking` e `availability` do `api-rest`;
- inventario oficial do shell em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`;
- runtime do `admin-web` como espelho final do corte.

## 3. O que foi implementado

Na rota `#agenda` do `admin-web`:

- alternancia entre modo `Dia` e modo `Semana`;
- filtro por profissional no proprio toolbar da agenda;
- grade semanal densa por profissional e por dia;
- leitura de capacidade a partir da disponibilidade semanal ja publicada para cada profissional;
- consolidacao local de horas ocupadas, horas livres e bookings em aberto;
- abertura de uma booking da grade semanal levando o operador de volta ao detalhe diario com reagendamento.

## 4. Como a capacidade foi calculada

Sem endpoint novo, o shell passa a:

- ler os `bookings` reais do bootstrap administrativo;
- buscar a disponibilidade semanal de cada profissional por `GET /v1/admin/professionals/:professionalId/availability`;
- cruzar essa disponibilidade com as datas da semana ancorada em `agendaDate`;
- calcular minutos de capacidade e ocupacao localmente no frontend.

Isso cobre a leitura semanal operacional, mas nao substitui um futuro read model dedicado para analytics historicos ou previsao.

## 5. Evidencia validada

Validacao tecnica:

- `pnpm --filter @agendaai/admin-web lint`
- `pnpm --filter @agendaai/admin-web build`

Smoke funcional:

- `admin-web` local aberto em `http://127.0.0.1:4173/#agenda`, usando o backend publicado em `https://agendaai-eu7w.onrender.com`;
- troca real entre modo `Dia` e `Semana`;
- grade semanal exibindo a profissional `Ana Lima` com capacidade por dia e bookings reais distribuidas na semana;
- clique na booking `Escova` de `10:30 - 11:15` na grade semanal;
- retorno imediato para o modo diario com a booking selecionada e painel lateral de reagendamento carregado.

## 6. Leitura objetiva do estado

`B-09` continua `PARCIAL`, mas mudou de natureza:

- a agenda nao e mais apenas lista operacional;
- existe agora leitura semanal de capacidade usando contratos reais;
- o shell ja cobre dia, semana, detalhe e reagendamento sem sair do modulo.

## 7. O que continua aberto

- calendario mensal;
- drag-and-drop;
- bloqueios por excecao e agenda especial por data;
- analytics financeiros agregados;
- reflexo de atendimento concluido em receita dentro de `B-10`.

## 8. Conclusao

O gargalo dominante de `B-09` deixou de ser "falta visao semanal/capacidade" e passou a ser "falta calendario mais rico e reflexo financeiro". O proximo passo logico deixa de ser shell/agenda e passa a ser a abertura controlada de `B-10`.
