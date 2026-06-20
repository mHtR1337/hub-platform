import { config } from "@/lib/config"
import * as lemonSqueezy from "@/lib/payments/lemon-squeezy"
import * as paddle from "@/lib/payments/paddle"
import {
  createCheckoutSession as stripeCreateCheckoutSession,
  handleWebhook as stripeHandleWebhook,
  type CheckoutSessionParams,
} from "@/lib/stripe"

export type { CheckoutSessionParams }

/**
 * Create a hosted checkout session for the active payment provider.
 * Switch providers via PAYMENT_PROVIDER env var — no route changes required.
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams,
): Promise<{ url: string }> {
  switch (config.paymentProvider) {
    case "stripe":
      return stripeCreateCheckoutSession(params)
    case "paddle":
      return paddle.createCheckoutSession()
    case "lemon_squeezy":
      return lemonSqueezy.createCheckoutSession()
    default: {
      const _exhaustive: never = config.paymentProvider
      throw new Error(`Unsupported payment provider: ${_exhaustive}`)
    }
  }
}

/** Verify and process a payment provider webhook. */
export async function handlePaymentWebhook(
  request: Request,
): Promise<Response> {
  switch (config.paymentProvider) {
    case "stripe":
      return stripeHandleWebhook(request)
    case "paddle":
      return paddle.handleWebhook()
    case "lemon_squeezy":
      return lemonSqueezy.handleWebhook()
    default: {
      const _exhaustive: never = config.paymentProvider
      throw new Error(`Unsupported payment provider: ${_exhaustive}`)
    }
  }
}
