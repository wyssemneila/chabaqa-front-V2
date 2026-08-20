/**
 * Error message mapping utility
 * Maps French backend errors to English user-friendly messages
 */

export interface ErrorMapping {
  pattern: string | RegExp;
  message: string;
  guidance?: string;
}

// Common error patterns from backend (French to English)
const errorMappings: ErrorMapping[] = [
  // Subscription errors
  {
    pattern: /abonnement.*actif.*requis|active subscription.*required/i,
    message: 'An active subscription is required',
    guidance: 'Please subscribe to a plan to access this feature.'
  },
  {
    pattern: /abonnement.*expiré|subscription.*expired/i,
    message: 'Your subscription has expired',
    guidance: 'Please renew your subscription to continue using this feature.'
  },
  {
    pattern: /abonnement.*non.*trouvé|subscription.*not.*found/i,
    message: 'No active subscription found',
    guidance: 'Please subscribe to a plan to access this feature.'
  },

  // Event errors
  {
    pattern: /événement.*non.*trouvé|event.*not.*found/i,
    message: 'Event not found',
    guidance: 'The event you are looking for does not exist or has been deleted.'
  },
  {
    pattern: /événement.*doit.*avoir.*billet|event.*must.*have.*ticket/i,
    message: 'Event must have at least one ticket type',
    guidance: 'Please add at least one ticket option before publishing the event.'
  },
  {
    pattern: /événement.*doit.*avoir.*date|event.*must.*have.*date/i,
    message: 'Event must have a start date',
    guidance: 'Please set a start date before publishing the event.'
  },
  {
    pattern: /ne.*peut.*modifier.*événements|can.*only.*modify.*events/i,
    message: 'You can only modify your own events',
    guidance: 'You do not have permission to edit this event.'
  },
  {
    pattern: /billet.*vendu|ticket.*sold/i,
    message: 'Cannot delete ticket with sales',
    guidance: 'This ticket has been sold and cannot be deleted. You can disable it instead.'
  },

  // Registration errors
  {
    pattern: /déjà.*inscrit|already.*registered/i,
    message: 'You are already registered for this event',
    guidance: 'You have already registered for this event.'
  },
  {
    pattern: /inscription.*impossible|registration.*impossible/i,
    message: 'Registration is not available',
    guidance: 'This event is not accepting new registrations at this time.'
  },
  {
    pattern: /billet.*non.*disponible|ticket.*not.*available/i,
    message: 'Ticket type not available',
    guidance: 'The selected ticket type is no longer available.'
  },
  {
    pattern: /plus.*de.*places|no.*more.*tickets/i,
    message: 'No more tickets available',
    guidance: 'This ticket type has sold out.'
  },

  // Validation errors
  {
    pattern: /champ.*requis|field.*required/i,
    message: 'Required field is missing',
    guidance: 'Please fill in all required fields.'
  },
  {
    pattern: /format.*invalide|invalid.*format/i,
    message: 'Invalid format',
    guidance: 'Please check the format of your input.'
  },
  {
    pattern: /date.*passée|date.*past/i,
    message: 'Date must be in the future',
    guidance: 'Please select a date that is in the future.'
  },
  {
    pattern: /date.*fin.*avant.*début|end.*date.*before.*start/i,
    message: 'End date must be after start date',
    guidance: 'Please ensure the end date is after the start date.'
  },
  {
    pattern: /heure.*fin.*avant.*début|end.*time.*before.*start/i,
    message: 'End time must be after start time',
    guidance: 'Please ensure the end time is after the start time.'
  },
  {
    pattern: /URL.*invalide|invalid.*URL/i,
    message: 'Invalid URL format',
    guidance: 'Please enter a valid URL (e.g., https://example.com).'
  },
  {
    pattern: /dépasse.*caractères|exceeds.*characters/i,
    message: 'Text exceeds maximum length',
    guidance: 'Please shorten your text to meet the maximum length requirement.'
  },

  // Authentication errors
  {
    pattern: /non.*autorisé|unauthorized/i,
    message: 'You are not authorized',
    guidance: 'Please log in to access this feature.'
  },
  {
    pattern: /session.*expirée|session.*expired/i,
    message: 'Your session has expired',
    guidance: 'Please log in again to continue.'
  },
  {
    pattern: /token.*invalide|invalid.*token/i,
    message: 'Invalid authentication token',
    guidance: 'Please log in again.'
  },
  {
    pattern: /too many attempts|too many requests|trop de tentatives|rate limit/i,
    message: 'Too many attempts',
    guidance: 'Please wait a moment before trying again.'
  },

  // General errors
  {
    pattern: /erreur.*serveur|server.*error/i,
    message: 'Server error occurred',
    guidance: 'Something went wrong on our end. Please try again later.'
  },
  {
    pattern: /réseau|network/i,
    message: 'Network error',
    guidance: 'Please check your internet connection and try again.'
  },
  {
    pattern: /timeout/i,
    message: 'Request timed out',
    guidance: 'The request took too long. Please try again.'
  }
];

