import { describe, it, expect } from 'vitest'
import { parseVendorPOText, isVendorPOText, normalizeVendorPOText, extractProblemDescription } from '@/lib/vendor-po-parser'
import FACILIT_FLATTENED from './__fixtures__/vendor-po-210072-extracted.txt?raw'
import VENDOR_PO_210071 from './__fixtures__/vendor-po-210071-extracted.txt?raw'

const SAMPLE_PO = `VENDOR PO # Service Date
Client PO # 350531955
207872-02
Priority P30
Order Type REPLACE
CD Maintenance Company
NTE $115.00
2170 W State Road 434, Suite 450
Longwood, FL 32779 Max Giardino
Phone # 321-926-3103 Fax # 321-233-0233 mgiardino@mycdfs.com
SERVICE LOCATION VENDOR # 1005635
Walgreen Drug Store - Loc # 09090 ReadyFix
317 Main St 929 15th Street Southeast
Graham, NC 27253-3319 Hickory, NC 28602
Phone # 336-222-6862 Fax # 336-222-9106 Phone # 980-252-3295 Fax #
SERVICE DESCRIPTION
BUILDING INTERIOR / BUILDING REPAIR / CEILING TILE / REPLACE
SPECIAL INSTRUCTIONS
TECH MUST CALL FROM SITE
Print Date: 06/23/26 02:59 pm`

