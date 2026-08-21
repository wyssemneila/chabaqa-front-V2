import enMessages from '@/messages/en.json'
import arMessages from '@/messages/ar.json'
import { AppLocale } from './config'

type MessageRecord = Record<string, any>

const MESSAGE_MAP: Record<AppLocale, MessageRecord> = {
  en: enMessages,
  ar: arMessages,
}

function deepMerge(base: MessageRecord, override: MessageRecord): MessageRecord {
  const output: MessageRecord = { ...base }

  for (const [key, value] of Object.entries(override || {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === 'object' &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key], value as MessageRecord)
      continue
    }
    output[key] = value
  }

  return output
}

export function getMessagesForLocale(locale: AppLocale): MessageRecord {
  if (locale === 'en') return MESSAGE_MAP.en
  return deepMerge(MESSAGE_MAP.en, MESSAGE_MAP[locale] || {})
}
