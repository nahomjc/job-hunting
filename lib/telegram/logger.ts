const PREFIX = "[telegram]";

function serialize(data?: Record<string, unknown>) {
  if (!data || Object.keys(data).length === 0) return "";
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export function telegramLog(message: string, data?: Record<string, unknown>) {
  const extra = serialize(data);
  if (extra) {
    console.log(`${PREFIX} ${message}`, extra);
  } else {
    console.log(`${PREFIX} ${message}`);
  }
}

export function telegramError(message: string, data?: Record<string, unknown>) {
  const extra = serialize(data);
  if (extra) {
    console.error(`${PREFIX} ${message}`, extra);
  } else {
    console.error(`${PREFIX} ${message}`);
  }
}
