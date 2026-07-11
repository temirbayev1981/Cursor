import { extractProblemDescription } from '@/lib/vendor-po-parser'
import type { VendorPORecord } from '@/types/vendor-po'

export function getProblemDescriptionEn(row: VendorPORecord): string {
  return row.problem_description || extractProblemDescription(row.service_description)
}

export function getProblemDescriptionRu(row: VendorPORecord, translated?: string): string {
  return row.problem_description_ru || translated || getProblemDescriptionEn(row)
}
