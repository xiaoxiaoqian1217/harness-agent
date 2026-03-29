// Test setup file

// Set global test timeout
jest.setTimeout(30000);

// Suppress console warnings during tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = () => {};
  console.error = () => {};
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
