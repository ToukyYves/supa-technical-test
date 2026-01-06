import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ClientsPage from '@/app/dashboard/clients/page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/dashboard-layout'

// Mock DashboardLayout
vi.mock('@/components/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}))

// Mock fetch
global.fetch = vi.fn()

const mockFetch = fetch as ReturnType<typeof vi.fn>

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

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Client List', () => {
    it('renders clients list correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)

      renderWithClient(<ClientsPage />)

      expect(screen.getByTestId('create-client-title')).toBeInTheDocument()
      expect(screen.getByTestId('clients-list-title')).toBeInTheDocument()

      expect(await screen.findByText('John Doe')).toBeInTheDocument()
      expect(await screen.findByText('john@example.com')).toBeInTheDocument()
      expect(await screen.findByText('123-456-7890')).toBeInTheDocument()
      expect(await screen.findByText('Test client')).toBeInTheDocument()
      
      expect(await screen.findByText('Jane Smith')).toBeInTheDocument()
      expect(await screen.findByText('jane@example.com')).toBeInTheDocument()
    })

    it('shows loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      renderWithClient(<ClientsPage />)

      expect(screen.getByText('Loading…')).toBeInTheDocument()
    })

    it('shows empty state when no clients', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<ClientsPage />)

      await waitFor(() => {
        expect(screen.getByText('No clients yet.')).toBeInTheDocument()
      })
    })
  })

  describe('Create Client', () => {
    it('creates a new client successfully', async () => {
      const newClient = {
        id: '3',
        user_id: 'user123',
        name: 'New Client',
        email: 'new@example.com',
        phone: '987-654-3210',
        notes: 'New notes',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: newClient }),
        } as Response)

      renderWithClient(<ClientsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('clients-list-title')).toBeInTheDocument()
      })

      // Fill form
      const nameInput = screen.getByTestId('client-name-input')
      const emailInput = screen.getByTestId('client-email-input')
      const createButton = screen.getByTestId('create-client-button')

      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'New Client')
      await userEvent.clear(emailInput)
      await userEvent.type(emailInput, 'new@example.com')

      // Submit form
      await userEvent.click(createButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'New Client',
            email: 'new@example.com',
            phone: undefined,
            notes: undefined,
          }),
        })
      })
    })

    it('shows error when create fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Create failed' }),
        } as Response)

      renderWithClient(<ClientsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('client-name-input')).toBeInTheDocument()
      })

      const nameInput = screen.getByTestId('client-name-input')
      const emailInput = screen.getByTestId('client-email-input')
      const createButton = screen.getByTestId('create-client-button')

      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Test Client')
      await userEvent.clear(emailInput)
      await userEvent.type(emailInput, 'test@example.com')

      await userEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create failed')).toBeInTheDocument()
      })
    })
  })

  describe('Update Client', () => {
    it('updates a client successfully', async () => {
      const updatedClient = {
        ...mockClients[0],
        name: 'Updated Name',
        email: 'updated@example.com',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: updatedClient }),
        } as Response)

      renderWithClient(<ClientsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click edit button
      const editButtons = screen.getAllByText('Edit')
      await userEvent.click(editButtons[0])

      // Update form
      const nameInput = screen.getByDisplayValue('John Doe')
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Updated Name')

      // Save
      const saveButtons = screen.getAllByText('Save')
      await userEvent.click(saveButtons[0])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/clients/1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Name',
            email: 'john@example.com',
            phone: '123-456-7890',
            notes: 'Test client',
          }),
        })
      })
    })

    it('cancels edit mode', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)

      renderWithClient(<ClientsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click edit button
      const editButtons = screen.getAllByText('Edit')
      await userEvent.click(editButtons[0])

      // Click cancel
      const cancelButton = screen.getByText('Cancel')
      await userEvent.click(cancelButton)

      // Should be back to view mode
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument()
    })
  })

  describe('Delete Client', () => {
    it('deletes a client successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response)

      renderWithClient(<ClientsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButtons = screen.getAllByText('Delete')
      await userEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/clients/1', {
          method: 'DELETE',
        })
      })
    })

    it('shows error when delete fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockClients }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Delete failed' }),
        } as Response)

      renderWithClient(<ClientsPage />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      await userEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })
    })
  })
})
