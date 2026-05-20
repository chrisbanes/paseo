/**
 * Providers eligible for "import recent session" discovery. Generic ACP catalog
 * providers (gemini, copilot, etc.) stay excluded — they either don't expose
 * persisted history quickly or duplicate other providers. Cursor is included
 * because cursor-agent exposes ACP session list/resume for CLI ACP sessions.
 */
export const IMPORTABLE_PROVIDERS = ["claude", "codex", "cursor", "opencode", "pi"] as const;
