import { supabase } from '../supabase'
import * as XLSX from 'xlsx'

export type ExportTable = 'projects' | 'clients' | 'payments' | 'expenses' | 'targets' | 'documents'
export type ExportFormat = 'json' | 'csv' | 'excel'

const TABLE_LABELS: Record<ExportTable, string> = {
  projects: 'Projects',
  clients: 'Clients',
  payments: 'Payments',
  expenses: 'Expenses',
  targets: 'Targets',
  documents: 'Documents Metadata',
}

async function fetchTable(table: ExportTable): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => {
    const { user_id: _, ...rest } = row
    return rest
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    const vals = headers.map(h => {
      const v = row[h]
      if (v == null) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    })
    lines.push(vals.join(','))
  }
  return lines.join('\n')
}

export async function exportTable(table: ExportTable, format: ExportFormat) {
  const rows = await fetchTable(table)
  const label = TABLE_LABELS[table].replace(/\s+/g, '_').toLowerCase()
  const date = new Date().toISOString().slice(0, 10)

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${label}_${date}.json`)
  } else if (format === 'csv') {
    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    downloadBlob(blob, `${label}_${date}.csv`)
  } else if (format === 'excel') {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, TABLE_LABELS[table])
    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    downloadBlob(blob, `${label}_${date}.xlsx`)
  }
}

export async function exportAllData(format: ExportFormat) {
  const tables: ExportTable[] = ['clients', 'projects', 'payments', 'expenses', 'targets', 'documents']
  const date = new Date().toISOString().slice(0, 10)

  if (format === 'json') {
    const all: Record<string, Record<string, unknown>[]> = {}
    for (const table of tables) {
      all[table] = await fetchTable(table)
    }
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `proline_backup_${date}.json`)
  } else if (format === 'excel') {
    const wb = XLSX.utils.book_new()
    for (const table of tables) {
      const rows = await fetchTable(table)
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, TABLE_LABELS[table])
    }
    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    downloadBlob(blob, `proline_backup_${date}.xlsx`)
  }
}

export async function parseImportFile(file: File): Promise<Record<string, Record<string, unknown>[]>> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'json') {
    const text = await file.text()
    const data = JSON.parse(text)
    return data
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const result: Record<string, Record<string, unknown>[]> = {}
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
      result[sheetName] = rows
    }
    return result
  }

  if (ext === 'csv') {
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    if (lines.length < 2) return {}
    const headers = lines[0].split(',').map(h => h.trim())
    const rows: Record<string, unknown>[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: Record<string, unknown> = {}
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? null })
      rows.push(row)
    }
    return { Imported: rows }
  }

  throw new Error('Unsupported file format. Use JSON, CSV, or Excel.')
}

export async function importTable(table: ExportTable, rows: Record<string, unknown>[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from(table).insert(
    rows.map(r => ({ ...r, user_id: user.id })),
  )
  if (error) throw error
}

export { TABLE_LABELS }
