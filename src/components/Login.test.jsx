import React from 'react';
// Import necessary functions from React Testing Library
// Añadimos fireEvent para simular interacciones
import { render, screen, fireEvent } from '@testing-library/react';
// Import the component to test
import Login from './Login';
// Import jest-dom matchers like toBeInTheDocument
import '@testing-library/jest-dom';
// We need to mock react-router-dom hooks like useNavigate
import { MemoryRouter } from 'react-router-dom'; // Use MemoryRouter for components using react-router hooks


// Describe block groups related tests for the Login component
describe('Login Component', () => {


  // Test case 1: Check if the component renders the main title
  test('renders login title', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const titleElement = screen.getByRole('heading', { name: /¡Bienveni@!/i });
    expect(titleElement).toBeInTheDocument();
  });

  // Test case 2: Check if email/username input field is present
  test('renders identifier input field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const identifierInput = screen.getByPlaceholderText(/Correo electrónico o nombre de usuario/i);
    expect(identifierInput).toBeInTheDocument();
    expect(identifierInput).toHaveAttribute('type', 'text');
  });

   // Test case 3: Check if password input field is present
   test('renders password input field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password'); // Initially it's password type
  });

  // Test case 4: Check if the login button is present
  test('renders login button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const loginButton = screen.getByRole('button', { name: /Iniciar sesión/i });
    expect(loginButton).toBeInTheDocument();
  });

  // --- NUEVAS PRUEBAS ---

  // Test case 5: Allows user to type in identifier field
  test('allows typing in identifier field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const identifierInput = screen.getByPlaceholderText(/Correo electrónico o nombre de usuario/i);
    // Simula el evento 'change' como si el usuario escribiera
    fireEvent.change(identifierInput, { target: { value: 'testuser' } });
    // Verifica que el valor del input se haya actualizado
    expect(identifierInput).toHaveValue('testuser');
  });

  // Test case 6: Allows user to type in password field
  test('allows typing in password field', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  // Test case 7: Toggles password visibility on eye icon click
  test('toggles password visibility', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const passwordInput = screen.getByPlaceholderText(/Contraseña/i);
    // El botón/span que contiene el icono no tiene texto visible,
    // necesitamos una forma de seleccionarlo. Si el span tiene un 'role' o 'aria-label', úsalo.
    // Si no, podemos buscar el SVG directamente o añadir un 'data-testid' al span en Login.jsx
    // Asumiendo que el span es el único elemento con la clase 'toggle-password':
    // NOTA: Buscar por clase no es la forma preferida por RTL, pero puede funcionar.
    // Una mejor opción sería añadir data-testid="toggle-password-visibility" al span en Login.jsx
    // y usar screen.getByTestId('toggle-password-visibility')
    const toggleButton = passwordInput.nextSibling; // Intenta seleccionar el span hermano del input

    // Verifica que el input sea tipo 'password' inicialmente
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Simula clic en el botón/span del ojo
    fireEvent.click(toggleButton);

    // Verifica que el tipo del input haya cambiado a 'text'
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Simula otro clic para volver a ocultar
    fireEvent.click(toggleButton);

    // Verifica que el tipo del input sea 'password' nuevamente
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // --- FIN NUEVAS PRUEBAS ---

});
