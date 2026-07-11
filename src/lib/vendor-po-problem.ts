import { extractProblemDescription } from '@/lib/vendor-po-parser'
import type { VendorPORecord } from '@/types/vendor-po'

export type ProblemDescriptionCellState = 'ru' | 'en' | 'empty'

export function getProblemDescriptionEn(row: VendorPORecord): string {
  return row.problem_description || extractProblemDescription(row.service_description)
}

export function getProblemDescriptionRu(row: VendorPORecord, translated?: string): string {
  return row.problem_description_ru || translated || ''
}

export function needsProblemDescriptionTranslation(row: VendorPORecord): boolean {
  if (row.problem_description_ru) return false
  const en = getProblemDescriptionEn(row)
  return Boolean(en && /[a-z]/i.test(en))
}

export function getProblemDescriptionCell(
  row: VendorPORecord,
  options?: {
    translated?: string
    isTranslating?: boolean
  },
): { text: string; state: ProblemDescriptionCellState; isTranslating: boolean } {
  const ru = getProblemDescriptionRu(row, options?.translated)
  if (ru) {
    return { text: ru, state: 'ru', isTranslating: false }
  }

  const en = getProblemDescriptionEn(row)
  if (!en) {
    return { text: '', state: 'empty', isTranslating: false }
  }

  const isTranslating = Boolean(
    options?.isTranslating && needsProblemDescriptionTranslation(row),
  )
  return { text: en, state: 'en', isTranslating }
}
