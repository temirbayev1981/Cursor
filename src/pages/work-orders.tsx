import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Mail, Camera, Loader2, Check, Edit } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEMO_WORK_ORDERS } from '@/data/mock-data'
import { analyzeWorkOrderPDF, analyzeEmailWorkOrder, analyzePhoto } from '@/lib/ai'
import type { AIExtractedData } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function WorkOrdersPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [extracted, setExtracted] = useState<AIExtractedData | null>(null)
  const [emailContent, setEmailContent] = useState(
    'Tenant reports leaking faucet at 123 Main Street. Please send someone ASAP.\n\n— ABC Property Management'
  )
  const [pdfContent, setPdfContent] = useState(
    'Repair drywall damage, replace door trim, paint bedroom wall. Unit 204, 123 Main Street.'
  )

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
      toast.success('AI analysis complete')
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
      handleAnalyze('', 'photo', file)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = (e.target?.result as string) || 'Uploaded document content'
        setPdfContent(text)
        handleAnalyze(text, 'pdf')
      }
      reader.readAsText(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
    },
  })

  return (
    <div>
      <PageHeader
        title="Work Orders"
        description="AI-powered work order import from PDFs, emails, and photos"
      />

      <Tabs defaultValue="upload" className="mb-8">
        <TabsList>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />PDF Upload</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email Import</TabsTrigger>
          <TabsTrigger value="photo"><Camera className="h-4 w-4 mr-2" />Photo Analysis</TabsTrigger>
          <TabsTrigger value="history"><FileText className="h-4 w-4 mr-2" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Work Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">Drop PDF, image, or text file here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                </div>
                <div>
                  <Label>Or paste work order text</Label>
                  <Textarea
                    value={pdfContent}
                    onChange={(e) => setPdfContent(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <Button onClick={() => handleAnalyze(pdfContent, 'pdf')} disabled={analyzing} className="w-full">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Analyze with AI
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
                <CardTitle>Email Work Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={8}
                  placeholder="Paste email content..."
                />
                <Button onClick={() => handleAnalyze(emailContent, 'email')} disabled={analyzing} className="w-full">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Process Email
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
                <CardTitle>Photo Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div {...getRootProps()} className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50">
                  <input {...getInputProps()} />
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">Upload damage photo for AI analysis</p>
                  <p className="text-sm text-muted-foreground mt-1">Detects damage type, materials, and labor estimates</p>
                </div>
              </CardContent>
            </Card>
            <AIResultsPanel extracted={extracted} analyzing={analyzing} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {DEMO_WORK_ORDERS.map((wo) => (
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Extraction Results
          {extracted && <Check className="h-5 w-5 text-success" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {analyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing document with AI...</p>
            </motion.div>
          )}
          {!analyzing && !extracted && (
            <p className="text-muted-foreground text-center py-12">Upload or paste content to see AI extraction results</p>
          )}
          {!analyzing && extracted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {extracted.customer && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">Customer</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Name</Label><Input defaultValue={extracted.customer.name} /></div>
                    <div><Label className="text-xs">Phone</Label><Input defaultValue={extracted.customer.phone} /></div>
                    <div className="col-span-2"><Label className="text-xs">Address</Label><Input defaultValue={extracted.customer.address} /></div>
                  </div>
                </div>
              )}
              {extracted.tasks && (
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">Tasks</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {extracted.tasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ol>
                </div>
              )}
              {extracted.estimate && (
                <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-accent">Estimate</h4>
                  <p className="text-sm">Labor: {extracted.estimate.labor_hours} hours</p>
                  <p className="text-sm">Materials: {extracted.estimate.materials?.join(', ')}</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(extracted.estimate.suggested_price_min || 0)} – {formatCurrency(extracted.estimate.suggested_price_max || 0)}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1"><Edit className="h-4 w-4" />Edit & Approve</Button>
                <Button variant="outline" className="flex-1">Create Estimate</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
