import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import CalendarPage from '@/app/dashboard/calendar/page'
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
const mockEvents = [
  {
    id: '1',
    summary: 'Team Meeting',
    description: 'Weekly team sync',
    start: '2024-01-01T10:00:00Z',
    end: '2024-01-01T11:00:00Z',
  },
  {
    id: '2',
    summary: 'Client Call',
    description: null,
    start: '2024-01-02T14:00:00Z',
    end: '2024-01-02T15:00:00Z',
  },
  {
    id: '3',
    summary: null,
    description: 'No title event',
    start: '2024-01-03T09:00:00Z',
    end: '2024-01-03T10:00:00Z',
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

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Calendar Events Display', () => {
    it('shows loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      renderWithClient(<CalendarPage />)

      expect(screen.getByText('Loading events…')).toBeInTheDocument()
    })

    it('renders calendar page correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockEvents }),
        } as Response)

      renderWithClient(<CalendarPage />)

      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('This week')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
        expect(screen.getByText('Weekly team sync')).toBeInTheDocument()
        expect(screen.getByText('Client Call')).toBeInTheDocument()
        expect(screen.getByText('(No title)')).toBeInTheDocument()
      })
    })

    it('shows error state when fetch fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        } as Response)

      renderWithClient(<CalendarPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load events: 500')).toBeInTheDocument()
      })
    })

    it('shows empty state when no events', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<CalendarPage />)

      await waitFor(() => {
        expect(screen.getByText('No events for the selected period.')).toBeInTheDocument()
      })
    })
  })

  describe('Date Filtering', () => {
    it('changes filter when dropdown is changed', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockEvents }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<CalendarPage />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })

      const filterSelect = screen.getByDisplayValue('This week')
      await userEvent.selectOptions(filterSelect, 'today')

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('timeMin=')
        )
      })
    })

    it('shows correct filter options', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<CalendarPage />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('This week')
        expect(select).toBeInTheDocument()
        
        const options = screen.getAllByRole('option')
        expect(options).toHaveLength(4)
        expect(screen.getByText('Today')).toBeInTheDocument()
        expect(screen.getByText('This week')).toBeInTheDocument()
        expect(screen.getByText('This month')).toBeInTheDocument()
        expect(screen.getByText('Next 7 days')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('refreshes events when refresh button is clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockEvents }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<CalendarPage />)

      await waitFor(() => {
        expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('Refresh')
      await userEvent.click(refreshButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('API Requests', () => {
    it('makes correct API request with time parameters', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as Response)

      renderWithClient(<CalendarPage />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/calendar/events')
        )
      })

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('timeMin=')
      expect(callUrl).toContain('timeMax=')
    })
  })

  describe('Event Edge Cases', () => {

    it('handles network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      renderWithClient(<CalendarPage />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })
})
