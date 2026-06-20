import { handlePaymentWebhook } from "@/lib/payments"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handlePaymentWebhook(request)
}
