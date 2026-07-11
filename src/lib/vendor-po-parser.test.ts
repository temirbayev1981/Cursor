import { describe, it, expect } from 'vitest'
import { parseVendorPOText, isVendorPOText, normalizeVendorPOText } from '@/lib/vendor-po-parser'
import FACILIT_FLATTENED from './__fixtures__/vendor-po-210072-extracted.txt?raw'

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
})
