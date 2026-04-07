import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { propertiesRouter } from './routes/properties'
import { unitsRouter } from './routes/units'
import { tenantsRouter } from './routes/tenants'
import { paymentsRouter } from './routes/payments'
import { applicationsRouter } from './routes/applications'
import { plaidRouter } from './routes/plaid'
import { identityRouter } from './routes/identity'
import { documentsRouter } from './routes/documents'
import { webhooksRouter } from './routes/webhooks'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))

// Stripe webhooks require the raw body for signature verification —
// must be registered BEFORE express.json()
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Route to webhooks router after raw body is captured
    webhooksRouter(req, res, next)
  }
)

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dwella-api', timestamp: new Date().toISOString() })
})

// Core API routes
app.use('/api/properties', propertiesRouter)
app.use('/api/units', unitsRouter)
app.use('/api/tenants', tenantsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/applications', applicationsRouter)

// Verification & document routes
app.use('/api/plaid', plaidRouter)
app.use('/api/identity', identityRouter)
app.use('/api/documents', documentsRouter)

// Remaining webhooks (Clerk, etc.) — JSON body
app.use('/api/webhooks', webhooksRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

app.listen(PORT, () => {
  console.log(`Dwella API running on http://localhost:${PORT}`)
})

export default app
