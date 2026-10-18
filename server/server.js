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

// Stripe webhook needs the RAW body — must be registered BEFORE express.json()
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)

// Middleware
app.use(cors())
// 64mb limit so users can attach up to 5 photos (~8MB each) as base64 data
// URLs without the JSON body being rejected by the default 100kb cap.
app.use(express.json({ limit: "64mb" }))

// Routes
app.get('/', (req, res) => res.send('Server is Live!'))
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)

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
// at the bottom
if (process.env.NODE_ENV !== "production") {
  app.listen(process.env.PORT || 3000, () => console.log("Server running"));
}
export default app;

startServer()