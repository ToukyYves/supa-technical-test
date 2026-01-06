import { DashboardLayout } from "@/components/dashboard-layout";

export default async function DashboardPage() {

    const user = "Bobo"

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Welcome back, {user}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">12</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500">Calendar Events</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">34</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500">Email Templates</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">1</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-sm font-medium text-gray-500">Emails Sent</h3>
                        <p className="text-2xl font-bold text-gray-900 mt-2">4</p>
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
