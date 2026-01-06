"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { thisWeekRange, thisMonthRange, todayRange, type Range } from "@/lib/date/range";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CalendarEvent } from "@/lib/types/types";


type FilterKey = "today" | "week" | "month" | "custom7";

function buildRange(key: FilterKey): Range {
  switch (key) {
    case "today":
      return todayRange();
    case "week":
      return thisWeekRange();
    case "month":
      return thisMonthRange();
    case "custom7":
      return { ...todayRange(), timeMax: thisWeekRange().timeMax };
    default:
      return thisWeekRange();
  }
}

export default function CalendarPage() {
  const [filter, setFilter] = useState<FilterKey>("week");
  const range = useMemo(() => buildRange(filter), [filter]);

  const query = useQuery<{ data: CalendarEvent[] }, Error>({
    queryKey: ["calendar", range],
    queryFn: async () => {
      const url = new URL("/api/calendar/events", window.location.origin);
      if (range.timeMin) url.searchParams.set("timeMin", range.timeMin);
      if (range.timeMax) url.searchParams.set("timeMax", range.timeMax);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Failed to load events: ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const events = query.data?.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-md px-2 py-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterKey)}
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="custom7">Next 7 days</option>
            </select>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
              disabled={query.isFetching}
            >
              {query.isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

      {query.isLoading ? (
        <p className="text-sm text-gray-600">Loading events…</p>
      ) : query.error ? (
        <p className="text-sm text-red-600">{query.error.message}</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-600">No events for the selected period.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id} className="border rounded-md p-3">
              <p className="font-medium">{ev.summary ?? "(No title)"}</p>
              <p className="text-sm text-gray-600">
                {ev.start ?? "?"} → {ev.end ?? "?"}
              </p>
              {ev.description ? (
                <p className="text-sm text-gray-700 mt-1">{ev.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      </div>
    </DashboardLayout>
  );
}
