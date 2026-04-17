export type StarSenderPayload = {
  messageType: "text";
  to: string;
  body: string;
};

export type StarSenderResponse = {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
};

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; payload: StarSenderPayload; response: StarSenderResponse }> {
  const apiUrl = process.env.STARSENDER_API_URL;
  const apiKey = process.env.STARSENDER_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("StarSender API credentials not configured");
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  
  const payload: StarSenderPayload = {
    messageType: "text",
    to: normalizedPhone,
    body: message,
  };

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    let response: StarSenderResponse;

    try {
      response = JSON.parse(responseText);
    } catch {
      response = {
        success: res.ok,
        message: responseText,
      };
    }

    return {
      success: res.ok,
      payload,
      response: {
        ...response,
        success: res.ok,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Network error";
    return {
      success: false,
      payload,
      response: {
        success: false,
        error: errorMessage,
      },
    };
  }
}
