/** @type {import('jest').Config} */
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  // Ensure babel-jest transpiles ESM dependencies from node_modules
  // that Jest (CJS) cannot parse natively.
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react|gsap|firebase)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.d.ts',
  ],
  // testRegex covers both __tests__ directories and *.test.{js,jsx} files
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  testPathIgnorePatterns: ['/node_modules/'],
  // Coverage threshold for Phase 0.5 baseline — 1% (realistic MVP)
  // Phase 1: raise to 5% | Phase 2: 10% | Phase 3: 25%
  // Note: statements/lines > 2%, branches ~1.4%, functions ~2.3%
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 2,
      lines: 2,
      statements: 2,
    },
  },
};
