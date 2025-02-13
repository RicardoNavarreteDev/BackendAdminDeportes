import mongoose from "mongoose";
import colors from "colors";
import { exit } from 'node:process';
import { log } from "node:console";

export const connectDB = async () => {
    try {
        const {connection} = await mongoose.connect(process.env.DATABASE_URL)
        const url = `${connection.host}:${connection.port}`
        console.log(colors.blue.bold(`MongoDB conectado: ${url}`));
        
    } catch (error) {
        console.log(error.message);
        log(colors.red.bold('Error de conexion a la base de datos'));
        exit(1)
    }
}