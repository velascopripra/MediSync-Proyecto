    // babel.config.js
    module.exports = {
        presets: [
          // Transpila JavaScript moderno para compatibilidad
          ['@babel/preset-env', { targets: { node: 'current' } }],
          // Transpila JSX y funcionalidades de React
          // 'automatic' evita tener que importar React en cada archivo
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      };
      