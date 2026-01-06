"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";



export default function CalendarPage() {
    const [isFetching, setIsFetching] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const error = ""
    const calendar = ["1", "2"]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
                    <div className="flex items-center gap-2">
                        <select
                            className="border rounded-md px-2 py-1"
                        >
                            <option value="today">Today</option>
                            <option value="week">This week</option>
                            <option value="month">This month</option>
                            <option value="custom7">Next 7 days</option>
                        </select>
                        <button
                            type="button"
                            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                            disabled={isFetching}
                        >
                            {isFetching ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <p className="text-sm text-gray-600">Loading events…</p>
                ) : error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : calendar.length === 0 ? (
                    <p className="text-sm text-gray-600">No events for the selected period.</p>
                ) : (
                    <ul className="space-y-3">
                        Here the description of all calendar
                    </ul>
                )}
            </div>
        </DashboardLayout>
    );
}
