import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Mail, Camera, Loader2, Check, Edit, Table2, Database } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VendorPOTable } from '@/components/vendor-po/vendor-po-table'
import { useWorkOrders } from '@/hooks/use-entities'
import { saveWorkOrderFromAI } from '@/services/entity-service'
import { useAuth } from '@/contexts/auth-context'
import { analyzeWorkOrderPDF, analyzeEmailWorkOrder, analyzePhoto } from '@/lib/ai'
import { extractTextFromPdfFiles } from '@/lib/pdf-extract'
import { isVendorPOText, parseVendorPOText } from '@/lib/vendor-po-parser'
import { useQueryClient } from '@tanstack/react-query'
import { useVendorPOs, useSaveVendorPOs, useDeleteVendorPO, useSeedVendorPOs } from '@/hooks/use-vendor-pos'
import type { AIExtractedData } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslation } from '@/contexts/locale-context'

export default function WorkOrdersPage() {
  const { t } = useTranslation()
  const { company } = useAuth()
  const companyId = company?.id ?? 'comp-001'
  const [analyzing, setAnalyzing] = useState(false)
  const [parsingPdf, setParsingPdf] = useState(false)
  const [extracted, setExtracted] = useState<AIExtractedData | null>(null)
  const [emailContent, setEmailContent] = useState(
    'Tenant reports leaking faucet at 123 Main Street. Please send someone ASAP.\n\n— ABC Property Management'
  )
  const [pdfContent, setPdfContent] = useState(
    'Repair drywall damage, replace door trim, paint bedroom wall. Unit 204, 123 Main Street.'
  )

  const queryClient = useQueryClient()
  const { data: vendorPOs = [], isLoading } = useVendorPOs()
  const { data: workOrders = [] } = useWorkOrders()
  const saveVendorPOs = useSaveVendorPOs()
  const deleteVendorPO = useDeleteVendorPO()
  const seedVendorPOs = useSeedVendorPOs()

  useEffect(() => {
    const seeded = localStorage.getItem('handymanos_vendor_pos_seeded')
    if (!seeded && !isLoading && vendorPOs.length === 0) {
      seedVendorPOs.mutate(undefined, {
        onSuccess: () => localStorage.setItem('handymanos_vendor_pos_seeded', 'true'),
      })
    }
  }, [isLoading, vendorPOs.length])

  const handleAnalyze = async (content: string, type: 'pdf' | 'email' | 'photo', file?: File) => {
    setAnalyzing(true)
    setExtracted(null)
    try {
      const result =
        type === 'email'
          ? await analyzeEmailWorkOrder(content)
          : type === 'photo' && file
            ? await analyzePhoto(file)
            : await analyzeWorkOrderPDF(content)
      setExtracted(result)
      await saveWorkOrderFromAI(companyId, type === 'email' ? 'email' : type === 'photo' ? 'photo' : 'pdf', content, result)
      queryClient.invalidateQueries({ queryKey: ['workOrders', companyId] })
      toast.success(t.workOrders.analysisComplete)
    } catch {
      toast.error(t.workOrders.analysisFailed)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleVendorPOUpload = async (files: File[]) => {
    const pdfFiles = files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (pdfFiles.length === 0) return

    setParsingPdf(true)
    try {
      const extracted = await extractTextFromPdfFiles(pdfFiles)
      const parsed = []
      for (const { fileName, text } of extracted) {
        if (!isVendorPOText(text)) {
          toast.error(`${fileName}: ${t.vendorPO.notVendorPO}`)
          continue
        }
        parsed.push(parseVendorPOText(text, fileName))
      }
      if (parsed.length === 0) {
        toast.error(t.vendorPO.parseError)
        return
      }
      await saveVendorPOs.mutateAsync(parsed)
      toast.success(`${t.vendorPO.parseSuccess}: ${parsed.length}`)
    } catch {
      toast.error(t.vendorPO.parseError)
    } finally {
      setParsingPdf(false)
    }
  }

  const onDropVendorPO = useCallback((files: File[]) => {
    handleVendorPOUpload(files)
  }, [])

  const onDropGeneral = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      handleVendorPOUpload([file])
      return
    }
    if (file.type.startsWith('image/')) {
      handleAnalyze('', 'photo', file)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = (e.target?.result as string) || ''
        setPdfContent(text)
        handleAnalyze(text, 'pdf')
      }
      reader.readAsText(file)
    }
  }, [])

  const vendorDropzone = useDropzone({
    onDrop: onDropVendorPO,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  })

  const generalDropzone = useDropzone({
    onDrop: onDropGeneral,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
    },
  })

  return (
    <div>
      <PageHeader
        title={t.workOrders.title}
        description={t.workOrders.description}
      />

      <Tabs defaultValue="vendor-po" className="mb-8">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="vendor-po"><Table2 className="h-4 w-4 mr-2" />{t.vendorPO.tab}</TabsTrigger>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />{t.workOrders.pdfUpload}</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />{t.workOrders.emailImport}</TabsTrigger>
          <TabsTrigger value="photo"><Camera className="h-4 w-4 mr-2" />{t.workOrders.photoAnalysis}</TabsTrigger>
          <TabsTrigger value="history"><FileText className="h-4 w-4 mr-2" />{t.workOrders.history}</TabsTrigger>
        </TabsList>

        <TabsContent value="vendor-po">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.vendorPO.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.vendorPO.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...vendorDropzone.getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    vendorDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input {...vendorDropzone.getInputProps()} />
                  {parsingPdf ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                      <p className="font-medium">{t.vendorPO.parsing}</p>
                    </div>
                  ) : (
                    <>
                      <Database className="h-10 w-10 mx-auto mb-4 text-primary" />
                      <p className="font-medium">{t.vendorPO.dropHint}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t.vendorPO.clickBrowse}</p>
                      <p className="text-xs text-muted-foreground mt-3">CD Maintenance · Facil-IT · Walgreens PO</p>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t.vendorPO.tableTitle}: <span className="font-medium text-foreground">{vendorPOs.length}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => seedVendorPOs.mutate()}
                    disabled={seedVendorPOs.isPending}
                  >
                    {t.vendorPO.loadDemo}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <VendorPOTable
              records={vendorPOs}
              loading={isLoading}
              onDelete={(id) => {
                deleteVendorPO.mutate(id, {
                  onSuccess: () => toast.success(t.vendorPO.deleteSuccess),
                })
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.workOrders.uploadTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...generalDropzone.getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    generalDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input {...generalDropzone.getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">{t.workOrders.dropHint}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.workOrders.clickBrowse}</p>
                </div>
                <div>
                  <Label>{t.workOrders.pasteText}</Label>
                  <Textarea
                    value={pdfContent}
                    onChange={(e) => setPdfContent(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <Button onClick={() => handleAnalyze(pdfContent, 'pdf')} disabled={analyzing} className="w-full">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {t.workOrders.analyzeAi}
                </Button>
              </CardContent>
            </Card>

            <AIResultsPanel extracted={extracted} analyzing={analyzing} />
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.workOrders.emailTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={8}
                  placeholder={t.workOrders.pasteEmail}
                />
                <Button onClick={() => handleAnalyze(emailContent, 'email')} disabled={analyzing} className="w-full">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {t.workOrders.processEmail}
                </Button>
              </CardContent>
            </Card>
            <AIResultsPanel extracted={extracted} analyzing={analyzing} />
          </div>
        </TabsContent>

        <TabsContent value="photo">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.workOrders.photoTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div {...generalDropzone.getRootProps()} className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50">
                  <input {...generalDropzone.getInputProps()} />
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">{t.workOrders.photoHint}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.workOrders.photoSubhint}</p>
                </div>
              </CardContent>
            </Card>
            <AIResultsPanel extracted={extracted} analyzing={analyzing} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {workOrders.map((wo) => (
              <Card key={wo.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{wo.source}</Badge>
                      <Badge>{wo.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {wo.ai_extracted_data?.job?.requested_repairs?.join(', ') || wo.raw_content?.slice(0, 80)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(wo.created_at).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AIResultsPanel({ extracted, analyzing }: { extracted: AIExtractedData | null; analyzing: boolean }) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t.workOrders.aiResults}
          {extracted && <Check className="h-5 w-5 text-success" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {analyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{t.common.analyzing}</p>
            </motion.div>
          )}
          {!analyzing && !extracted && (
            <p className="text-muted-foreground text-center py-12">{t.common.uploadPrompt}</p>
          )}
          {!analyzing && extracted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {extracted.customer && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">{t.workOrders.customer}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">{t.onboarding.name}</Label><Input defaultValue={extracted.customer.name} /></div>
                    <div><Label className="text-xs">{t.onboarding.phone}</Label><Input defaultValue={extracted.customer.phone} /></div>
                    <div className="col-span-2"><Label className="text-xs">{t.onboarding.address}</Label><Input defaultValue={extracted.customer.address} /></div>
                  </div>
                </div>
              )}
              {extracted.tasks && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">{t.workOrders.tasks}</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {extracted.tasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ol>
                </div>
              )}
              {extracted.estimate && (
                <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-accent">{t.workOrders.estimate}</h4>
                  <p className="text-sm">{t.workOrders.labor}: {extracted.estimate.labor_hours} {t.common.hours}</p>
                  <p className="text-sm">{t.workOrders.materials}: {extracted.estimate.materials?.join(', ')}</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(extracted.estimate.suggested_price_min || 0)} – {formatCurrency(extracted.estimate.suggested_price_max || 0)}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1"><Edit className="h-4 w-4" />{t.workOrders.editApprove}</Button>
                <Button variant="outline" className="flex-1">{t.workOrders.createEstimate}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
