# Unit Tests for Client Management System

This directory contains comprehensive unit tests for the client-mgmt application, covering all major functionality areas.

## Test Structure

### Test Files

- **`login.test.tsx`** - Google OAuth login functionality
- **`dashboard.test.tsx`** - Dashboard components and stats display
- **`clients.test.tsx`** - Client CRUD operations (Create, Read, Update, Delete)
- **`templates.test.tsx`** - Email template CRUD operations
- **`emails.test.tsx`** - Email sending functionality with template support
- **`calendar.test.tsx`** - Google Calendar events display and filtering

### Testing Framework Setup

The project uses:
- **Vitest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **User Event** - Advanced user interaction simulation
- **Jest DOM** - Custom DOM matchers

## Test Coverage Areas

### 1. Google Login (`login.test.tsx`)
- ✅ Login form rendering
- ✅ OAuth flow initiation
- ✅ Loading states during authentication
- ✅ Error handling (OAuth errors, network errors)
- ✅ Correct OAuth parameters and scopes
- ✅ Edge cases (missing window origin)

### 2. Dashboard (`dashboard.test.tsx`)
- ✅ Dashboard stats display
- ✅ User data integration
- ✅ Quick actions section
- ✅ Service error handling
- ✅ Navigation links validation

### 3. Clients CRUD (`clients.test.tsx`)
- ✅ Client list display
- ✅ Loading and empty states
- ✅ Create client with validation
- ✅ Update client functionality
- ✅ Delete client operations
- ✅ Error handling for all operations
- ✅ Form validation and user feedback

### 4. Templates CRUD (`templates.test.tsx`)
- ✅ Template list display
- ✅ Create template with placeholders
- ✅ Update template functionality
- ✅ Delete template operations
- ✅ Form validation and clearing
- ✅ Placeholder hints and guidance

### 5. Email Sending (`emails.test.tsx`)
- ✅ Email composition form
- ✅ Client selection (individual and bulk)
- ✅ Template selection and application
- ✅ Placeholder replacement in preview
- ✅ Email sending with results
- ✅ Partial success handling
- ✅ Form validation and button states

### 6. Calendar Events (`calendar.test.tsx`)
- ✅ Calendar events display
- ✅ Date filtering (today, week, month, custom)
- ✅ Refresh functionality
- ✅ Loading and error states
- ✅ Event formatting and edge cases
- ✅ API request parameters

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Features

### Mocking Strategy
- **Supabase client** mocked for authentication
- **Fetch API** mocked for HTTP requests
- **React Query** mocked for data fetching
- **Date objects** mocked for consistent testing
- **Window.location** mocked for OAuth redirects

### Test Utilities
- Custom query client for isolated tests
- Helper functions for rendering with providers
- Comprehensive mock data for all entities
- Error simulation for robust testing

### Coverage Goals
- **70% minimum coverage** across all metrics
- **Branch coverage** for conditional logic
- **Function coverage** for all methods
- **Line coverage** for comprehensive testing

## Best Practices Implemented

1. **User-centric testing** - Tests focus on user interactions and outcomes
2. **Accessibility testing** - Semantic HTML and ARIA attributes validated
3. **Error boundary testing** - Graceful error handling verified
4. **Loading states** - All loading conditions tested
5. **Form validation** - Input validation and error messages tested
6. **Async operations** - Proper async/await patterns used
7. **Mock isolation** - Each test has isolated mocks
8. **Cleanup** - Proper test cleanup and restoration

## Test Data

Comprehensive mock data includes:
- Multiple clients with varying properties
- Email templates with placeholders
- Calendar events with different formats
- API response structures
- Error scenarios

This test suite provides confidence in the application's functionality and helps prevent regressions during development.
