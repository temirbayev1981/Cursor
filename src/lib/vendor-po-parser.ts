import type { VendorPOInput } from '@/types/vendor-po'

function clean(value?: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

/** PDF.js often flattens line breaks — restore markers so regex parsers still work. */
export function normalizeVendorPOText(text: string): string {
  let normalized = text.replace(/\r\n/g, '\n')
  const lineCount = normalized.split('\n').filter(Boolean).length
  if (lineCount >= 8) return normalized

  return normalized
    .replace(/\s+(Client PO #)/gi, '\n$1')
    .replace(/\s+(VENDOR PO #)/gi, '\n$1')
    .replace(/\s+(Priority\b)/gi, '\n$1')
    .replace(/\s+(Order Type\b)/gi, '\n$1')
    .replace(/\s+(NTE\b)/gi, '\n$1')
    .replace(/\s+(SERVICE LOCATION\b)/gi, '\n$1')
    .replace(/\s+(ReadyFix)\s+/gi, '\n$1\n')
    .replace(/\s+(SERVICE DESCRIPTION\b)/gi, '\n$1')
    .replace(/\s+(SPECIAL INSTRUCTIONS\b)/gi, '\n$1')
    .replace(/\s+(Print Date:)/gi, '\n$1')
    .replace(/(\d{5}(?:-\d{4})?)\s+(Phone #)/gi, '$1\n$2')
    .replace(/(\d{6}-\d{2})\s+(VENDOR PO #)/gi, '$1\n$2')
    .replace(/(\d{9})\s+(Client PO #)/gi, '$1\n$2')
}

function extractPriority(normalized: string): string {
  const emergency = normalized.match(/Priority\s+(P\d{1,2}\s*-\s*EMERGENCY)/i)?.[1]
  if (emergency) return clean(emergency)

  const labeled = [...normalized.matchAll(/Priority\s+(\S+)/gi)]
  const coded = labeled.map((match) => match[1]).find((value) => /^P\d{1,2}$/i.test(value))
  if (coded) return clean(coded)

  return clean(normalized.match(/\b(P\d{1,2})\b/i)?.[1])
}

function extractOrderType(normalized: string): string {
  const labeled = [...normalized.matchAll(/Order Type\s+(\S+)/gi)]
  const known = labeled.map((match) => match[1]).find((value) => /^(REPAIR|REPLACE|EMERGENCY)$/i.test(value))
  if (known) return clean(known)
  return clean(normalized.match(/\b(REPAIR|REPLACE|EMERGENCY)\b/i)?.[1])
}

function parseMoney(value?: string | null): number {
  if (!value) return 0
  const n = parseFloat(value.replace(/[$,]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function extractSection(text: string, start: string, endMarkers: string[]): string {
  const startIdx = text.indexOf(start)
  if (startIdx === -1) return ''
  const from = startIdx + start.length
  let end = text.length
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker, from)
    if (idx !== -1 && idx < end) end = idx
  }
  return clean(text.slice(from, end))
}

function extractClientPoNumber(normalized: string): string {
  const matches = [...normalized.matchAll(/Client PO #\s*(\d+)/gi)]
  const longMatch = matches.map((m) => m[1]).find((value) => value.length >= 9)
  if (longMatch) return longMatch

  const reversed = normalized.match(/\b(\d{9})\b[\s\S]{0,120}?Client PO #/i)?.[1]
  if (reversed) return reversed

  const standalone = normalized.match(/\b(\d{9})\b/)?.[1]
  if (standalone) return standalone

  return matches[0]?.[1] ?? ''
}

function parseLocationBlock(normalized: string) {
  const block = normalized.match(
    /SERVICE LOCATION VENDOR #\s*(\d+)\s*\n(.+?)\s+ReadyFix\s*\n([^\n]+)\n([^\n]+)\s+Phone #\s*([\d-]+)/is
  )
  if (block) {
    return parseLocationMatch(block)
  }

  const flat = normalized.match(
    /SERVICE LOCATION VENDOR #\s*(\d+)\s+(.+?)\s+ReadyFix\s+(.+?)\s+([A-Za-z .]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\s+Phone #\s*([\d-]+)/is
  )
  if (flat) {
    return parseLocationMatch(flat)
  }

  const facilit = normalized.match(
    /SERVICE LOCATION\s+(.+?)\s+ReadyFix\s+(.+?)\s+Phone #\s*([\d-]+)(?:\s+Fax #[^V]*)?\s+VENDOR #\s*(\d+)/is
  )
  if (facilit) {
    return parseFacilItLocation(facilit)
  }

  return null
}

function parseFacilItLocation(block: RegExpMatchArray) {
  const serviceBlock = block[1]
  const vendorStreetLine = clean(block[2])
  const vendorNumber = block[4]

  const serviceMatch = serviceBlock.match(
    /(.+?)\s+Loc #\s*(\d+)\s+(\d+\s+.+)\s+([A-Za-z]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\s+Phone #\s*([\d-]+)/is
  )

  const serviceLocationName = clean(serviceMatch?.[1] ?? serviceBlock.split(/\s+Loc #/i)[0])
  const locationNumber = serviceMatch?.[2]
  const serviceStreet = clean(serviceMatch?.[3] ?? '')
  const serviceCityStateZip = clean(serviceMatch?.[4] ?? '')
  const servicePhone = clean(serviceMatch?.[5] ?? '')

  const serviceParts = serviceCityStateZip.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)

  return {
    vendorNumber,
    serviceLocationName,
    locationNumber,
    serviceStreet,
    serviceCity: clean(serviceParts?.[1] ?? ''),
    serviceState: serviceParts?.[2] ?? '',
    serviceZip: serviceParts?.[3] ?? '',
    serviceCityStateZip,
    servicePhone,
    vendorStreet: vendorStreetLine,
    vendorCityStateZip: '',
  }
}

function parseLocationMatch(block: RegExpMatchArray) {

  const vendorNumber = block[1]
  const storeLine = clean(block[2])
  const streetLine = block[3]
  const cityLine = block[4]
  const servicePhone = clean(block[5])

  const locationNumber = storeLine.match(/Loc #\s*(\d+)/i)?.[1]
  const serviceLocationName = clean(storeLine.replace(/\s*-?\s*Loc #\s*\d+/i, ''))

  const streetMatch = streetLine.match(/^(.+?)\s+(\d{3,}\s+.+)$/)
  const serviceStreet = clean(streetMatch?.[1] ?? streetLine.split(/\s+\d{3,}\s+/)[0] ?? streetLine)
  const vendorStreet = clean(streetMatch?.[2] ?? streetLine.split(/\s+\d{3,}\s+/)[1] ?? '')

  const cityMatch = cityLine.match(
    /^(.+?,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\s+(.+?,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)$/
  )
  const serviceCityStateZip = clean(cityMatch?.[1] ?? cityLine)
  const vendorCityStateZip = clean(cityMatch?.[2] ?? '')

  const serviceParts = serviceCityStateZip.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)

  return {
    vendorNumber,
    serviceLocationName,
    locationNumber,
    serviceStreet,
    serviceCity: clean(serviceParts?.[1] ?? ''),
    serviceState: serviceParts?.[2] ?? '',
    serviceZip: serviceParts?.[3] ?? '',
    serviceCityStateZip,
    servicePhone,
    vendorStreet,
    vendorCityStateZip,
  }
}

export function parseVendorPOText(text: string, fileName: string, companyId: string): VendorPOInput {
  if (!companyId) {
    throw new Error('companyId is required for vendor PO parsing')
  }
  const normalized = normalizeVendorPOText(text)

  const vendorPoNumber =
    normalized.match(/VENDOR PO #\s*(\d{6}-\d{2})/i)?.[1] ??
    normalized.match(/Client PO #\s*\d+\s*\n\s*(\d{6}-\d{2})/i)?.[1] ??
    normalized.match(/Client PO #\s*\d+\s+(\d{6}-\d{2})/i)?.[1] ??
    normalized.match(/(\d{6}-\d{2})\s*\n\s*VENDOR PO #/i)?.[1] ??
    normalized.match(/(\d{6}-\d{2})\s+VENDOR PO #/i)?.[1] ??
    normalized.match(/(\d{6}-\d{2})\s*\n\s*Priority/i)?.[1] ??
    normalized.match(/(\d{6}-\d{2})\s+Priority/i)?.[1] ??
    fileName.match(/(\d{6}-\d{2})/)?.[1] ??
    ''

  const clientPoNumber = extractClientPoNumber(normalized)
  const priority = extractPriority(normalized)
  const orderType = extractOrderType(normalized)
  const nteAmount =
    parseMoney(normalized.match(/NTE\s+\$?([\d,]+\.?\d*)/i)?.[1])
    || parseMoney(normalized.match(/\$([\d,]+\.?\d*)\s+NTE/i)?.[1])

  const serviceDate = clean(
    normalized.match(/Service Date\s+([^\n]+)/i)?.[1]?.replace(/Client PO.*/i, '')
  )
  const printDate = clean(normalized.match(/Print Date:\s*([^\n]+)/i)?.[1])

  const clientCompany =
    clean(normalized.match(/Order Type\s+\S+\s+([^\n]+?)(?:\s+NTE\b|\n)/i)?.[1]) || 'CD Maintenance Company'

  const clientContactLine = normalized.match(
    /(\d+[^,\n]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\s+([A-Za-z][A-Za-z\s.'-]+)\nPhone #/i
  )

  const location = parseLocationBlock(normalized)

  const serviceDescription = extractSection(normalized, 'SERVICE DESCRIPTION', [
    'SPECIAL INSTRUCTIONS',
    'Print Date:',
  ])

  const specialInstructions = extractSection(normalized, 'SPECIAL INSTRUCTIONS', [
    'Print Date:',
    'Invoicing/Required Documentation',
  ])

  const categoryParts = serviceDescription.split('/').map((p) => clean(p)).filter(Boolean)
  const serviceCategory = categoryParts.slice(0, 3).join(' / ')
  const workSummary = clean(
    categoryParts.slice(0, 4).join(' / ') ||
      serviceDescription.slice(0, 200)
  )

  const vendorPhone = clean(
    normalized.match(/Hickory, NC[\s\S]*?Phone #\s*([\d-]+)/i)?.[1]
  )

  return {
    company_id: companyId,
    vendor_po_number: vendorPoNumber,
    client_po_number: clientPoNumber,
    priority,
    order_type: orderType,
    nte_amount: nteAmount,
    service_date: serviceDate || undefined,
    print_date: printDate || undefined,
    client_company: clientCompany,
    client_contact: clean(clientContactLine?.[2]),
    client_phone: clean(normalized.match(/Phone #\s*([\d-]+)\s+Fax #/i)?.[1]),
    client_email: clean(normalized.match(/([\w.-]+@mycdfs\.com)/i)?.[1]),
    client_address: clean(clientContactLine?.[1]),
    service_location_name: location?.serviceLocationName ?? '',
    location_number: location?.locationNumber,
    service_address: location?.serviceStreet ?? '',
    service_city: location?.serviceCity ?? '',
    service_state: location?.serviceState ?? '',
    service_zip: location?.serviceZip ?? '',
    service_phone: location?.servicePhone ?? '',
    vendor_name: 'ReadyFix',
    vendor_number: location?.vendorNumber,
    vendor_address: [location?.vendorStreet, location?.vendorCityStateZip].filter(Boolean).join(', '),
    vendor_phone: vendorPhone,
    service_category: serviceCategory,
    service_description: serviceDescription,
    work_summary: workSummary,
    special_instructions: specialInstructions.slice(0, 500) || undefined,
    source_file_name: fileName,
  }
}

export function isVendorPOText(text: string): boolean {
  const normalized = normalizeVendorPOText(text)
  const hasVendorMarker = /VENDOR\s*PO\s*#/i.test(normalized) || /Client PO #/i.test(normalized)
  const hasDescription = /SERVICE DESCRIPTION/i.test(normalized) || /SPECIAL INSTRUCTIONS/i.test(normalized)
  return hasVendorMarker && hasDescription
}
