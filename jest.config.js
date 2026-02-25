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
  // Coverage threshold lowered for Phase 0 baseline — target is 10% (up from ~2%)
  // Raise thresholds progressively as more tests are added in later phases.
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
};
