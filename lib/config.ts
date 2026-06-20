import dotenv from "dotenv"
import path from "node:path"

// Load env before reading variables (Next.js, Prisma CLI, seed scripts).
dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const APP_ENVS = ["dev", "test", "prod"] as const
export type AppEnv = (typeof APP_ENVS)[number]

const PAYMENT_PROVIDERS = ["stripe", "paddle", "lemon_squeezy"] as const
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number]

/**
 * Supabase database password must use only alphanumeric characters.
 * Reset the password at Supabase Dashboard → Settings → Database → Reset password
 * if it contains $, &, #, or other special characters.
 */
const DB_PASSWORD_WARNING =
  "Supabase database password must use only alphanumeric characters. " +
  "Reset the password at Supabase Dashboard → Settings → Database → " +
  "Reset password if it contains $, &, #, or other special characters."

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

function parseAppEnv(): AppEnv {
  const raw = (
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.APP_ENV ??
    "dev"
  ).trim() as AppEnv

  if (!APP_ENVS.includes(raw)) {
    throw new Error(
      `NEXT_PUBLIC_APP_ENV must be one of: ${APP_ENVS.join(", ")} (got "${raw}")`,
    )
  }
  return raw
}

function parsePaymentProvider(): PaymentProvider {
  const raw = (process.env.PAYMENT_PROVIDER ?? "stripe").trim() as PaymentProvider
  if (!PAYMENT_PROVIDERS.includes(raw)) {
    throw new Error(
      `PAYMENT_PROVIDER must be one of: ${PAYMENT_PROVIDERS.join(", ")} (got "${raw}")`,
    )
  }
  return raw
}

/** Warn when a Postgres URL password likely contains unencoded special characters. */
function warnIfDatabasePasswordNeedsEncoding(url: string, varName: string): void {
  try {
    const parsed = new URL(url)
    const password = parsed.password
    if (!password) return

    const decoded = decodeURIComponent(password)
    if (/[^a-zA-Z0-9]/.test(decoded)) {
      console.warn(`[config] ${varName}: ${DB_PASSWORD_WARNING}`)
    }
  } catch {
    // Malformed URL — requireEnv / runtime connection will surface the error.
  }
}

function loadConfig() {
  const appEnv = parseAppEnv()
  const paymentProvider = parsePaymentProvider()

  const databaseUrl = requireEnv("DATABASE_URL")
  const directUrl = requireEnv("DIRECT_URL")

  warnIfDatabasePasswordNeedsEncoding(databaseUrl, "DATABASE_URL")
  warnIfDatabasePasswordNeedsEncoding(directUrl, "DIRECT_URL")

  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "")

  const clerk = {
    publishableKey: requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    secretKey: requireEnv("CLERK_SECRET_KEY"),
    webhookSecret: optionalEnv("CLERK_WEBHOOK_SECRET"),
    signInUrl: optionalEnv("NEXT_PUBLIC_CLERK_SIGN_IN_URL") ?? "/login",
    signUpUrl: optionalEnv("NEXT_PUBLIC_CLERK_SIGN_UP_URL") ?? "/signup",
    signInFallbackRedirectUrl:
      optionalEnv("NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL") ??
      "/dashboard",
    signUpFallbackRedirectUrl:
      optionalEnv("NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL") ??
      "/onboarding",
  }

  const stripe = {
    publishableKey: optionalEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    secretKey: optionalEnv("STRIPE_SECRET_KEY"),
    webhookSecret: optionalEnv("STRIPE_WEBHOOK_SECRET"),
    prices: {
      hrvMonitor: optionalEnv("STRIPE_PRICE_HRV_MONITOR"),
      combatTracker: optionalEnv("STRIPE_PRICE_COMBAT_TRACKER"),
      enduranceCalc: optionalEnv("STRIPE_PRICE_ENDURANCE_CALC"),
      bundle: optionalEnv("STRIPE_PRICE_BUNDLE"),
    },
  }

  const resend = {
    apiKey: optionalEnv("RESEND_API_KEY"),
  }

  const sentry = {
    dsn: optionalEnv("SENTRY_DSN"),
  }

  const adminSecret = optionalEnv("ADMIN_SECRET")

  return {
    appEnv,
    appUrl,
    nodeEnv: (process.env.NODE_ENV ?? "development") as
      | "development"
      | "production"
      | "test",
    isDev: appEnv === "dev",
    isTest: appEnv === "test",
    isProd: appEnv === "prod",
    paymentProvider,
    databaseUrl,
    directUrl,
    clerk,
    stripe,
    resend,
    sentry,
    adminSecret,
    dbPasswordWarning: DB_PASSWORD_WARNING,
  } as const
}

/** Validated application config — import this instead of using process.env directly. */
export const config = loadConfig()

export const { isDev, isTest, isProd, paymentProvider } = config
