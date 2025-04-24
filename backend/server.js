
import express from 'express';
import cors from 'cors';


const app = express();


const PORT = 3001;


app.use(cors());
app.use(express.json()); // Para parsear el cuerpo JSON

// === Rutas (Endpoints) ===

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola desde el backend MediSync!');
});

// --- RUTA PARA LOGIN (Versión con depuración) ---
// Endpoint para manejar el inicio de sesión (POST /api/login)
app.post('/api/login', (req, res) => {
  console.log('--- Login Request Start ---'); // Inicio de log
  console.log('Headers:', JSON.stringify(req.headers, null, 2)); // Muestra las cabeceras recibidas
  console.log('Raw Body Check (antes de desestructurar):', req.body); // Muestra el cuerpo antes de intentar usarlo

  //  por si  req.body es undefined
  if (!req.body) {
      console.error('¡ERROR! req.body está undefined aquí.');
      return res.status(500).json({ success: false, message: 'Error interno: req.body no está definido.' });
  }

  // 1. Extraer email y password del cuerpo de la solicitud
  const { email, password } = req.body; // Ahora esto debería funcionar si req.body existe

  
  if (!email || !password) {
    console.log('Error: Faltan credenciales');
    
    return res.status(400).json({
       success: false,
       message: 'Email y contraseña son requeridos'
      });
  }

  // CREDENCIALES
  const hardcodedEmail = 'test@example.com';
  const hardcodedPassword = 'password123';

  if (email === hardcodedEmail && password === hardcodedPassword) {
    // 4. Autenticación Exitosa
    console.log('Login exitoso para:', email);
    // 200 OK 
    return res.status(200).json({
       success: true,
       message: 'Login exitoso',
       user: { email: email, name: 'Usuario de Prueba' }
      });
  } else {
    // 5. Autenticación Fallida
    console.log('Login fallido para:', email);
    // 401 
    return res.status(401).json({
       success: false,
       message: 'Credenciales inválidas'
      });
  }
});



// === Iniciar el Servidor ===

app.listen(PORT, () => {
  console.log(`Servidor MediSync corriendo en http://localhost:${PORT}`);
});