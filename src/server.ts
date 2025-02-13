import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan'
import { connectDB } from './config/db';
import cors from 'cors';
import authRoutes from './routes/authRoutes'; // Importamos las rutas de autenticación
import { corsConfig } from './config/cors';

dotenv.config();

connectDB();

// Inicia aplicación
const app = express();

// Middlewares
app.use(cors(corsConfig));

//Loggin
app.use(morgan('dev'))

app.use(express.json()); // Para parsear el cuerpo de las solicitudes JSON

// Rutas
app.use('/api/auth', authRoutes); // Usamos las rutas de autenticación

export default app;