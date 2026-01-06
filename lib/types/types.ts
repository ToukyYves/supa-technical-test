export type Client = {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type CalendarEvent = {
    id: string;
    summary?: string | null;
    description?: string | null;
    start: string | null;
    end: string | null;
  };