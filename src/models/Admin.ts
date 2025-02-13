import mongoose, { Document, Schema } from 'mongoose';
import Usuario, { IUser } from './User';

export interface IAdministrador extends IUser {
  // Aquí puedes agregar campos específicos para administradores
  nombre: string;
}

const AdministradorSchema: Schema = new Schema({
  nombre: { 
    type: String, 
    required: true 
}
});

export default Usuario.discriminator<IAdministrador>('Administrador', AdministradorSchema);