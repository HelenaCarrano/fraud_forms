import { createFileRoute } from "@tanstack/react-router";
import { useId, useState, type ReactNode } from "react";

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
    <div className="mt-8 rounded-lg bg-result p-7 text-result-foreground transition-all duration-500" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{tag}</span>
        <span className="text-[11px] text-result-muted">por 10.000</span>
      </div>
      {value === null ? (
        <p className="mt-6 text-sm text-result-muted">Preencha os campos acima para calcular.</p>
      ) : (
        <>
          <p key={value} className="mt-4 font-serif text-6xl num animate-in fade-in duration-300">{fmtRes.format(value)}</p>
          <p className="mt-3 text-sm leading-relaxed text-result-muted">{line1}<br />{line2}</p>
        </>
      )}
    </div>
  );
}

function Card({ tag, title, formula, children }: { tag: string; title: string; formula: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-7 shadow-soft sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">{tag}</p>
      <h2 className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-3 text-xs text-muted-foreground num">{formula}</p>
      <div className="mt-8 space-y-6">{children}</div>
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

  const bp1 = calc(casos, carteira), bp2 = calc(trans, total);
  const clear = () => { setInst1(""); setMes1(""); setCasos(""); setCarteira(""); setInst2(null); setMes2(null); setTrans(""); setTipo(""); setTotal(""); setConfirm(false); };
  const id = (s: string) => `${uid}-${s}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
          <span className="font-serif text-2xl font-semibold tracking-tight text-primary">ACRE<span className="text-accent">fi</span></span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Ferramenta institucional</p>
          <h1 className="mt-4 font-serif text-4xl text-foreground sm:text-6xl">Indicadores de Fraudes</h1>
          <p className="mt-5 text-lg text-muted-foreground">Calcule os indicadores de ocorrências fraudulentas de sua instituição.</p>
          <p className="mt-3 text-xs text-muted-foreground/80">Os dados preenchidos nesta ferramenta são processados exclusivamente no seu navegador e não são armazenados ou enviados.</p>
        </div>

        <aside className="mt-10 flex max-w-2xl gap-4 rounded-lg border border-border bg-secondary/60 p-5">
          <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
          <div>
            <p className="text-sm font-medium text-foreground">Privacidade dos dados</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Os valores informados nesta página são utilizados exclusivamente para o cálculo dos indicadores. O processamento ocorre localmente no seu navegador e nenhuma informação preenchida é enviada ou armazenada pelo sistema.</p>
          </div>
        </aside>

        <form className="mt-14 grid gap-8 lg:grid-cols-2" onSubmit={(e) => e.preventDefault()} noValidate>
          <Card tag="BP 1" title="Casos fraudulentos identificados" formula="BP1 = (casos fraudulentos ÷ carteira ativa) × 10.000">
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

          <Card tag="BP 2" title="Transações fraudulentas identificadas" formula="BP2 = (transações fraudulentas ÷ total de transações) × 10.000">
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

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {confirm ? (
            <>
              <span className="text-sm text-muted-foreground">Deseja limpar todos os campos?</span>
              <button type="button" onClick={clear} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">Sim, limpar</button>
              <button type="button" onClick={() => setConfirm(false)} className="rounded-md border border-border px-5 py-2.5 text-sm text-foreground transition hover:bg-secondary">Cancelar</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="rounded-md border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary">Limpar dados</button>
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
