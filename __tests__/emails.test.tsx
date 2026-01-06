import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import EmailsPage from '@/app/dashboard/emails/page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/dashboard-layout'
import { applyPlaceholders } from '@/lib/email/placeholders'

// Mock DashboardLayout
vi.mock('@/components/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}))

// Mock applyPlaceholders
vi.mock('@/lib/email/placeholders', () => ({
  applyPlaceholders: vi.fn((str: string, vars: any) => 
    str.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] || match)
  ),
}))

// Mock fetch
global.fetch = vi.fn()

const mockFetch = fetch as ReturnType<typeof vi.fn>
const mockApplyPlaceholders = applyPlaceholders as ReturnType<typeof vi.fn>

// Test data
const mockClients = [
  {
    id: '1',
    user_id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    notes: 'Test client',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user123',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: null,
    notes: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

const mockTemplates = [
  {
    id: '1',
    user_id: 'user123',
    name: 'Welcome Template',
    subject: 'Welcome {{client_name}}',
    body: 'Hello {{client_name}}, welcome!',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('EmailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date
    vi.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01T00:00:00Z').getTime())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Email Composition', () => {
    it('renders email composition form correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTemplates }),
        } as Response)

      renderWithClient(<EmailsPage />)

      expect(screen.getByText('Send Emails')).toBeInTheDocument()
      expect(screen.getByText('Recipients')).toBeInTheDocument()
      expect(screen.getByText('Compose')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Subject')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Message body')).toBeInTheDocument()
      })
    })

    it('shows loading state for clients', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      renderWithClient(<EmailsPage />)

      expect(screen.getByText('Loading clients…')).toBeInTheDocument()
    })

    it('shows no clients state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('No clients.')).toBeInTheDocument()
      })
    })
  })

  describe('Client Selection', () => {
    it('selects and deselects clients', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Initially no clients selected
      expect(screen.getByText('0 selected')).toBeInTheDocument()

      // Select first client
      const checkboxes = screen.getAllByRole('checkbox')
      await userEvent.click(checkboxes[0])

      expect(screen.getByText('1 selected')).toBeInTheDocument()

      // Select all clients
      const selectAllButton = screen.getByText('Select all')
      await userEvent.click(selectAllButton)

      expect(screen.getByText('2 selected')).toBeInTheDocument()

      // Unselect all
      await userEvent.click(screen.getByText('Unselect all'))

      expect(screen.getByText('0 selected')).toBeInTheDocument()
    })

    it('shows correct selected count', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole('checkbox')

      // Select both clients
      await userEvent.click(checkboxes[0])
      await userEvent.click(checkboxes[1])

      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })
  })

  describe('Email Sending', () => {
    it('sends emails successfully', async () => {
      const mockSendResult = {
        sent: 2,
        total: 2,
        results: [
          { email: 'john@example.com', success: true },
          { email: 'jane@example.com', success: true },
        ],
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSendResult }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select clients
      const checkboxes = screen.getAllByRole('checkbox')
      await userEvent.click(checkboxes[0])
      await userEvent.click(checkboxes[1])

      // Fill email form
      const subjectInput = screen.getByPlaceholderText('Subject')
      const bodyTextarea = screen.getByPlaceholderText('Message body')
      
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, 'Test Subject')
      await userEvent.clear(bodyTextarea)
      await userEvent.type(bodyTextarea, 'Test body')

      // Send email
      const sendButton = screen.getByText('Send')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test Subject'),
        })
      })

      await waitFor(() => {
        expect(screen.getByText('Sent 2/2')).toBeInTheDocument()
      })
    })

    it('shows error when send fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Send failed' }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select client and fill form
      const checkboxes = screen.getAllByRole('checkbox')
      await userEvent.click(checkboxes[0])

      const subjectInput = screen.getByPlaceholderText('Subject')
      const bodyTextarea = screen.getByPlaceholderText('Message body')
      
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, 'Test Subject')
      await userEvent.clear(bodyTextarea)
      await userEvent.type(bodyTextarea, 'Test body')

      const sendButton = screen.getByText('Send')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Send failed')).toBeInTheDocument()
      })
    })

    it('disables send button when form is invalid', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const sendButton = screen.getByText('Send')
      
      // Should be disabled when no recipients selected
      expect(sendButton).toBeDisabled()

      // Select client
      const checkboxes = screen.getAllByRole('checkbox')
      await userEvent.click(checkboxes[0])

      // Still disabled because subject and body are empty
      expect(sendButton).toBeDisabled()

      // Fill subject
      const subjectInput = screen.getByPlaceholderText('Subject')
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, 'Test Subject')

      // Still disabled because body is empty
      expect(sendButton).toBeDisabled()

      // Fill body
      const bodyTextarea = screen.getByPlaceholderText('Message body')
      await userEvent.clear(bodyTextarea)
      await userEvent.type(bodyTextarea, 'Test body')

      // Now enabled
      expect(sendButton).not.toBeDisabled()
    })
  })

  describe('Preview', () => {
    it('shows email preview', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select clients
      const checkboxes = screen.getAllByRole('checkbox')
      await userEvent.click(checkboxes[0])
      await userEvent.click(checkboxes[1])

      // Fill email form
      const subjectInput = screen.getByPlaceholderText('Subject')
      const bodyTextarea = screen.getByPlaceholderText('Message body')
      
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, 'Hello {{client_name}}')
      await userEvent.clear(bodyTextarea)
      await userEvent.type(bodyTextarea, 'Welcome {{client_name}}!')

      // Show preview
      const previewButton = screen.getByText('Show preview')
      await userEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText('Preview')).toBeInTheDocument()
        expect(screen.getByText('To: john@example.com, jane@example.com')).toBeInTheDocument()
        expect(screen.getByText('Preview for john@example.com')).toBeInTheDocument()
        expect(screen.getByText('Preview for jane@example.com')).toBeInTheDocument()
      })
    })

    it('hides preview when toggled', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('Show preview')).toBeInTheDocument()
      })

      const previewButton = screen.getByText('Show preview')
      await userEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByText('Hide preview')).toBeInTheDocument()
        expect(screen.getByText('Preview')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('Hide preview'))

      await waitFor(() => {
        expect(screen.queryByText('Preview')).not.toBeInTheDocument()
        expect(screen.getByText('Show preview')).toBeInTheDocument()
      })
    })
  })

  describe('Send Results', () => {
    it('shows partial success results', async () => {
      const mockSendResult = {
        sent: 1,
        total: 2,
        results: [
          { email: 'john@example.com', success: true },
          { email: 'jane@example.com', success: false, error: 'SMTP error' },
        ],
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockSendResult }),
        } as Response)

      renderWithClient(<EmailsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Select clients and send
      const checkboxes = screen.getAllByRole('checkbox')
      await userEvent.click(checkboxes[0])
      await userEvent.click(checkboxes[1])

      const subjectInput = screen.getByPlaceholderText('Subject')
      const bodyTextarea = screen.getByPlaceholderText('Message body')
      
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, 'Test')
      await userEvent.clear(bodyTextarea)
      await userEvent.type(bodyTextarea, 'Test')

      const sendButton = screen.getByText('Send')
      await userEvent.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Sent 1/2')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com: SMTP error')).toBeInTheDocument()
      })
    })
  })
})