/**
 * Maps a backend error message to a user-friendly English message
 * @param error - The error object or message string from the backend
 * @returns An object with the mapped message and optional guidance
 */
export function mapErrorMessage(error: any): { message: string; guidance?: string } {
  // Extract error message from various error formats
  let errorMessage: unknown = '';

  const toSafeString = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map((item) => toSafeString(item)).filter(Boolean).join(', ');
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      // Common backend error envelope: { error: { code, message } }
      if (typeof obj.message === 'string') return obj.message;
      if (obj.error !== undefined) return toSafeString(obj.error);
      if (typeof obj.code === 'string') return obj.code;
      try {
        return JSON.stringify(obj);
      } catch {
        return '';
      }
    }
    return '';
  };
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error?.message) {
    errorMessage = error.error.message;
  } else if (error?.error) {
    errorMessage = error.error;
  } else if (error?.data?.message) {
    errorMessage = error.data.message;
  } else if (error?.data?.error?.message) {
    errorMessage = error.data.error.message;
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.response?.data?.error?.message) {
    errorMessage = error.response.data.error.message;
  } else {
    errorMessage = 'An unexpected error occurred';
  }

  const normalizedErrorMessage = toSafeString(errorMessage) || 'An unexpected error occurred';

  // Normalize the error message (lowercase for matching)
  const normalizedMessage = normalizedErrorMessage.toLowerCase();

  // Find matching error pattern
  for (const mapping of errorMappings) {
    const pattern = typeof mapping.pattern === 'string' 
      ? new RegExp(mapping.pattern, 'i')
      : mapping.pattern;
    
    if (pattern.test(normalizedMessage) || pattern.test(normalizedErrorMessage)) {
      return {
        message: mapping.message,
        guidance: mapping.guidance
      };
    }
  }

  // If no mapping found, return the original message or a generic one
  return {
    message: normalizedErrorMessage || 'An error occurred. Please try again.',
    guidance: 'If this problem persists, please contact support.'
  };
}

/**
 * Extracts a user-friendly error message from an error object
 * @param error - The error object
 * @returns A string with the user-friendly error message
 */
export function getErrorMessage(error: any): string {
  const mapped = mapErrorMessage(error);
  return mapped.message;
}

/**
 * Extracts error guidance from an error object
 * @param error - The error object
 * @returns A string with guidance or undefined
 */
export function getErrorGuidance(error: any): string | undefined {
  const mapped = mapErrorMessage(error);
  return mapped.guidance;
}

/**
 * Formats an error for display in toast notifications
 * @param error - The error object
 * @returns An object with title and description for toast
 */
export function formatErrorForToast(error: any): { title: string; description?: string } {
  const mapped = mapErrorMessage(error);
  return {
    title: mapped.message,
    description: mapped.guidance
  };
}
