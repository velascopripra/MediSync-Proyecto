import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom'; // Necesario porque Register usa useNavigate
import Register from './Register';

// Mock de useNavigate ya que no podemos navegar en el entorno de prueba
// Si necesitas probar la navegación real, se requiere una configuración más compleja.
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // usa la implementación real para todo lo demás
  useNavigate: () => mockedNavigate,
}));

// Mock global para la función fetch (simplificado)
// Esto evita errores al intentar hacer llamadas reales durante la prueba.
// Para pruebas más robustas, se usarían librerías como 'jest-fetch-mock'.
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, message: 'Mocked success' }),
  })
);


describe('Register Component', () => {
  // Limpia los mocks antes de cada prueba
  beforeEach(() => {
    mockedNavigate.mockClear();
    global.fetch.mockClear();
  });

  test('renders registration form correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Verifica que los campos principales estén presentes
    expect(screen.getByPlaceholderText(/Nombre completo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Contraseña/i)).toBeInTheDocument(); // Usamos ^ para inicio de línea
    expect(screen.getByPlaceholderText(/Confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Pregunta de seguridad/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Respuesta de seguridad/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear cuenta/i })).toBeInTheDocument();
  });

  test('allows typing in form fields', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText(/Nombre completo/i);
    const usernameInput = screen.getByPlaceholderText(/Nombre de usuario/i);
    const emailInput = screen.getByPlaceholderText(/Correo electrónico/i);
    const passwordInput = screen.getByPlaceholderText(/^Contraseña/i);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(nameInput).toHaveValue('Test User');
    expect(usernameInput).toHaveValue('testuser');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  

 

  // Prueba básica de envío (asumiendo que fetch es mockeado a éxito)
  test('calls fetch on successful submit with valid data', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

     // Llenar todos los campos válidamente
    fireEvent.change(screen.getByPlaceholderText(/Nombre completo/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/Nombre de usuario/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/^Contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirmar contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/Pregunta de seguridad/i), { target: { value: 'Pet name?' } });
    fireEvent.change(screen.getByPlaceholderText(/Respuesta de seguridad/i), { target: { value: 'Fido' } });


    const submitButton = screen.getByRole('button', { name: /Crear cuenta/i });
    fireEvent.click(submitButton);

    // Espera a que se resuelva la promesa de fetch (gracias al mock global simple)
    // y verifica que fetch fue llamado
    await screen.findByText(/¡Registro exitoso!/i); // Espera el mensaje de éxito
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/register', // Verifica la URL
      expect.objectContaining({ // Verifica que sea un POST con el body correcto (simplificado)
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Test User',
          username: 'testuser',
          correo: 'test@example.com',
          password: 'password123',
          preguntaSeguridad: 'Pet name?',
          respuestaSeguridad: 'Fido',
        }),
      })
    );
  });

});