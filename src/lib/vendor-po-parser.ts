import type { VendorPOInput } from '@/types/vendor-po'

function clean(value?: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

/** PDF.js often flattens line breaks — restore markers so regex parsers still work. */
export function normalizeVendorPOText(text: string): string {
  let normalized = text.replace(/\r\n/g, '\n')

  normalized = normalized
    .replace(/\s+(SERVICE LOCATION\b)/gi, '\n$1')
    .replace(/(Loc #\s*\d+)\s+(\d{1,6}\s+)/gi, '$1\n$2')
    .replace(/(,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\s+(Phone #)/gi, '$1\n$2')

  const lineCount = normalized.split('\n').filter(Boolean).length
  if (lineCount >= 8) return normalized

  return normalized
    .replace(/\s+(Client PO #)/gi, '\n$1')
    .replace(/\s+(VENDOR PO #)/gi, '\n$1')
    .replace(/\s+(Priority\b)/gi, '\n$1')
    .replace(/\s+(Order Type\b)/gi, '\n$1')
    .replace(/\s+(NTE\b)/gi, '\n$1')
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

function parseCityStateZip(line: string) {
  const cleaned = clean(line)
  const parts = cleaned.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/)
  return {
    cityStateZip: cleaned,
    city: clean(parts?.[1] ?? ''),
    state: parts?.[2] ?? '',
    zip: parts?.[3] ?? '',
  }
}

/** "123 Main St, Graham, NC 27253" or "3465 S CHURCH ST Burlington, NC 27215-9111". */
function parseAddressLine(line: string) {
  const cleaned = clean(line.replace(/\n/g, ' '))
  if (!cleaned) return null

  const commaSeparated = cleaned.match(
    /^(.+?),\s*([A-Za-z][A-Za-z .'-]*),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  )
  if (commaSeparated) {
    return {
      serviceStreet: clean(commaSeparated[1]),
      serviceCity: clean(commaSeparated[2]),
      serviceState: commaSeparated[3],
      serviceZip: commaSeparated[4],
      serviceCityStateZip: `${clean(commaSeparated[2])}, ${commaSeparated[3]} ${commaSeparated[4]}`,
    }
  }

  const spacedCity = cleaned.match(
    /^(\d{1,6}\s+.+)\s+([A-Za-z][A-Za-z .'-]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/
  )
  if (spacedCity) {
    return {
      serviceStreet: clean(spacedCity[1]),
      serviceCity: clean(spacedCity[2]),
      serviceState: spacedCity[3],
      serviceZip: spacedCity[4],
      serviceCityStateZip: `${clean(spacedCity[2])}, ${spacedCity[3]} ${spacedCity[4]}`,
    }
  }

  return null
}

function parseServiceLocHeader(text: string) {
  const flat = clean(text.replace(/\n/g, ' '))
  const match = flat.match(/(.+?)\s*-?\s*Loc #\s*(\d+)/i)
  if (!match) return null
  return {
    serviceLocationName: clean(match[1].replace(/SERVICE LOCATION:?/i, '')),
    locationNumber: match[2],
  }
}

function buildLocationResult(fields: {
  vendorNumber: string
  serviceLocationName: string
  locationNumber?: string
  serviceStreet: string
  serviceCity: string
  serviceState: string
  serviceZip: string
  serviceCityStateZip: string
  servicePhone: string
  vendorStreet?: string
  vendorCityStateZip?: string
}) {
  return {
    vendorNumber: fields.vendorNumber,
    serviceLocationName: fields.serviceLocationName,
    locationNumber: fields.locationNumber,
    serviceStreet: fields.serviceStreet,
    serviceCity: fields.serviceCity,
    serviceState: fields.serviceState,
    serviceZip: fields.serviceZip,
    serviceCityStateZip: fields.serviceCityStateZip,
    servicePhone: fields.servicePhone,
    vendorStreet: fields.vendorStreet ?? '',
    vendorCityStateZip: fields.vendorCityStateZip ?? '',
  }
}

function parseCdMultilineLocation(normalized: string) {
  const block = normalized.match(
    /SERVICE LOCATION VENDOR #\s*(\d+)\s*\n\s*(.+?)\s*-?\s*Loc #\s*(\d+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*Phone #\s*([\d-]+)/is
  )
  if (!block) return null

  const city = parseCityStateZip(block[5])
  return buildLocationResult({
    vendorNumber: block[1],
    serviceLocationName: clean(block[2]),
    locationNumber: block[3],
    serviceStreet: clean(block[4]),
    serviceCity: city.city,
    serviceState: city.state,
    serviceZip: city.zip,
    serviceCityStateZip: city.cityStateZip,
    servicePhone: clean(block[6]),
  })
}

function parseCdMultilineCommaLocation(normalized: string) {
  const block = normalized.match(
    /SERVICE LOCATION VENDOR #\s*(\d+)\s*\n\s*(.+?)\s*-?\s*Loc #\s*(\d+)\s*\n\s*([^\n]+)\s*\n\s*Phone #\s*([\d-]+)/is
  )
  if (!block) return null

  const combined = parseAddressLine(block[4])
  if (!combined) return null

  return buildLocationResult({
    vendorNumber: block[1],
    serviceLocationName: clean(block[2]),
    locationNumber: block[3],
    serviceStreet: combined.serviceStreet,
    serviceCity: combined.serviceCity,
    serviceState: combined.serviceState,
    serviceZip: combined.serviceZip,
    serviceCityStateZip: combined.serviceCityStateZip,
    servicePhone: clean(block[5]),
  })
}

function parseFacilItMultilineLocation(normalized: string) {
  const block = normalized.match(
    /SERVICE LOCATION\s*\n\s*(.+?)\s*-?\s*Loc #\s*(\d+)\s*\n\s*([^\n]+)\s*\n\s*([^\n]+)\s*\n\s*Phone #\s*([\d-]+)[\s\S]*?VENDOR #\s*(\d+)/is
  )
  if (!block) return null

  const city = parseCityStateZip(block[4])
  return buildLocationResult({
    vendorNumber: block[6],
    serviceLocationName: clean(block[1]),
    locationNumber: block[2],
    serviceStreet: clean(block[3]),
    serviceCity: city.city,
    serviceState: city.state,
    serviceZip: city.zip,
    serviceCityStateZip: city.cityStateZip,
    servicePhone: clean(block[5]),
  })
}

function parseFacilItMultilineCommaLocation(normalized: string) {
  const block = normalized.match(
    /SERVICE LOCATION\s*\n\s*(.+?)\s*-?\s*Loc #\s*(\d+)\s*\n\s*([^\n]+)\s*\n\s*Phone #\s*([\d-]+)[\s\S]*?VENDOR #\s*(\d+)/is
  )
  if (!block) return null

  const combined = parseAddressLine(block[3])
  if (!combined) return null

  return buildLocationResult({
    vendorNumber: block[5],
    serviceLocationName: clean(block[1]),
    locationNumber: block[2],
    serviceStreet: combined.serviceStreet,
    serviceCity: combined.serviceCity,
    serviceState: combined.serviceState,
    serviceZip: combined.serviceZip,
    serviceCityStateZip: combined.serviceCityStateZip,
    servicePhone: clean(block[4]),
  })
}

function parseInlineServiceLocation(normalized: string) {
  const section = normalized.match(
    /SERVICE LOCATION[\s\S]*?(?=SERVICE DESCRIPTION|SPECIAL INSTRUCTIONS|Print Date:|$)/i
  )?.[0]
  if (!section) return null

  const vendorNumber =
    section.match(/SERVICE LOCATION VENDOR #\s*(\d+)/i)?.[1]
    ?? section.match(/VENDOR #\s*(\d+)/i)?.[1]
    ?? ''

  const locHeader = section.match(/(.+?)\s*-?\s*Loc #\s*(\d+)/i)
  const header = parseServiceLocHeader(section)
  const serviceLocationName = header?.serviceLocationName ?? clean(
    locHeader?.[1]
      ?.replace(/SERVICE LOCATION VENDOR #\s*\d+/i, '')
      .replace(/SERVICE LOCATION:?/i, '')
      ?? ''
  )
  const locationNumber = header?.locationNumber ?? locHeader?.[2]

  const commaAddr = section.match(
    /(\d{1,6}\s+[^,\n]+,\s*[A-Za-z][A-Za-z .'-]*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/
  )?.[1]
    ?? section.match(
      /(\d{1,6}\s+.+?,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/
    )?.[1]
  const combined = commaAddr ? parseAddressLine(commaAddr) : null

  const splitAddr = !combined
    ? section.match(
        /(\d{1,6}\s+[^\n,]+?)\s+([A-Za-z][A-Za-z .'-]*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/
      )
    : null

  const servicePhone = section.match(/Phone #\s*([\d-]+)/i)?.[1] ?? ''
  if (!serviceLocationName && !combined && !splitAddr) return null

  if (combined) {
    return buildLocationResult({
      vendorNumber,
      serviceLocationName,
      locationNumber,
      serviceStreet: combined.serviceStreet,
      serviceCity: combined.serviceCity,
      serviceState: combined.serviceState,
      serviceZip: combined.serviceZip,
      serviceCityStateZip: combined.serviceCityStateZip,
      servicePhone: clean(servicePhone),
    })
  }

  if (splitAddr) {
    const city = parseCityStateZip(splitAddr[2])
    return buildLocationResult({
      vendorNumber,
      serviceLocationName,
      locationNumber,
      serviceStreet: clean(splitAddr[1]),
      serviceCity: city.city,
      serviceState: city.state,
      serviceZip: city.zip,
      serviceCityStateZip: city.cityStateZip,
      servicePhone: clean(servicePhone),
    })
  }

  return null
}

/** Facil-IT layout: SERVICE LOCATION … Loc # … address … Phone # … ReadyFix … VENDOR # */
function parseFacilItSection(normalized: string) {
  if (/SERVICE LOCATION\s+VENDOR\s*#/i.test(normalized)) return null

  const section = normalized.match(
    /SERVICE LOCATION([\s\S]*?)(?=SERVICE DESCRIPTION|SPECIAL INSTRUCTIONS|Print Date:|$)/i
  )?.[1]
  if (!section) return null

  const header = parseServiceLocHeader(section)
  if (!header) return null

  const flatSection = clean(section.replace(/\n/g, ' '))
  const afterHeader = flatSection.slice(
    flatSection.search(/Loc #\s*\d+/i) + flatSection.match(/Loc #\s*\d+/i)![0].length
  )
  const serviceSlice = (afterHeader.split(/ReadyFix/i)[0] ?? afterHeader).replace(/\s*Fax #.*$/i, '')
  const phoneMatch = serviceSlice.match(/^\s*(.+?)\s+Phone #\s*([\d-]+)/i)
  const address = phoneMatch ? parseAddressLine(phoneMatch[1]) : null
  const servicePhone = phoneMatch?.[2] ?? section.match(/Phone #\s*([\d-]+)/i)?.[1] ?? ''
  const vendorNumber = section.match(/VENDOR #\s*(\d+)/i)?.[1] ?? ''

  if (!address) return null

  return buildLocationResult({
    vendorNumber,
    serviceLocationName: header.serviceLocationName,
    locationNumber: header.locationNumber,
    serviceStreet: address.serviceStreet,
    serviceCity: address.serviceCity,
    serviceState: address.serviceState,
    serviceZip: address.serviceZip,
    serviceCityStateZip: address.serviceCityStateZip,
    servicePhone: clean(servicePhone),
  })
}

function parseLocationBlock(normalized: string) {
  const multilineCd = parseCdMultilineLocation(normalized)
  if (multilineCd) return multilineCd

  const multilineCdComma = parseCdMultilineCommaLocation(normalized)
  if (multilineCdComma) return multilineCdComma

  const multilineFacilit = parseFacilItMultilineLocation(normalized)
  if (multilineFacilit) return multilineFacilit

  const multilineFacilitComma = parseFacilItMultilineCommaLocation(normalized)
  if (multilineFacilitComma) return multilineFacilitComma

  const facilitSection = parseFacilItSection(normalized)
  if (facilitSection) return facilitSection

  const block = normalized.match(
    /SERVICE LOCATION VENDOR #\s*(\d+)\s*\n(.+?)\s+ReadyFix\s*\n([^\n]+)\n([^\n]+)\s+Phone #\s*([\d-]+)/is
  )
  if (block) {
    return parseLocationMatch(block)
  }

  const flat = normalized.match(
    /SERVICE LOCATION VENDOR #\s*(\d+)\s+(.+?)\s+ReadyFix\s+(.+?)\s+([A-Za-z][A-Za-z .]*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\s+Phone #\s*([\d-]+)/is
  )
  if (flat) {
    return parseLocationMatch(flat)
  }

  return parseInlineServiceLocation(normalized)
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
  ]).slice(0, 4000)

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
