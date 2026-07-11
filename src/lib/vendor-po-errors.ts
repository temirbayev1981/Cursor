export class VendorPoDuplicateError extends Error {
  readonly vendorPoNumber: string

  constructor(vendorPoNumber: string) {
    super(`Vendor PO ${vendorPoNumber} already exists`)
    this.name = 'VendorPoDuplicateError'
    this.vendorPoNumber = vendorPoNumber
  }
}

export class VendorPoDuplicateFileError extends Error {
  readonly fileName: string

  constructor(fileName: string, message?: string) {
    super(message ?? `PDF file ${fileName} is already uploaded`)
    this.name = 'VendorPoDuplicateFileError'
    this.fileName = fileName
  }
}

export function isVendorPoDuplicateError(error: unknown): error is VendorPoDuplicateError {
  return error instanceof VendorPoDuplicateError
}

export function isVendorPoDuplicateFileError(error: unknown): error is VendorPoDuplicateFileError {
  return error instanceof VendorPoDuplicateFileError
}
