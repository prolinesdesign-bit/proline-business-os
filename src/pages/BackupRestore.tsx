import { useState, useRef } from 'react'
import { exportTable, exportAllData, parseImportFile, importTable, TABLE_LABELS } from '../lib/api/backup'
import type { ExportTable, ExportFormat } from '../lib/api/backup'
import AppLayout from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { toast } from 'sonner'

const TABLES: ExportTable[] = ['projects', 'clients', 'payments', 'expenses', 'targets', 'documents']

export default function BackupRestore() {
  const [exporting, setExporting] = useState<{ table: ExportTable | 'all'; format: ExportFormat } | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport(table: ExportTable | 'all', format: ExportFormat) {
    setExporting({ table, format })
    try {
      if (table === 'all') {
        await exportAllData(format)
      } else {
        await exportTable(table, format)
      }
      toast.success(`${table === 'all' ? 'All data' : TABLE_LABELS[table]} exported as ${format.toUpperCase()}`)
    } catch (err) {
      console.error('Export failed:', err)
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    setImportError(null)
    try {
      const data = await parseImportFile(importFile)
      let imported = 0
      for (const [key, rows] of Object.entries(data)) {
        const tableKey = key.toLowerCase().replace(/\s+/g, '') as ExportTable
        const table = TABLES.find(t => t === tableKey || TABLE_LABELS[t].toLowerCase() === key.toLowerCase())
        if (table && rows.length > 0) {
          await importTable(table, rows)
          imported += rows.length
        }
      }
      setImportResult(`Successfully imported ${imported} records.`)
      toast.success(`Successfully imported ${imported} records.`)
      setImportFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err)
      setImportError(msg || 'Import failed')
      toast.error(msg || 'Import failed')
      console.error('Import failed:', err)
    } finally {
      setImporting(false)
    }
  }

  function ExportButtons({ table }: { table: ExportTable | 'all' }) {
    const isExporting = exporting?.table === table
    return (
      <div className="flex flex-wrap gap-2">
        {(['json', 'csv', 'excel'] as ExportFormat[]).map(fmt => (
          <Button
            key={fmt}
            variant="outline"
            size="sm"
            onClick={() => handleExport(table, fmt)}
            disabled={isExporting || (table === 'all' && fmt === 'csv')}
          >
            {isExporting && exporting?.format === fmt ? 'Exporting...' : fmt.toUpperCase()}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">Backup & Restore Center</h1>

        {/* Export Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Export Data</h2>

          {/* Export All */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div>
              <p className="font-medium text-gray-900">All Data</p>
              <p className="text-xs text-muted-foreground">Export every module in a single file</p>
            </div>
            <ExportButtons table="all" />
          </div>

          {/* Individual Tables */}
          <div className="space-y-3">
            {TABLES.map(table => (
              <div key={table} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{TABLE_LABELS[table]}</p>
                  <p className="text-xs text-gray-400">{table}</p>
                </div>
                <ExportButtons table={table} />
              </div>
            ))}
          </div>
        </CardContent></Card>

        {/* Import Section */}
        <Card>
          <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Import Backup</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Upload a JSON, CSV, or Excel file previously exported from this system.
            Sheet names or top-level keys must match table names (e.g. "projects", "clients").
          </p>

          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv,.xlsx,.xls"
              onChange={e => setImportFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>

          {importResult && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{importResult}</div>
          )}
          {importError && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{importError}</div>
          )}
        </CardContent></Card>
      </div>
    </AppLayout>
  )
}
