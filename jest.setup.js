import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./src/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
    },
  },
  storage: {},
}));

// Mock window.ethereum
global.window.ethereum = {
  request: jest.fn(),
  isMetaMask: true,
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
