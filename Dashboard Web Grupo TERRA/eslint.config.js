import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        google: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        requestAnimationFrame: 'readonly',
        TextDecoder: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        addEventListener: 'readonly',
        innerWidth: 'readonly',
        innerHeight: 'readonly',
        import: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // El Worker (worker/) corre en el runtime de Cloudflare Workers, no en el navegador:
    // tiene sus propios globals (Response, Request, fetch nativo sin polyfill, etc.).
    files: ['worker/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        fetch: 'readonly',
        console: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'legacy/', 'worker/.wrangler/', 'worker/node_modules/'],
  },
];
