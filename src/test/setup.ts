import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeAll, afterAll } from 'vitest'

// Mock environment variables
vi.mock('../config/env', () => ({
  API_ENDPOINTS: {
    BASE_URL: 'http://localhost:3001/api',
    JOBS: 'http://localhost:3001/api/jobs',
    CANDIDATES: 'http://localhost:3001/api/candidates',
    AUTH: 'http://localhost:3001/api/auth',
    ADMIN_OVERVIEW: 'http://localhost:3001/api/admin/analytics/overview',
    ADMIN_USER_GROWTH: 'http://localhost:3001/api/admin/analytics/user-growth',
    ADMIN_USERS: 'http://localhost:3001/api/admin/users'
  },
  config: {
    API_URL: 'http://localhost:3001/api',
    IS_DEVELOPMENT: true,
    IS_PRODUCTION: false
  }
}))

// Mock enhanced API fetch
vi.mock('../api/enhancedApiFetch', () => ({
  apiFetch: vi.fn(() => 
    Promise.resolve(new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }))
  ),
  apiRequest: vi.fn(() => 
    Promise.resolve({ success: true, data: {}, error: undefined })
  )
}))

// Mock backend monitor
vi.mock('../utils/backendMonitor', () => ({
  backendMonitor: {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    checkHealth: vi.fn(() => Promise.resolve({
      isHealthy: true,
      status: 'healthy',
      services: { api: true, database: true, auth: true },
      responseTime: 100,
      lastChecked: new Date()
    })),
    onStatusChange: vi.fn(),
    getLastStatus: vi.fn(() => null)
  },
  useBackendStatus: () => ({
    status: {
      isHealthy: true,
      status: 'healthy',
      services: { api: true, database: true, auth: true },
      responseTime: 100,
      lastChecked: new Date()
    },
    isLoading: false,
    checkNow: vi.fn(),
    isHealthy: true,
    isDown: false,
    isDegraded: false
  }),
  BackendStatusIndicator: ({ className }: { className?: string }) => 
    React.createElement('div', { className, 'data-testid': 'backend-status' }, 'Healthy')
}))

// Mock error handlers
vi.mock('../utils/enhancedErrorHandler', () => ({
  handleApiError: vi.fn((error) => ({
    isBackendDown: false,
    isNetworkError: false,
    isServerError: false,
    isClientError: false,
    message: error?.message || 'Test error',
    shouldRetry: false
  })),
  withErrorHandling: vi.fn(async (apiCall, fallback) => {
    try {
      return await apiCall()
    } catch {
      return fallback
    }
  }),
  setupGlobalErrorHandler: vi.fn()
}))

// Enhanced localStorage mock with proper Storage interface
const createStorageMock = (): Storage => {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(store).length
    }
  }
}

// Mock storage objects
const localStorageMock = createStorageMock()
const sessionStorageMock = createStorageMock()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
})

// Enhanced fetch mock with error handling
const createFetchMock = () => {
  return vi.fn((url: string, options?: RequestInit) => {
    // Simulate different responses based on URL
    if (url.includes('/health')) {
      return Promise.resolve(new Response(JSON.stringify({
        status: 'healthy',
        services: { api: true, database: true, auth: true }
      }), { status: 200 }))
    }
    
    if (url.includes('/admin')) {
      return Promise.resolve(new Response(JSON.stringify({
        users: { total: 100, totalCandidates: 60, totalEmployers: 40 },
        jobs: { total: 50, active: 45, pending: 5 },
        applications: { total: 200 }
      }), { status: 200 }))
    }

    // Default successful response
    return Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: {}
    }), { status: 200 }))
  })
}

global.fetch = createFetchMock()

// Mock window methods
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  
  // Clear storage
  localStorageMock.clear()
  sessionStorageMock.clear()
  
  // Reset fetch mock
  global.fetch = createFetchMock()
})

// Global test utilities
export const testUtils = {
  // Mock successful API response
  mockApiSuccess: (data: any) => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(data), { status: 200 }))
    )
  },
  
  // Mock API error
  mockApiError: (status: number = 500, message: string = 'Server Error') => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ error: message }), { status }))
    )
  },
  
  // Mock network error
  mockNetworkError: () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network request failed'))
    )
  },
  
  // Wait for async operations
  waitFor: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms))
}