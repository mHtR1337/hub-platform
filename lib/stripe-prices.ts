const PLACEHOLDER_PATTERN = /_placeholder$/

export function isPlaceholderStripePrice(priceId: string): boolean {
  return PLACEHOLDER_PATTERN.test(priceId)
}

export function stripeCheckoutConfigError(priceId: string): string | null {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_")) {
    return "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local."
  }
  if (isPlaceholderStripePrice(priceId)) {
    return "Billing is not set up yet. Add Stripe Price IDs to .env.local and run pnpm db:seed."
  }
  return null
}
