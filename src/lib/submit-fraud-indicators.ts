const API_ENDPOINT = import.meta.env["VITE_API_ENDPOINT"] as string | undefined;

export type FraudIndicatorsPayload = {
  submissionId: string;
  instituicao: string;
  mesReferencia: string;
  casosFraudulentos: number;
  carteiraAtiva: number;
  transacoesFraudulentas: number;
  tipoFraude: string;
  totalTransacoes: number;
};

export async function submitFraudIndicators(payload: FraudIndicatorsPayload): Promise<void> {
  if (!API_ENDPOINT) throw new Error("endpoint_not_configured");
  // text/plain avoids a CORS preflight, which Apps Script Web Apps do not answer.
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
  if (!data?.success) throw new Error("rejected");
}
