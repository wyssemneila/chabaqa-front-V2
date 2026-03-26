export interface ParsedApiError {
  status?: number;
  code?: string;
  globalMessage: string;
  fieldErrors: Record<string, string>;
  rawDetails?: Array<{ field?: string; message: string }>;
}

export function extractApiError(error: any): ParsedApiError {
  const responseData = error?.response?.data;
  const status = Number(error?.statusCode || error?.status || error?.response?.status || 0) || undefined;
  const code =
    responseData?.error?.code ||
    error?.error?.code ||
    error?.code ||
    responseData?.code;

  const details =
    responseData?.error?.details ||
    responseData?.details ||
    error?.error?.details ||
    error?.details ||
    [];

  const rawDetails: Array<{ field?: string; message: string }> = Array.isArray(details)
    ? details.flatMap((detail: any) => {
        if (typeof detail === "string") {
          return [{ message: detail }];
        }

        const joinedMessages = Array.isArray(detail?.messages)
          ? detail.messages.filter(Boolean).join(", ")
          : undefined;
        const message = String(detail?.message || joinedMessages || "").trim();
        if (!message) return [];

        return [
          {
            field: typeof detail?.field === "string" ? detail.field : undefined,
            message,
          },
        ];
      })
    : [];

  const messageArray =
    responseData?.error?.message && Array.isArray(responseData.error.message)
      ? responseData.error.message
      : Array.isArray(responseData?.message)
        ? responseData.message
        : [];

  const messageFromArray = messageArray.length ? String(messageArray[0]) : undefined;
  const fallbackMessage =
    responseData?.error?.message ||
    responseData?.message ||
    error?.error?.message ||
    error?.message ||
    messageFromArray ||
    "Something went wrong.";

  const globalMessage = Array.isArray(fallbackMessage)
    ? String(fallbackMessage[0] || "Something went wrong.")
    : String(fallbackMessage);

  const fieldErrors: Record<string, string> = {};
  rawDetails.forEach((detail) => {
    if (detail.field && !fieldErrors[detail.field]) {
      fieldErrors[detail.field] = detail.message;
    }
  });

  if (Object.keys(fieldErrors).length === 0 && messageArray.length) {
    messageArray.forEach((message: string, index: number) => {
      fieldErrors[`error.${index}`] = message;
    });
  }

  return {
    status,
    code: typeof code === "string" ? code : undefined,
    globalMessage,
    fieldErrors,
    rawDetails,
  };
}
