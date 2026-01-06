import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import { getServerSupabase } from '@/lib/supabase/server'
import { ClientsService } from '@/services/clients'
import { TemplatesService } from '@/services/templates'
import { CalendarService } from '@/services/calendar'
import { EmailLogsService } from '@/services/email-logs'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the services
vi.mock('@/services/clients')
vi.mock('@/services/templates')
vi.mock('@/services/calendar')
vi.mock('@/services/email-logs')
vi.mock('@/lib/supabase/server')

// Mock DashboardLayout
vi.mock('@/components/dashboard-layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}))

const mockGetServerSupabase = getServerSupabase as ReturnType<typeof vi.fn>
const mockClientsService = ClientsService as ReturnType<typeof vi.fn>
const mockTemplatesService = TemplatesService as ReturnType<typeof vi.fn>
const mockCalendarService = CalendarService as ReturnType<typeof vi.fn>
const mockEmailLogsService = EmailLogsService as ReturnType<typeof vi.fn>

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // it('renders dashboard with user data', async () => {
  //   // Mock supabase auth
  //   const mockSupabase = {
  //     auth: {
  //       getUser: vi.fn().mockResolvedValue({
  //         data: { user: { id: 'user123', email: 'test@example.com' } },
  //       }),
  //     },
  //   }
  //   mockGetServerSupabase.mockResolvedValue(mockSupabase)

  //   // Mock service instances
  //   const mockClientsInstance = {
  //     list: vi.fn().mockResolvedValue([
  //       { id: '1', name: 'Client 1' },
  //       { id: '2', name: 'Client 2' },
  //     ]),
  //   }
  //   const mockTemplatesInstance = {
  //     list: vi.fn().mockResolvedValue([
  //       { id: '1', name: 'Template 1' },
  //     ]),
  //   }
  //   const mockCalendarInstance = {
  //     getEvents: vi.fn().mockResolvedValue([
  //       { id: '1', summary: 'Event 1' },
  //       { id: '2', summary: 'Event 2' },
  //       { id: '3', summary: 'Event 3' },
  //     ]),
  //   }
  //   const mockEmailLogsInstance = {
  //     countByUser: vi.fn().mockResolvedValue(5),
  //   }

  //   mockClientsService.mockImplementation(() => mockClientsInstance as any)
  //   mockTemplatesService.mockImplementation(() => mockTemplatesInstance as any)
  //   mockCalendarService.mockImplementation(() => mockCalendarInstance as any)
  //   mockEmailLogsService.mockImplementation(() => mockEmailLogsInstance as any)

  //   const Dashboard = await DashboardPage()
  //   const { container } = render(Dashboard)

  //   expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
  //   expect(screen.getByText('Dashboard')).toBeInTheDocument()
  //   expect(screen.getByText('Welcome back, test@example.com')).toBeInTheDocument()
    
  //   // Check stats
  //   expect(screen.getByText('2')).toBeInTheDocument() // Total Clients
  //   expect(screen.getByText('3')).toBeInTheDocument() // Calendar Events
  //   expect(screen.getByText('1')).toBeInTheDocument() // Email Templates
  //   expect(screen.getByText('5')).toBeInTheDocument() // Emails Sent
  // })

  it('renders dashboard without user data', async () => {
    // Mock supabase auth with no user
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    }
    mockGetServerSupabase.mockResolvedValue(mockSupabase)

    const Dashboard = await DashboardPage()
    const { container } = render(Dashboard)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back,')).toBeInTheDocument()
    
    // Check default stats (all zeros)
    const statsElements = screen.getAllByText('0')
    expect(statsElements).toHaveLength(4)
  })

  // it('renders quick actions section', async () => {
  //   const mockSupabase = {
  //     auth: {
  //       getUser: vi.fn().mockResolvedValue({
  //         data: { user: { id: 'user123', email: 'test@example.com' } },
  //       }),
  //     },
  //   }
  //   mockGetServerSupabase.mockResolvedValue(mockSupabase)

  //   // Mock empty services
  //   const mockClientsInstance = { list: vi.fn().mockResolvedValue([]) }
  //   const mockTemplatesInstance = { list: vi.fn().mockResolvedValue([]) }
  //   const mockCalendarInstance = { getEvents: vi.fn().mockResolvedValue([]) }
  //   const mockEmailLogsInstance = { countByUser: vi.fn().mockResolvedValue(0) }

  //   mockClientsService.mockImplementation(() => mockClientsInstance as any)
  //   mockTemplatesService.mockImplementation(() => mockTemplatesInstance as any)
  //   mockCalendarService.mockImplementation(() => mockCalendarInstance as any)
  //   mockEmailLogsService.mockImplementation(() => mockEmailLogsInstance as any)

  //   const Dashboard = await DashboardPage()
  //   const { container } = render(Dashboard)

  //   expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  //   expect(screen.getByText('Manage Clients')).toBeInTheDocument()
  //   expect(screen.getByText('Add, edit, or delete clients')).toBeInTheDocument()
  //   expect(screen.getByText('View Calendar')).toBeInTheDocument()
  //   expect(screen.getByText('Check your Google Calendar events')).toBeInTheDocument()
  //   expect(screen.getByText('Send Emails')).toBeInTheDocument()
  //   expect(screen.getByText('Compose and send emails to clients')).toBeInTheDocument()
  // })

  // it('handles service errors gracefully', async () => {
  //   const mockSupabase = {
  //     auth: {
  //       getUser: vi.fn().mockResolvedValue({
  //         data: { user: { id: 'user123', email: 'test@example.com' } },
  //       }),
  //     },
  //   }
  //   mockGetServerSupabase.mockResolvedValue(mockSupabase)

  //   // Mock services that throw errors
  //   const mockClientsInstance = {
  //     list: vi.fn().mockRejectedValue(new Error('Service error')),
  //   }
  //   const mockTemplatesInstance = {
  //     list: vi.fn().mockRejectedValue(new Error('Service error')),
  //   }
  //   const mockCalendarInstance = {
  //     getEvents: vi.fn().mockRejectedValue(new Error('Service error')),
  //   }
  //   const mockEmailLogsInstance = {
  //     countByUser: vi.fn().mockRejectedValue(new Error('Service error')),
  //   }

  //   mockClientsService.mockImplementation(() => mockClientsInstance as any)
  //   mockTemplatesService.mockImplementation(() => mockTemplatesInstance as any)
  //   mockCalendarService.mockImplementation(() => mockCalendarInstance as any)
  //   mockEmailLogsService.mockImplementation(() => mockEmailLogsInstance as any)

  //   const Dashboard = await DashboardPage()
  //   const { container } = render(Dashboard)

  //   // Should still render dashboard with zero stats due to error handling
  //   const statsElements = screen.getAllByText('0')
  //   expect(statsElements).toHaveLength(4)
  // })

  // it('has correct links for quick actions', async () => {
  //   const mockSupabase = {
  //     auth: {
  //       getUser: vi.fn().mockResolvedValue({
  //         data: { user: { id: 'user123', email: 'test@example.com' } },
  //       }),
  //     },
  //   }
  //   mockGetServerSupabase.mockResolvedValue(mockSupabase)

  //   const mockClientsInstance = { list: vi.fn().mockResolvedValue([]) }
  //   const mockTemplatesInstance = { list: vi.fn().mockResolvedValue([]) }
  //   const mockCalendarInstance = { getEvents: vi.fn().mockResolvedValue([]) }
  //   const mockEmailLogsInstance = { countByUser: vi.fn().mockResolvedValue(0) }

  //   mockClientsService.mockImplementation(() => mockClientsInstance as any)
  //   mockTemplatesService.mockImplementation(() => mockTemplatesInstance as any)
  //   mockCalendarService.mockImplementation(() => mockCalendarInstance as any)
  //   mockEmailLogsService.mockImplementation(() => mockEmailLogsInstance as any)

  //   const Dashboard = await DashboardPage()
  //   const { container } = render(Dashboard)

  //   const clientsLink = screen.getByText('Manage Clients').closest('a')
  //   const calendarLink = screen.getByText('View Calendar').closest('a')
  //   const emailsLink = screen.getByText('Send Emails').closest('a')

  //   expect(clientsLink).toHaveAttribute('href', '/clients')
  //   expect(calendarLink).toHaveAttribute('href', '/calendar')
  //   expect(emailsLink).toHaveAttribute('href', '/emails')
  // })
})
