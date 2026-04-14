const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_EVENTS_URL = "https://app.loops.so/api/v1/events/send";
const LOOPS_CONTACTS_URL = "https://app.loops.so/api/v1/contacts/update";

const sentEvents = new Map<string, Set<string>>();

function isDuplicate(eventName: string, dedupKey: string): boolean {
  const keys = sentEvents.get(eventName);
  return keys?.has(dedupKey) ?? false;
}

function markSent(eventName: string, dedupKey: string): void {
  if (!sentEvents.has(eventName)) sentEvents.set(eventName, new Set());
  sentEvents.get(eventName)!.add(dedupKey);
}

const sentContactUpdates = new Set<string>();

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : "***";
  return `${masked}@${domain}`;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LOOPS_API_KEY}`,
  };
}

export interface LoopsContactProps {
  analysis_started?: boolean;
  analysis_completed?: boolean;
  subscription_status?: "inactive" | "started" | "active" | "canceled";
  plan?: "monthly" | "yearly" | "one_time" | "none";
  signup_at?: string;
  last_login_at?: string;
  last_active_at?: string;
  last_analysis_at?: string;
  analysis_count?: number;
}

export async function updateLoopsContact(
  email: string,
  props: LoopsContactProps,
  dedupKey?: string
): Promise<void> {
  if (!LOOPS_API_KEY) {
    console.warn(`[LOOPS] updateContact skipped — LOOPS_API_KEY not configured`);
    return;
  }

  if (dedupKey) {
    if (sentContactUpdates.has(dedupKey)) {
      console.info(`[LOOPS] updateContact skipped (duplicate) key=${dedupKey}`);
      return;
    }
  }

  const body = { email, ...props };

  try {
    const response = await fetch(LOOPS_CONTACTS_URL, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "(no body)");
      console.error(
        `[LOOPS] updateContact failed for ${maskEmail(email)}: HTTP ${response.status} — ${text}`
      );
      return;
    }

    if (dedupKey) sentContactUpdates.add(dedupKey);
    const updated = Object.entries(props)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.info(`[LOOPS] updateContact sent for ${maskEmail(email)} [${updated}]${dedupKey ? ` key=${dedupKey}` : ""}`);
  } catch (err) {
    console.error(`[LOOPS] updateContact threw for ${maskEmail(email)}:`, err);
  }
}

interface LoopsEventPayload {
  email: string;
  userId?: string | number;
  properties?: Record<string, unknown>;
  dedupKey?: string;
}

export async function sendLoopsEvent(
  eventName: string,
  { email, userId, properties, dedupKey }: LoopsEventPayload
): Promise<void> {
  if (!LOOPS_API_KEY) {
    console.warn(`[LOOPS] ${eventName} skipped — LOOPS_API_KEY not configured`);
    return;
  }

  if (dedupKey) {
    if (isDuplicate(eventName, dedupKey)) {
      console.info(`[LOOPS] ${eventName} skipped (duplicate) key=${dedupKey}`);
      return;
    }
  }

  const body: Record<string, unknown> = {
    eventName,
    email,
    ...(userId !== undefined && { userId: String(userId) }),
    ...(properties && Object.keys(properties).length > 0 && { properties }),
  };

  try {
    const response = await fetch(LOOPS_EVENTS_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "(no body)");
      console.error(
        `[LOOPS] ${eventName} failed for ${maskEmail(email)}: HTTP ${response.status} — ${text}`
      );
      return;
    }

    if (dedupKey) markSent(eventName, dedupKey);
    console.info(`[LOOPS] ${eventName} sent for ${maskEmail(email)}${dedupKey ? ` key=${dedupKey}` : ""}`);
  } catch (err) {
    console.error(`[LOOPS] ${eventName} threw for ${maskEmail(email)}:`, err);
  }
}
