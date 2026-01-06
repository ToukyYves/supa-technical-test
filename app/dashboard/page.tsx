import { DashboardLayout } from "@/components/dashboard-layout";
import { getServerSupabase } from "@/lib/supabase/server";
import { ClientsService } from "@/services/clients";
import { TemplatesService } from "@/services/templates";
import { CalendarService } from "@/services/calendar";
import { EmailLogsService } from "@/services/email-logs";

async function getDashboardStats(userId: string) {
  const supabase = await getServerSupabase();
  const clientsService = new ClientsService(supabase);
  const templatesService = new TemplatesService(supabase);
  const calendarService = new CalendarService(supabase);
  const emailLogsService = new EmailLogsService(supabase);
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const [clients, templates, calendarEvents, emailsSent] = await Promise.all([
    clientsService.list(userId).catch(() => []),
    templatesService.list(userId).catch(() => []),
    calendarService.getEvents(userId, {
      timeMin: startOfMonth.toISOString(),
      timeMax: endOfMonth.toISOString(),
    }).catch(() => []),
    emailLogsService.countByUser(userId).catch(() => 0)
  ]);

  return {
    totalClients: clients.length,
    totalTemplates: templates.length,
    calendarEvents: calendarEvents.length,
    emailsSent,
  };
}

export default async function DashboardPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = user ? await getDashboardStats(user.id) : {
    totalClients: 0,
    totalTemplates: 0,
    calendarEvents: 0,
    emailsSent: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {user?.email}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Calendar Events</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.calendarEvents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Email Templates</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalTemplates}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Emails Sent</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.emailsSent}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/clients" 
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Manage Clients</h3>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or delete clients</p>
            </a>
            <a 
              href="/calendar" 
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">View Calendar</h3>
              <p className="text-sm text-gray-600 mt-1">Check your Google Calendar events</p>
            </a>
            <a 
              href="/emails" 
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Send Emails</h3>
              <p className="text-sm text-gray-600 mt-1">Compose and send emails to clients</p>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
