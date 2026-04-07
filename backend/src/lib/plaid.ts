import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from 'plaid'

const plaidEnv = process.env.PLAID_ENV ?? 'sandbox'

const config = new Configuration({
  basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
      'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
    },
  },
})

export const plaidClient = new PlaidApi(config)

/**
 * Create a Link token to initialize the Plaid Link widget on the frontend.
 * The token is single-use and expires in 30 minutes.
 */
export async function createLinkToken(userId: string, clientName = 'Dwella') {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: clientName,
    products: [Products.Income],
    country_codes: [CountryCode.Us],
    language: 'en',
    income_verification: {
      income_source_types: ['bank', 'payroll'],
    },
  })
  return response.data
}

/**
 * Exchange a public_token (from Plaid Link onSuccess) for an access_token,
 * then immediately fetch the income verification report.
 *
 * IMPORTANT: The access_token grants read access to the user's bank account.
 * We exchange it once, pull the income report, then discard it.
 * We never store the access_token in the database.
 */
export async function getIncomeVerification(publicToken: string) {
  // Exchange public token
  const exchangeResponse = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  })
  const accessToken = exchangeResponse.data.access_token
  const itemId = exchangeResponse.data.item_id

  // Fetch income verification
  const incomeResponse = await plaidClient.incomeVerificationPaystubsGet({
    access_token: accessToken,
  })

  // Extract only the non-PII derived facts we need
  const paystubs = incomeResponse.data.paystubs ?? []
  const latestPaystub = paystubs[0]

  const result = {
    itemId,
    verified: paystubs.length > 0,
    employerName: latestPaystub?.employer?.name ?? null,
    // Annualized income derived from most recent paystub
    estimatedAnnualIncome: latestPaystub?.earnings?.total
      ? latestPaystub.earnings.total * 12
      : null,
    estimatedMonthlyIncome: latestPaystub?.earnings?.total ?? null,
    paystubCount: paystubs.length,
  }

  // Discard accessToken — never store it
  return result
}

/**
 * For payroll-based income (direct integration with employers like ADP, Gusto).
 * More reliable than bank-based — requires user to log in to their payroll portal.
 */
export async function createPayrollLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'Dwella',
    products: [Products.IncomeVerification],
    country_codes: [CountryCode.Us],
    language: 'en',
    income_verification: {
      income_source_types: ['payroll'],
      payroll_income: {
        flow_types: ['payroll_income_digital_payroll'],
      },
    },
  })
  return response.data
}
