import mongoose, { Document, Schema } from 'mongoose';
import Usuario, { IUser } from './User';

export interface IJugador extends IUser {
  // Aquí puedes agregar campos específicos para jugadores
  nombre: string;
  posicion: string;
}

const JugadorSchema: Schema = new Schema({
  nombre: { 
    type: String, 
    required: true 
},
  posicion: { 
    type: String,
    required: true 
    }
});

export default Usuario.discriminator<IJugador>('Jugador', JugadorSchema);