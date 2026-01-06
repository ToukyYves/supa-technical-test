import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import TemplatesPage from '@/app/dashboard/templates/page'
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
const mockTemplates = [
  {
    id: '1',
    user_id: 'user123',
    name: 'Welcome Template',
    subject: 'Welcome {{client_name}}',
    body: 'Hello {{client_name}}, welcome to our service!',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user123',
    name: 'Follow-up Template',
    subject: 'Following up',
    body: 'Hi {{client_name}}, just checking in.',
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

describe('TemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Template List', () => {
    it('renders templates list correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTemplates }),
        } as Response)

      renderWithClient(<TemplatesPage />)

      expect(screen.getByText('Email Templates')).toBeInTheDocument()
      expect(screen.getByText('Create Template')).toBeInTheDocument()
      expect(screen.getByText('Your Templates')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Welcome Template')).toBeInTheDocument()
        expect(screen.getByText('Subject: Welcome {{client_name}}')).toBeInTheDocument()
        expect(screen.getByText('Hello {{client_name}}, welcome to our service!')).toBeInTheDocument()
        
        expect(screen.getByText('Follow-up Template')).toBeInTheDocument()
        expect(screen.getByText('Subject: Following up')).toBeInTheDocument()
        expect(screen.getByText('Hi {{client_name}}, just checking in.')).toBeInTheDocument()
      })
    })

    it('shows loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      renderWithClient(<TemplatesPage />)

      expect(screen.getByText('Loading…')).toBeInTheDocument()
    })

    it('shows empty state when no templates', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('No templates yet.')).toBeInTheDocument()
      })
    })
  })

  describe('Create Template', () => {
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

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument()
      })

      const nameInput = screen.getByPlaceholderText('Template Name')
      const subjectInput = screen.getByPlaceholderText('Subject')
      const bodyTextarea = screen.getByPlaceholderText('Body (use {{client_name}}, {{email}}, {{date}})')
      const createButton = screen.getByText('Create')

      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Test Template')
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, 'Test Subject')
      await userEvent.clear(bodyTextarea)
      await userEvent.type(bodyTextarea, 'Test body')

      await userEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create failed')).toBeInTheDocument()
      })
    })

    it('clears form after successful creation', async () => {
      const newTemplate = {
        id: '3',
        user_id: 'user123',
        name: 'New Template',
        subject: 'New Subject',
        body: 'New body',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: newTemplate }),
        } as Response)

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Create')).toBeInTheDocument()
      })

      // Fill form
      const nameInput = screen.getByPlaceholderText('Template Name')
      const subjectInput = screen.getByPlaceholderText('Subject')
      const bodyTextarea = screen.getByPlaceholderText('Body (use {{client_name}}, {{email}}, {{date}})')
      const createButton = screen.getByText('Create')

      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'New Template')
      await userEvent.clear(subjectInput)
      await userEvent.type(subjectInput, 'New Subject')
      await userEvent.clear(bodyTextarea)
      await userEvent.type(bodyTextarea, 'New body')

      await userEvent.click(createButton)

      await waitFor(() => {
        expect(nameInput).toHaveValue('')
        expect(subjectInput).toHaveValue('')
        expect(bodyTextarea).toHaveValue('')
      })
    })
  })

  describe('Update Template', () => {
    it('updates a template successfully', async () => {
      const updatedTemplate = {
        ...mockTemplates[0],
        name: 'Updated Template',
        subject: 'Updated Subject',
        body: 'Updated body',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTemplates }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: updatedTemplate }),
        } as Response)

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Template')).toBeInTheDocument()
      })

      // Click edit button
      const editButtons = screen.getAllByText('Edit')
      await userEvent.click(editButtons[0])

      // Update form
      const nameInput = screen.getByDisplayValue('Welcome Template')
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Updated Template')

      // Save
      const saveButtons = screen.getAllByText('Save')
      await userEvent.click(saveButtons[0])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/templates/1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Template',
            subject: 'Welcome {{client_name}}',
            body: 'Hello {{client_name}}, welcome to our service!',
          }),
        })
      })
    })

    it('cancels edit mode', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTemplates }),
        } as Response)

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Template')).toBeInTheDocument()
      })

      // Click edit button
      const editButtons = screen.getAllByText('Edit')
      await userEvent.click(editButtons[0])

      // Click cancel
      const cancelButton = screen.getByText('Cancel')
      await userEvent.click(cancelButton)

      // Should be back to view mode
      expect(screen.getByText('Welcome Template')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Welcome Template')).not.toBeInTheDocument()
    })
  })

  describe('Delete Template', () => {
    it('deletes a template successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTemplates }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response)

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Template')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButtons = screen.getAllByText('Delete')
      await userEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/templates/1', {
          method: 'DELETE',
        })
      })
    })

    it('shows error when delete fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTemplates }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Delete failed' }),
        } as Response)

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Template')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      await userEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })
    })
  })

  describe('Form Placeholders', () => {
    it('shows correct placeholders in create form', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<TemplatesPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Subject')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Body (use {{client_name}}, {{email}}, {{date}})')).toBeInTheDocument()
      })
    })
  })
})
