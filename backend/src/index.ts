import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { propertiesRouter } from './routes/properties'
import { portfoliosRouter } from './routes/portfolios'
import { unitsRouter } from './routes/units'
import { tenantsRouter } from './routes/tenants'
import { paymentsRouter } from './routes/payments'
import { applicationsRouter } from './routes/applications'
import { leasesRouter } from './routes/leases'
import { plaidRouter } from './routes/plaid'
import { identityRouter } from './routes/identity'
import { documentsRouter } from './routes/documents'
import { webhooksRouter } from './routes/webhooks'
import { usersRouter } from './routes/users'
import { tenantRouter } from './routes/tenant'
import { messagesRouter } from './routes/messages'
import { invitesRouter } from './routes/invites'
import { maintenanceRouter } from './routes/maintenance'
import { settingsRouter } from './routes/settings'
import { connectRouter } from './routes/connect'
import { cronRouter } from './routes/cron'

const app = express()
const PORT = process.env.PORT ?? 3001

const allowedOrigins = new Set([
  process.env.FRONTEND_URL ?? 'http://localhost:5173',
  'http://localhost:5173',
  'https://zenantapp.com',
  'https://www.zenantapp.com',
])

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// Stripe and Clerk webhooks both require raw body for signature verification —
// must be registered BEFORE express.json()
const rawBody = express.raw({ type: 'application/json' })

app.post('/api/webhooks/stripe', rawBody, (req, res, next) => {
  webhooksRouter(req, res, next)
})

app.post('/api/webhooks/clerk', rawBody, (req, res, next) => {
  webhooksRouter(req, res, next)
})

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dwella-api', timestamp: new Date().toISOString() })
})

// Core API routes
app.use('/api/properties', propertiesRouter)
app.use('/api/portfolios', portfoliosRouter)
app.use('/api/units', unitsRouter)
app.use('/api/tenants', tenantsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/applications', applicationsRouter)
app.use('/api/leases', leasesRouter)
app.use('/api/users', usersRouter)

// Tenant & messaging routes
app.use('/api/tenant', tenantRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/maintenance', maintenanceRouter)

// Verification & document routes
app.use('/api/plaid', plaidRouter)
app.use('/api/identity', identityRouter)
app.use('/api/documents', documentsRouter)

// Tenant invites (public GET, auth POST)
app.use('/api/invites', invitesRouter)

// Landlord settings
app.use('/api/settings', settingsRouter)

// Stripe Connect
app.use('/api/connect', connectRouter)

// Cron jobs
app.use('/api/cron', cronRouter)

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
