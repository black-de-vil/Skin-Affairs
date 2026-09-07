import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js'
import { stripeWebhooks } from './controllers/webhooks.js'

const app = express()

// Stripe webhook needs the RAW body — must be registered BEFORE express.json()
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)

// Middleware
app.use(cors())
app.use(express.json())

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

startServer()