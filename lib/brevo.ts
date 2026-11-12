import "server-only";

type BrevoSendInput = {
  to: string;
  recipientName?: string;
  subject: string;
  htmlContent: string;
};

type BrevoResponse = {
  messageId?: string;
  code?: string;
  message?: string;
};

export async function sendBrevoEmail(input: BrevoSendInput) {
  const apiKey =
    process.env.BREVO_API_KEY?.trim() || process.env.BREVO_API?.trim();
  if (!apiKey) {
    throw new Error("BREVO_API_KEY ist nicht konfiguriert.");
  }

  const senderEmail =
    process.env.B2B_BREVO_SENDER_EMAIL?.trim() || "info@umzugshelden.io";
  const senderName =
    process.env.B2B_BREVO_SENDER_NAME?.trim() || "Umzugshelden";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [
        {
          email: input.to,
          ...(input.recipientName ? { name: input.recipientName } : {}),
        },
      ],
      subject: input.subject,
      htmlContent: input.htmlContent,
      replyTo: { email: senderEmail, name: senderName },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const payload = (await response.json().catch(() => ({}))) as BrevoResponse;
  if (!response.ok || !payload.messageId) {
    console.error("Brevo B2B send failed", response.status, payload.code);
    throw new Error(payload.message || "Brevo konnte die E-Mail nicht versenden.");
  }

  return { messageId: payload.messageId };
}

