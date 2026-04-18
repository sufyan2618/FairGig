import express from 'express'
import cors from 'cors'
const app = express()
import type { Request, Response } from 'express'
import { Router } from 'express'

import { db } from './lib/db.js'
import productRouter from './routers/productRouter.js'

import cookieParser from 'cookie-parser'

// Enable CORS for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const router = Router()

router.get("/health", (req: Request, res: Response) => {
    res.status(200).send("Health point. The server is running correctly")
})

app.use('/api', router)
app.use('/api', productRouter)
app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});




