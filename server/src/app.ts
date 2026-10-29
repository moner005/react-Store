import cors from 'cors'
import express from 'express'
import { config } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { healthRoutes } from './routes/healthRoutes.js'

export const app = express()
app.use(cors({ origin: config.clientOrigin }))
app.use(express.json())
app.use(healthRoutes)
app.use(notFound)
app.use(errorHandler)
