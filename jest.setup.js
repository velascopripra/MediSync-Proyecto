// jest.setup.cjs

// Importa los matchers de jest-dom (ej. toBeInTheDocument)
import '@testing-library/jest-dom';

// --- Polyfill para TextEncoder y TextDecoder ---
// Añade TextEncoder y TextDecoder al scope global para el entorno de prueba JSDOM,
// ya que algunas librerías (como react-router v6+) pueden depender de ellas.
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
// --- Fin del Polyfill ---

// Aquí puedes añadir otros mocks globales si los necesitas en el futuro
// global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));
