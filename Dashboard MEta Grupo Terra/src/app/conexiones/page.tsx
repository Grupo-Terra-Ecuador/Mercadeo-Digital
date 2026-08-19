import Link from "next/link";
import { CheckCircle2, AlertTriangle, Plug, Unplug, KeyRound } from "lucide-react";
import { isOAuthConfigured } from "@/lib/meta/config";
import { getAdAccounts, type MetaAdAccount } from "@/lib/meta/graph-client";
import { getActiveAccessToken } from "@/lib/meta/session";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";

const ACCOUNT_STATUS_LABELS: Record<number, string> = {
  1: "Activa",
  2: "Deshabilitada",
  3: "Pendiente de pago",
  7: "En revisión",
  9: "En período de gracia",
  100: "Pendiente de cierre",
  101: "Cerrada",
};

interface PageProps {
  searchParams: Promise<{ connected?: string; disconnected?: string; error?: string }>;
}

export default async function ConexionesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const active = await getActiveAccessToken();
  const oauthConfigured = isOAuthConfigured();

  let accounts: MetaAdAccount[] = [];
  let accountsError: string | null = null;
  if (active) {
    try {
      accounts = await getAdAccounts(active.token);
    } catch (err) {
      accountsError = err instanceof Error ? err.message : "No se pudieron obtener las cuentas publicitarias.";
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Conexiones"
        description="Administra la conexión con Meta for Developers y revisa qué cuentas publicitarias están disponibles."
      />

      {params.connected && (
        <Banner tone="success" icon={CheckCircle2} text="Conexión con Meta establecida correctamente." />
      )}
      {params.disconnected && <Banner tone="neutral" icon={Unplug} text="Se desconectó tu cuenta de Meta." />}
      {params.error && <Banner tone="error" icon={AlertTriangle} text={decodeURIComponent(params.error)} />}

      {!active ? (
        <>
          <ChartCard title="Opción recomendada: Token de Usuario del Sistema" subtitle="Permanente, no requiere iniciar sesión cada vez">
            <p className="text-[13px] leading-relaxed text-muted">
              Genera un token desde el Administrador Comercial (Business Manager) de la cuenta que quieras conectar
              y pégalo en <code className="rounded bg-surface-2 px-1.5 py-0.5 text-accent-2">.env.local</code> como{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 text-accent-2">META_SYSTEM_USER_TOKEN</code>, luego
              reinicia el servidor.
            </p>
          </ChartCard>

          {oauthConfigured && (
            <ChartCard title="Alternativa: iniciar sesión con Meta" subtitle="Requiere reconectar cada ~60 días">
              <p className="mb-4 text-[13px] leading-relaxed text-muted">
                Al hacer clic se abre la pantalla oficial de inicio de sesión de Meta. Ahí eliges tu cuenta y
                autorizas el acceso de solo lectura (<span className="text-text font-semibold">ads_read</span>).
                Este dashboard nunca ve tu contraseña de Facebook.
              </p>
              <Link
                href="/api/auth/meta/login"
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-accent bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-2"
              >
                <Plug size={15} />
                Conectar con Meta
              </Link>
            </ChartCard>
          )}
        </>
      ) : (
        <>
          <Banner
            tone="success"
            icon={KeyRound}
            text={
              active.source === "system_user"
                ? "Conectado mediante Token de Usuario del Sistema (permanente)."
                : "Conectado mediante sesión de Meta (expira periódicamente)."
            }
          />

          {accountsError ? (
            <ChartCard title="No se pudo leer tus cuentas" subtitle="El token puede haber expirado o perdido permisos">
              <p className="text-[13px] leading-relaxed text-muted">{accountsError}</p>
            </ChartCard>
          ) : (
            <ChartCard
              title={`${accounts.length} cuenta${accounts.length === 1 ? "" : "s"} publicitaria${accounts.length === 1 ? "" : "s"} disponible${accounts.length === 1 ? "" : "s"}`}
              subtitle="Estas son las cuentas de Meta a las que tiene acceso el token conectado"
            >
              {accounts.length === 0 ? (
                <p className="text-[13px] text-muted">
                  Este token no tiene acceso a ninguna cuenta publicitaria todavía. Revisa en el Administrador
                  Comercial que se le haya asignado la cuenta correspondiente.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border bg-surface-2 px-3.5 py-3"
                    >
                      <div>
                        <div className="text-[13px] font-bold text-text">{account.name}</div>
                        <div className="text-[11px] text-muted-2">
                          {account.id} · {account.businessName ?? "Sin business manager"} · {account.currency}
                        </div>
                      </div>
                      <span className="rounded-full border border-border-2 bg-surface-3 px-2.5 py-1 text-[10.5px] font-bold text-muted">
                        {ACCOUNT_STATUS_LABELS[account.accountStatus] ?? `Estado ${account.accountStatus}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          )}

          <ChartCard title="Próximo paso" subtitle="Qué falta para ver datos reales en el dashboard">
            <p className="text-[13px] leading-relaxed text-muted">
              La conexión ya funciona: el dashboard puede leer tus cuentas publicitarias reales. Los 6 módulos
              (Resumen ejecutivo, Campañas, Marcas, Creativos, Audiencias, Análisis comparativo) todavía muestran{" "}
              <span className="text-text font-semibold">datos de ejemplo</span> — el siguiente paso es reemplazar
              esos datos simulados por las métricas reales de la cuenta que elijas.
            </p>
          </ChartCard>

          {active.source === "oauth" && (
            <form action="/api/auth/meta/logout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-border-2 bg-surface-2 px-4 py-2.5 text-sm font-bold text-muted transition hover:text-text"
              >
                <Unplug size={15} />
                Desconectar cuenta de Meta
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  text,
}: {
  tone: "success" | "error" | "neutral";
  icon: typeof CheckCircle2;
  text: string;
}) {
  const styles = {
    success: "border-green/30 bg-green/10 text-green",
    error: "border-red/30 bg-red/10 text-red",
    neutral: "border-border-2 bg-surface-2 text-muted",
  }[tone];

  return (
    <div className={`flex items-center gap-2 rounded-[12px] border px-3.5 py-2.5 text-[12.5px] font-semibold ${styles}`}>
      <Icon size={15} />
      {text}
    </div>
  );
}
