import { useTranslation } from '@/contexts/locale-context'

export function useDateLocale(): string {
  const { locale } = useTranslation()
  return locale === 'ru' ? 'ru-RU' : 'en-US'
}
