/** Stub — implement when PAYMENT_PROVIDER=lemon_squeezy is enabled. */
export async function createCheckoutSession(): Promise<{ url: string }> {
  throw new Error(
    "Lemon Squeezy is not implemented yet. Set PAYMENT_PROVIDER=stripe to use Stripe.",
  )
}

export async function handleWebhook(): Promise<Response> {
  throw new Error(
    "Lemon Squeezy is not implemented yet. Set PAYMENT_PROVIDER=stripe to use Stripe.",
  )
}
