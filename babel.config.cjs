/**
 * Babel configuration for Jest (CJS format, required alongside ESM package.json).
 *
 * Vite handles transpilation in production via its own pipeline; this file is
 * used exclusively by Jest (babel-jest transformer) to compile JSX and modern
 * JS syntax in the test environment.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
