import { Request, Response } from "express";
import User from "../models/User";
import { checkPassword, hashPassword } from "../utils/auth";
import Token from "../models/Token"; 
import { generateToken } from "../utils/token"; 
import { AuthEmail } from "../emails/AuthEmail"; 
import { generateJWT } from "../utils/jwt";

export class AuthController {

  static createAccount = async (req: Request, res: Response) => {
    try {
        console.log("📩 Petición recibida en createAccount:", req.body); // <-- Ver si llega la petición

        const { password, email, name, rol } = req.body;

        // Prevenir usuarios duplicados
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log("⚠️ Usuario ya existe:", email);
            res.status(409).json({ error: "El usuario ya está registrado." });
            return;
        }

        // Crear un nuevo usuario
        const user = new User({
            email,
            password,
            name,
            rol,
            confirmed: false,
        });

        // Hash de la contraseña
        user.password = await hashPassword(password);

        // Generar token de confirmación
        const token = new Token({
            token: generateToken(),
            user: user._id,
        });

        // Guardar el usuario y el token en la base de datos
        const [savedUser, savedToken] = await Promise.all([user.save(), token.save()]);

        if (!savedUser || !savedToken) {
            throw new Error("Error al guardar el usuario o el token.");
        }

        console.log("✅ Usuario y token guardados correctamente.");

        // Enviar correo electrónico de confirmación
        await AuthEmail.sendConfirmationEmail({
            email: user.email,
            name: user.name,
            token: token.token,
        });

        console.log("📧 Correo de confirmación enviado a:", user.email);

        // Respuesta al cliente
        res.status(201).json({
            message: "Cuenta creada exitosamente. Revisa tu correo electrónico para confirmarla.",
        });

    } catch (error) {
        console.error("❌ Error en createAccount:", error);
        res.status(500).json({ error: "Hubo un error al crear la cuenta." });
    }
};


  static confirmAccount = async (req: Request, res: Response) =>{
    try {
        const { token } = req.body
        const tokenExist = await Token.findOne({token})
        if(!tokenExist) {
            const error = new Error('Token no válido')
            res.status(401).json({error: error.message})
            return
        }
        
        const user = await User.findById(tokenExist.user)
        user.confirmed = true
        
        await Promise.allSettled([user.save(), tokenExist.deleteOne()])
        res.send('Cuenta confirmada correctamente')

    } catch (error) {
        res.status(404).json({error: 'Hubo un error'})
    }
  }

  static login = async (req: Request, res: Response) =>{
    try {
        const {email, password} = req.body
        const user = await User.findOne({email})
        if(!user) {
            const error = new Error('Usuario no encontrado')
            res.status(404).json({error: error.message})
            return
        }
        
        if(!user.confirmed){
            const token = new Token()
            token.user = user.id
            token.token = generateToken()
            await token.save()

            //Enviar e-mail
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            const error = new Error('La cuenta no ha sido confirmada, hemos enviado un e-mail de confirmación')
            res.status(401).json({error: error.message})
            return
        }
        //Revisar password
        const isPasswordCorrect = await checkPassword(password, user.password)
        if(!isPasswordCorrect){
            const error = new Error('Contraseña incorrecta')
            res.status(401).json({error: error.message})
            return
        }
        const token = generateJWT({id: user.id})          
        res.send(token)
    } catch (error) {
        res.status(500).json({error: 'Hubo un error'})
    }
  }

  static requestConfirmationCode = async (req: Request, res: Response) =>{
    try {
        const { email } = req.body
        //Usuario exista
        const user = await User.findOne({email})
        if(!user){
            const error = new Error('El usuario no esta registrado')
             res.status(409).json({error: error.message})
             return
        }

        if(user.confirmed){
            const error = new Error('El usuario ya esta confirmado')
            res.status(403).json({error: error.message})
            return
        }

        //Generar token
        const token = new Token()
        token.token = generateToken()
        token.user = user.id

        //Enviar e-mail
        AuthEmail.sendConfirmationEmail({
            email: user.email,
            name: user.name,
            token: token.token
        })

        await Promise.allSettled([user.save(), token.save()])
        res.send('Se envió un nuevo token')
    } catch (error) {
        res.status(500).json({error: 'Hubo un error'})
    }
  }

  static forgotPassword = async (req: Request, res: Response) =>{
    try {
        const { email } = req.body
        //Usuario exista
        const user = await User.findOne({email})
        if(!user){
            const error = new Error('El usuario no esta registrado')
             res.status(409).json({error: error.message})
             return
        }


        //Generar token
        const token = new Token()
        token.token = generateToken()
        token.user = user.id
        await token.save()

        //Enviar e-mail
        AuthEmail.sendPasswordResetToken({
            email: user.email,
            name: user.name,
            token: token.token
        })
        res.send('Revisa tu mail para instrucciones')
    } catch (error) {
        res.status(500).json({error: 'Hubo un error'})
    }
  }

  static validateToken = async (req: Request, res: Response) =>{
    try {
        const { token } = req.body
        const tokenExist = await Token.findOne({token})
        if(!tokenExist) {
            const error = new Error('Token no válido')
            res.status(401).json({error: error.message})
            return
        }
        res.send('Token válido, ingresa tu nueva contraseña')

    } catch (error) {
        res.status(404).json({error: 'Hubo un error'})
    }
  }

  static updatePasswordWithToken = async (req: Request, res: Response) =>{
    try {
        const { token } = req.params
        const { password } = req.body
        const tokenExist = await Token.findOne({token})
        if(!tokenExist) {
            const error = new Error('Token no válido')
            res.status(401).json({error: error.message})
            return
        }
        const user = await User.findById(tokenExist.user)
        user.password = await hashPassword(password)

        await Promise.allSettled([user.save(), tokenExist.deleteOne()])

        res.send('El password se modificó correctamente')

    } catch (error) {
        res.status(404).json({error: 'Hubo un error'})
    }
}
}