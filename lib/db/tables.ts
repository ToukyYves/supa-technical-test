export const TABLES = {
    CLIENTS: "clients",
    USER_TOKENS: "user_tokens",
    EMAIL_TEMPLATES: "email_templates",
  } as const;
  
  export type TableName = typeof TABLES[keyof typeof TABLES];
  