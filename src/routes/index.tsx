import { createFileRoute } from "@tanstack/react-router";
import { useId, useRef, useState, type ReactNode } from "react";
import { submitFraudIndicators } from "@/lib/submit-fraud-indicators";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Fingerprint, ShieldCheck, UsersRound, CreditCard, Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Indicadores de Fraudes — ACREFI" },
      { name: "description", content: "Calcule localmente os indicadores BP1 e BP2 de ocorrências fraudulentas da sua instituição." },
      { property: "og:title", content: "Indicadores de Fraudes — ACREFI" },
      { property: "og:description", content: "Calculadora client-side dos indicadores BP1 e BP2 de fraudes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const fmtInt = new Intl.NumberFormat("pt-BR");
const fmtRes = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const digits = (v: string) => v.replace(/\D/g, "").slice(0, 15);
const toNum = (v: string) => (v === "" ? null : Number(v));

function calc(part: string, total: string): { value: number | null; error?: string } {
  const p = toNum(part), t = toNum(total);
  if (p === null || t === null) return { value: null };
  if (t <= 0) return { value: null };
  if (p > t) return { value: null, error: "over" };
  const r = (p / t) * 10000;
  return { value: Number.isFinite(r) ? r : null };
}

function Field({ label, hint, optional, error, children, id }: { label: string; hint?: string | undefined; optional?: boolean | undefined; error?: string | undefined; children: ReactNode; id: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
        {optional && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Opcional</span>}
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls = "h-12 w-full rounded-md border border-input bg-card px-4 text-base text-foreground num outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/10 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/10";

function TextInput({ id, value, onChange, placeholder, type = "text" }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input id={id} type={type} autoComplete="off" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />;
}

function NumInput({ id, value, onChange, placeholder, invalid, hint }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; invalid?: boolean | undefined; hint?: boolean | undefined }) {
  return (
    <input id={id} inputMode="numeric" autoComplete="off" aria-invalid={invalid} aria-describedby={hint ? `${id}-hint` : undefined}
      value={value === "" ? "" : fmtInt.format(Number(value))} placeholder={placeholder}
      onChange={(e) => onChange(digits(e.target.value))} className={inputCls} />
  );
}

function Result({ tag, value, line1, line2 }: { tag: string; value: number | null; line1: string; line2: string }) {
  return (
    <div className="indicator-result mt-8 border-t border-border pt-6 text-primary" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">Resultado {tag}</span>
        <span className="text-xs text-muted-foreground">por 10.000</span>
      </div>
      {value === null ? (
        <div className="mt-3 flex items-center gap-4"><span className="font-display text-5xl text-primary/25">—</span><p className="text-xs text-muted-foreground">Aguardando os valores</p></div>
      ) : (
        <>
          <p key={value} className="mt-4 break-all font-display text-5xl font-semibold num motion-safe:animate-in motion-safe:fade-in duration-300">{fmtRes.format(value)}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{line1}<br />{line2}</p>
        </>
      )}
    </div>
  );
}

function Card({ tag, title, formula, children }: { tag: string; title: string; formula: string; children: ReactNode }) {
  return (
    <section className="indicator-card relative flex flex-col overflow-hidden rounded-lg border border-border bg-card p-6 shadow-soft sm:p-10">
      <div className="flex items-center justify-between">
        <p className="rounded-full bg-secondary px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-widest text-accent">Indicador {tag}</p>
        {tag === "BP 1" ? <UsersRound aria-hidden className="h-7 w-7 text-primary/35" strokeWidth={1.4} /> : <CreditCard aria-hidden className="h-7 w-7 text-accent/60" strokeWidth={1.4} />}
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold leading-snug text-primary sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tag === "BP 1" ? "Casos de fraude para cada grupo de 10.000 clientes ativos." : "Transações fraudulentas para cada grupo de 10.000 transações."}</p>
      <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground num">{formula}</p>
      <div className="calculator-fields mt-7 flex flex-1 flex-col gap-6">{children}</div>
    </section>
  );
}

function Index() {
  const uid = useId();
  const [inst1, setInst1] = useState(""), [mes1, setMes1] = useState("");
  const [casos, setCasos] = useState(""), [carteira, setCarteira] = useState("");
  const [inst2, setInst2] = useState<string | null>(null), [mes2, setMes2] = useState<string | null>(null);
  const [trans, setTrans] = useState(""), [tipo, setTipo] = useState(""), [total, setTotal] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [sendConfirm, setSendConfirm] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const sendingRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

  const bp1 = calc(casos, carteira), bp2 = calc(trans, total);
  const clear = () => { setInst1(""); setMes1(""); setCasos(""); setCarteira(""); setInst2(null); setMes2(null); setTrans(""); setTipo(""); setTotal(""); setConfirm(false); setSendConfirm(false); submissionIdRef.current = null; };
  const id = (s: string) => `${uid}-${s}`;
  const instituicao = (inst2 ?? inst1).trim() || inst1.trim();
  const mes = mes2 ?? mes1;
  const canSend = !!instituicao && /^\d{4}-\d{2}$/.test(mes) && bp1.value !== null && bp2.value !== null;

  const send = async () => {
    if (sendingRef.current || !canSend) return;
    sendingRef.current = true;
    setStatus("sending");
    submissionIdRef.current ??= crypto.randomUUID();
    const [y, m] = mes.split("-");
    try {
      await submitFraudIndicators({
        submissionId: submissionIdRef.current,
        instituicao,
        mesReferencia: `${m}/${y}`,
        casosFraudulentos: Number(casos),
        carteiraAtiva: Number(carteira),
        transacoesFraudulentas: Number(trans),
        tipoFraude: tipo.trim(),
        totalTransacoes: Number(total),
      });
      clear();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      sendingRef.current = false;
      setSendConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-6">
          <span className="font-display text-3xl font-bold text-primary">ACRE<span className="text-accent">FI</span></span>
          <span className="hidden max-w-72 border-l border-border pl-5 text-xs leading-relaxed text-muted-foreground sm:block">Associação Nacional das Instituições de Crédito, Financiamento e Investimento</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-14 pt-12 sm:pt-16">
        <div className="intro relative border-b border-border pb-10">
          <Fingerprint aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-48 w-48 text-accent/10 md:block" strokeWidth={0.7} />
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent"><span className="h-px w-7 bg-accent" />Informação & prevenção</p>
          <h1 className="relative mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">Indicadores de Fraudes<span className="text-accent">.</span></h1>
          <p className="relative mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">Ocorrências fraudulentas em perspectiva.<br />Indicadores de clientes e transações da sua instituição.</p>
          <div className="mt-6 flex items-center gap-2 text-xs font-medium text-accent"><ShieldCheck aria-hidden className="h-4 w-4" />Integridade dos dados<ArrowUpRight aria-hidden className="h-3 w-3" /></div>
        </div>

        <aside className="mt-7 flex gap-3 border-l-2 border-accent pl-4">
          <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
          <div>
            <p className="text-sm font-medium text-foreground">Privacidade dos dados</p>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">O cálculo ocorre no seu navegador, sem armazenamento neste aplicativo. O envio ao serviço externo acontece somente após sua confirmação.</p>
          </div>
        </aside>

        <form className="mt-9 grid gap-8 lg:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
          <Card tag="BP 1" title="Fraudes por Clientes" formula="BP1 = (casos fraudulentos ÷ carteira ativa) × 10.000">
            <Field id={id("i1")} label="Instituição Financeira informante"><TextInput id={id("i1")} value={inst1} onChange={setInst1} placeholder="Informe o nome da instituição" /></Field>
            <Field id={id("m1")} label="Mês de referência"><TextInput id={id("m1")} type="month" value={mes1} onChange={setMes1} /></Field>
            <Field id={id("c")} label="Quantidade de casos fraudulentos identificados" hint="Considere os casos identificados envolvendo crédito e transações."
              error={bp1.error ? "A quantidade de casos fraudulentos não pode ser superior à carteira ativa." : undefined}>
              <NumInput id={id("c")} hint value={casos} onChange={setCasos} placeholder="125" invalid={!!bp1.error} />
            </Field>
            <Field id={id("ca")} label="Carteira ativa" hint="Informe a quantidade total de clientes da carteira ativa no período."
              error={carteira !== "" && Number(carteira) === 0 ? "A carteira ativa precisa ser maior que zero." : undefined}>
              <NumInput id={id("ca")} hint value={carteira} onChange={setCarteira} placeholder="250.000" invalid={carteira !== "" && Number(carteira) === 0} />
            </Field>
            <Result tag="BP 1" value={bp1.value} line1="Casos fraudulentos" line2="a cada 10.000 clientes" />
          </Card>

          <Card tag="BP 2" title="Fraudes por Transações" formula="BP2 = (transações fraudulentas ÷ total de transações) × 10.000">
            <Field id={id("i2")} label="Instituição Financeira informante"><TextInput id={id("i2")} value={inst2 ?? inst1} onChange={setInst2} placeholder="Informe o nome da instituição" /></Field>
            <Field id={id("m2")} label="Mês de referência"><TextInput id={id("m2")} type="month" value={mes2 ?? mes1} onChange={setMes2} /></Field>
            <Field id={id("t")} label="Quantidade de transações identificadas como fraudulentas"
              error={bp2.error ? "A quantidade de transações fraudulentas não pode ser superior ao total de transações." : undefined}>
              <NumInput id={id("t")} value={trans} onChange={setTrans} placeholder="580" invalid={!!bp2.error} />
            </Field>
            <Field id={id("tp")} label="Tipo de fraude" optional><TextInput id={id("tp")} value={tipo} onChange={setTipo} placeholder="Ex.: fraude transacional, engenharia social, cartão etc." /></Field>
            <Field id={id("tt")} label="Quantidade total de transações"
              error={total !== "" && Number(total) === 0 ? "O total de transações precisa ser maior que zero." : undefined}>
              <NumInput id={id("tt")} value={total} onChange={setTotal} placeholder="3.500.000" invalid={total !== "" && Number(total) === 0} />
            </Field>
            <Result tag="BP 2" value={bp2.value} line1="Transações fraudulentas" line2="a cada 10.000 transações" />
          </Card>
        </form>

        <div className="mt-12 flex flex-col items-center gap-4" aria-live="polite">
          {status === "success" && (
            <div role="status" className="w-full max-w-xl rounded-lg border border-border bg-secondary/60 p-5 text-center">
              <p className="text-sm font-medium text-foreground">Informações enviadas com sucesso</p>
              <p className="mt-1 text-xs text-muted-foreground">Os indicadores foram registrados com sucesso.</p>
            </div>
          )}
          {status === "error" && (
            <div role="alert" className="w-full max-w-xl rounded-lg border border-destructive/40 bg-card p-5 text-center">
              <p className="text-sm font-medium text-destructive">Não foi possível enviar as informações</p>
              <p className="mt-1 text-xs text-muted-foreground">Ocorreu um problema durante o envio. Verifique sua conexão e tente novamente.</p>
              <Button type="button" onClick={send} className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">Tentar novamente</Button>
            </div>
          )}
          {status === "sending" ? (
            <Button type="button" disabled className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground opacity-80">
              <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Enviando informações...
            </Button>
          ) : sendConfirm ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">Confirma o envio das informações?</span>
              <Button type="button" onClick={send} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">Sim, enviar</Button>
              <Button type="button" onClick={() => setSendConfirm(false)} className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground transition hover:bg-secondary">Cancelar</Button>
            </div>
          ) : status !== "error" && (
            <Button type="button" disabled={!canSend} onClick={() => { setStatus("idle"); setSendConfirm(true); }} className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Send aria-hidden />Enviar informações</Button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {confirm ? (
            <>
              <span className="text-sm text-muted-foreground">Deseja limpar todos os campos?</span>
              <Button type="button" onClick={clear} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">Sim, limpar</Button>
              <Button type="button" onClick={() => setConfirm(false)} className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground transition hover:bg-secondary">Cancelar</Button>
            </>
          ) : (
            <Button type="button" onClick={() => setConfirm(true)} className="rounded-md border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"><Trash2 aria-hidden />Limpar dados</Button>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center">
          <p className="text-sm text-foreground">ACREFI — Associação Nacional das Instituições de Crédito, Financiamento e Investimento</p>
          <p className="mt-1 text-xs text-muted-foreground">Ferramenta para cálculo de indicadores de fraudes.</p>
        </div>
      </footer>
    </div>
  );
}