describe('vendor-po-parser', () => {
  it('detects vendor PO text', () => {
    expect(isVendorPOText(SAMPLE_PO)).toBe(true)
    expect(isVendorPOText('random text')).toBe(false)
  })

  it('detects vendor PO text without VENDOR PO header when Client PO markers exist', () => {
    const text = `Client PO # 350531955
207872-02
SERVICE DESCRIPTION
BUILDING INTERIOR repair
SPECIAL INSTRUCTIONS
Call from site`
    expect(isVendorPOText(text)).toBe(true)
  })

  it('parses vendor PO number', () => {
    const result = parseVendorPOText(SAMPLE_PO, 'test.pdf', 'comp-001')
    expect(result.vendor_po_number).toBe('207872-02')
    expect(result.client_po_number).toBe('350531955')
  })

  it('parses priority and order type', () => {
    const result = parseVendorPOText(SAMPLE_PO, 'test.pdf', 'comp-001')
    expect(result.priority).toBe('P30')
    expect(result.order_type).toBe('REPLACE')
    expect(result.nte_amount).toBe(115)
  })

  it('parses service location', () => {
    const result = parseVendorPOText(SAMPLE_PO, 'test.pdf', 'comp-001')
    expect(result.location_number).toBe('09090')
    expect(result.service_address).toContain('317 Main St')
    expect(result.service_city).toBe('Graham')
    expect(result.service_state).toBe('NC')
  })

  it('parses PDF-flattened text without line breaks', () => {
    const flattened = SAMPLE_PO.replace(/\n/g, ' ')
    const result = parseVendorPOText(flattened, 'vendor-po-sample.pdf', 'comp-001')
    expect(result.vendor_po_number).toBe('207872-02')
    expect(result.client_po_number).toBe('350531955')
    expect(result.priority).toBe('P30')
    expect(result.service_address).toContain('317 Main St')
    expect(normalizeVendorPOText(flattened).split('\n').length).toBeGreaterThan(8)
  })

  it('parses Facil-IT Walgreens PO 210072-01 (flattened pdf.js text)', () => {
    expect(isVendorPOText(FACILIT_FLATTENED)).toBe(true)
    const result = parseVendorPOText(FACILIT_FLATTENED, 'VendorPO-210072-01.pdf', 'comp-001')
    expect(result.vendor_po_number).toBe('210072-01')
    expect(result.client_po_number).toBe('355708360')
    expect(result.priority).toBe('P30')
    expect(result.order_type).toBe('REPAIR')
    expect(result.nte_amount).toBe(115)
    expect(result.service_location_name).toContain('Walgreen')
    expect(result.service_address).toContain('3101 New Bern Ave')
  })

  it('parses Facil-IT Walgreens PO 210071-01 service location Loc # 17900', () => {
    expect(isVendorPOText(VENDOR_PO_210071)).toBe(true)
    const result = parseVendorPOText(VENDOR_PO_210071, 'VendorPO-210071-01.pdf', 'comp-001')
    expect(result.vendor_po_number).toBe('210071-01')
    expect(result.service_location_name).toContain('Walgreen Drug Store')
    expect(result.location_number).toBe('17900')
    expect(result.service_address).toContain('3465 S CHURCH ST')
    expect(result.service_city).toBe('Burlington')
    expect(result.service_state).toBe('NC')
    expect(result.service_zip).toBe('27215-9111')
    expect(result.service_phone).toBe('336-584-3374')
    expect(result.problem_description).toContain('pole in the back of the store is leaning')
    expect(result.problem_description).toContain('yellow pole')
  })

  it('extractProblemDescription takes text after the last slash', () => {
    const serviceDescription =
      'BUILDING EXTERIOR / PROPERTY/PERIMETER FENCE / REPAIR / Was issue caused by vandalism?: No / The pole in the back of the store is leaning, needs to be fixed.'
    expect(extractProblemDescription(serviceDescription)).toBe(
      'The pole in the back of the store is leaning, needs to be fixed.',
    )
    expect(extractProblemDescription('BUILDING INTERIOR / CEILING TILE / REPLACE')).toBe('')
    expect(extractProblemDescription('')).toBe('')
  })

  it('parses P1 emergency priority', () => {
    const text = `Client PO # 350531955
210214-01
Priority P1 - EMERGENCY
Order Type REPAIR
SERVICE DESCRIPTION
BUILDING repair
SPECIAL INSTRUCTIONS
Call from site`
    const result = parseVendorPOText(text, 'vendor-po-emergency.pdf', 'comp-001')
    expect(result.priority).toBe('P1 - EMERGENCY')
  })

  it('parses OpenAI multiline Facil-IT service location', () => {
    const text = `VENDOR PO # 210379-01
Client PO # 355708360
Priority P30
Order Type REPAIR
SERVICE LOCATION
Walgreen Drug Store - Loc # 09635
3101 New Bern Ave
Raleigh, NC 27610-1216
Phone # 919-231-5074
ReadyFix
929 15th Street Southeast
Hickory, NC 28602
Phone # 980-252-3295
VENDOR # 1005635
SERVICE DESCRIPTION
Fence repair
SPECIAL INSTRUCTIONS
Call from site`
    const result = parseVendorPOText(text, 'VendorPO-210379-01.pdf', 'comp-001')
    expect(result.service_location_name).toContain('Walgreen')
    expect(result.service_address).toContain('3101 New Bern Ave')
    expect(result.service_city).toBe('Raleigh')
    expect(result.service_state).toBe('NC')
    expect(result.service_zip).toBe('27610-1216')
  })

  it('parses OpenAI multiline CD Maintenance service location', () => {
    const text = `VENDOR PO # Service Date
Client PO # 350531955
207872-02
Priority P30
Order Type REPLACE
SERVICE LOCATION VENDOR # 1005635
Walgreen Drug Store - Loc # 09090
317 Main St
Graham, NC 27253-3319
Phone # 336-222-6862
ReadyFix
929 15th Street Southeast
Hickory, NC 28602
Phone # 980-252-3295
SERVICE DESCRIPTION
BUILDING INTERIOR repair
SPECIAL INSTRUCTIONS
TECH MUST CALL`
    const result = parseVendorPOText(text, 'vendor-po-sample.pdf', 'comp-001')
    expect(result.service_address).toContain('317 Main St')
    expect(result.service_city).toBe('Graham')
    expect(result.location_number).toBe('09090')
  })

  it('parses multi-word city names in service location', () => {
    const text = `SERVICE LOCATION VENDOR # 1005635
Walgreen Drug Store - Loc # 09090
100 S Main St
New Bern, NC 28560-1234
Phone # 336-222-6862
ReadyFix
929 15th Street Southeast
Hickory, NC 28602
Phone # 980-252-3295
SERVICE DESCRIPTION
BUILDING repair
SPECIAL INSTRUCTIONS
Call from site`
    const result = parseVendorPOText(text, 'vendor-po.pdf', 'comp-001')
    expect(result.service_address).toContain('100 S Main St')
    expect(result.service_city).toBe('New Bern')
    expect(result.service_zip).toBe('28560-1234')
  })

  it('parses OpenAI comma-separated street and city on one line (CD Maintenance)', () => {
    const text = `SERVICE LOCATION VENDOR # 1005635
Walgreen Drug Store - Loc # 210150
123 Main St, Graham, NC 27253-3319
Phone # 336-222-6862
ReadyFix
929 15th Street Southeast
Hickory, NC 28602
Phone # 980-252-3295
SERVICE DESCRIPTION
BUILDING repair`
    const result = parseVendorPOText(text, 'VendorPO-210150-01.pdf', 'comp-001')
    expect(result.service_address).toContain('123 Main St')
    expect(result.service_city).toBe('Graham')
    expect(result.service_state).toBe('NC')
    expect(result.service_zip).toBe('27253-3319')
    expect(result.location_number).toBe('210150')
  })

  it('parses OpenAI comma-separated street and city on one line (Facil-IT)', () => {
    const text = `SERVICE LOCATION
Walgreen Drug Store - Loc # 210150
456 Oak Ave, Raleigh, NC 27610-1216
Phone # 919-231-5074
ReadyFix
929 15th Street Southeast
Hickory, NC 28602
VENDOR # 1005635
SERVICE DESCRIPTION
Fence repair`
    const result = parseVendorPOText(text, 'VendorPO-210150-01.pdf', 'comp-001')
    expect(result.service_address).toContain('456 Oak Ave')
    expect(result.service_city).toBe('Raleigh')
    expect(result.service_zip).toBe('27610-1216')
  })

  it('parses flattened inline service location fallback', () => {
    const text = `SERVICE LOCATION VENDOR # 1005635 Walgreen - Loc # 210150 789 Pine St, Durham, NC 27701 Phone # 336-222-6862 ReadyFix SERVICE DESCRIPTION BUILDING repair`
    const result = parseVendorPOText(text, 'VendorPO-210150-01.pdf', 'comp-001')
    expect(result.service_address).toContain('789 Pine St')
    expect(result.service_city).toBe('Durham')
    expect(result.location_number).toBe('210150')
  })
})
