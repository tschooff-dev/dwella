import Stripe from 'stripe'

// Placeholder: replace STRIPE_SECRET_KEY in .env with your actual key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
  typescript: true,
})

/**
 * Create a Stripe Connect account for a landlord.
 * Call this when a landlord signs up and wants to accept payments.
 */
export async function createConnectAccount(email: string) {
  return stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}

/**
 * Create an onboarding link for a landlord's Connect account.
 */
export async function createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
  return stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })
}

/**
 * Create a payment intent for a tenant rent payment.
 */
export async function createPaymentIntent(
  amount: number, // in cents
  currency: string = 'usd',
  landlordStripeAccountId: string,
  metadata: Record<string, string> = {}
) {
  return stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ['card'],
    transfer_data: {
      destination: landlordStripeAccountId,
    },
    metadata,
  })
}
