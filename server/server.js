import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js'
import stripeWebhooks from './controllers/webhook.js';

const app = express()

/* ------------------------------------------------------------------ */
/*  CORS                                                               */
/*                                                                     */
/*  The client and the API are deployed separately, so the browser     */
/*  sends a cross-origin request for every call. Set ALLOWED_ORIGINS   */
/*  (comma-separated) or CLIENT_URL to lock this down in production;   */
/*  with neither set it stays open, which is what local dev wants.     */
/* ------------------------------------------------------------------ */

const normalise = (url) => url.trim().replace(/\/+$/, '')

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map(normalise)
    .filter(Boolean)

app.use(cors({
    origin(origin, callback) {
        // No Origin header: curl, server-to-server, and Stripe's webhook.
        if (!origin) return callback(null, true)
        if (!allowedOrigins.length) return callback(null, true)
        if (allowedOrigins.includes(normalise(origin))) return callback(null, true)
        // Always allow local dev hosts so a production CLIENT_URL doesn't
        // lock you out of your own machine.
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true)
        const error = new Error(`Origin ${origin} is not allowed by CORS`)
        error.status = 403
        return callback(error)
    },
    credentials: true,
}))

// Make sure the database is reachable before any route touches it. On a
// serverless host each cold start begins with no connection, so this can't
// live in a one-off startup function.
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (error) {
        console.error('Database unavailable:', error.message)
        res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again.' })
    }
})

// Stripe webhook needs the RAW body — must be registered BEFORE express.json()
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)

// 64mb limit so users can attach up to 5 photos (~8MB each) as base64 data
// URLs without the JSON body being rejected by the default 100kb cap.
// NOTE: serverless hosts cap request bodies far lower than this (Vercel is
// 4.5MB), so a long-running host is the better fit for photo uploads.
app.use(express.json({ limit: "64mb" }))

// Routes
app.get('/', (req, res) => res.send('Server is Live!'))
app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }))
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)

// Unknown API paths should say so in JSON rather than returning Express's
// HTML 404 page, which the client can't parse.
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }))

// Final error handler — without it a thrown error (an oversized upload, a
// rejected CORS origin) returns an HTML stack trace the client can't read.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    const status = error.status || (error.type === 'entity.too.large' ? 413 : 500)
    const message = error.type === 'entity.too.large'
        ? 'Those photos are too large to upload. Try fewer or smaller images.'
        : error.message || 'Something went wrong'
    console.error('Request failed:', message)
    res.status(status).json({ success: false, message })
})

const PORT = process.env.PORT || 3000

const startServer = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
    } catch (error) {
        // If the DB fails to connect, fail loudly and stop — don't let the
        // server start listening while it can't actually reach the database.
        console.error('Failed to start server:', error.message)
        process.exit(1)
    }
}

// Serverless platforms import this module and handle the listening socket
// themselves; only bind a port when running as a normal Node process.
if (!process.env.VERCEL) {
    startServer()
}

export default app
