import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { propertiesRouter } from './routes/properties'
import { unitsRouter } from './routes/units'
import { tenantsRouter } from './routes/tenants'
import { paymentsRouter } from './routes/payments'
import { applicationsRouter } from './routes/applications'

const app = express()
const PORT = process.env.PORT ?? 3001

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dwella-api', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/properties', propertiesRouter)
app.use('/api/units', unitsRouter)
app.use('/api/tenants', tenantsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/applications', applicationsRouter)

// 404 handler
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
