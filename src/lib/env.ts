function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  appUrl: optional("APP_URL", "http://localhost:3000"),
  uploadsDir: optional("UPLOADS_DIR", "./data/uploads"),
  reminderDefaultDays: optional("REMINDER_DEFAULT_DAYS", "30,14,7,1"),
  reminderCron: optional("REMINDER_CRON_SCHEDULE", "0 8 * * *"),
  smtp: {
    host: optional("SMTP_HOST"),
    port: Number(optional("SMTP_PORT", "587")),
    secure: optional("SMTP_SECURE", "false") === "true",
    user: optional("SMTP_USER"),
    pass: optional("SMTP_PASSWORD"),
    from: optional("SMTP_FROM", "Contracts <no-reply@localhost>"),
  },
  ntfy: {
    url: optional("NTFY_URL", "https://ntfy.sh"),
    topic: optional("NTFY_TOPIC"),
    token: optional("NTFY_TOKEN"),
  },
};

export const isEmailConfigured = () => Boolean(env.smtp.host && env.smtp.user);
export const isNtfyConfigured = () => Boolean(env.ntfy.url && env.ntfy.topic);
