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

export type FilterKey = "today" | "week" | "month" | "custom7";

export type EmailTemplate = {
    id: string;
    user_id: string;
    name: string;
    subject: string;
    body: string;
    created_at: string;
    updated_at: string;
};


export type EmailLog = {
    id: string;
    user_id: string;
    to_email: string;
    subject: string;
    body: string;
    gmail_message_id?: string;
    success: boolean;
    error_message?: string;
    created_at: string;
};

export type SendResult = {
    email: string;
    success: boolean;
    error?: string;
    id?: string;
  };