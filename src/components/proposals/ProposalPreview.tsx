import { useRef } from 'react'
import type { ProposalWithRelations } from '../../types'
import { TEMPLATE_LABELS } from '../../types'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Props {
  proposal: ProposalWithRelations
  onClose: () => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtCost(n: number) {
  return `₹${Math.round(n).toLocaleString()}`
}

export function downloadPdf(element: HTMLElement, filename: string) {
  html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    let heightLeft = pdfHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
    heightLeft -= pdf.internal.pageSize.getHeight()

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
    }

    pdf.save(filename)
  })
}

export default function ProposalPreview({ proposal, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  function handleDownload() {
    if (ref.current) {
      const filename = `${proposal.template}_${proposal.proposal_number}.pdf`
      downloadPdf(ref.current, filename)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 shadow">
        <h2 className="text-sm font-semibold text-gray-700">
          {TEMPLATE_LABELS[proposal.template]} — {proposal.proposal_number}
        </h2>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Download PDF
          </button>
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="flex-1 overflow-y-auto bg-gray-200 p-4">
        <div className="mx-auto max-w-[210mm] shadow-xl" ref={ref}>
          <div className="bg-white p-8 md:p-12" style={{ fontFamily: 'serif' }}>
            {/* Header */}
            <div className="border-b-2 border-gray-900 pb-4">
              <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Proline Architects</h1>
              <p className="mt-1 text-xs text-gray-500">Architecture | Interior | Planning</p>
            </div>

            {/* Title */}
            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold uppercase text-gray-900">{TEMPLATE_LABELS[proposal.template]}</h2>
              <p className="mt-1 text-sm text-gray-500">Proposal No: {proposal.proposal_number}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(proposal.created_at)}</p>
            </div>

            {/* Client Info */}
            <div className="mt-6 border border-gray-300 p-4">
              <h3 className="text-sm font-bold uppercase text-gray-700">Prepared For</h3>
              <p className="mt-1 text-base font-medium text-gray-900">{proposal.client_name}</p>
              {proposal.project_name && (
                <p className="text-sm text-gray-600">Project: {proposal.project_name}</p>
              )}
            </div>

            {/* Scope of Work */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase text-gray-700">1. Scope of Work</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{proposal.scope_of_work}</p>
            </div>

            {/* Fee */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase text-gray-700">2. Fee</h3>
              <p className="mt-1 text-lg font-bold text-gray-900">{fmtCost(proposal.fee_amount)}</p>
            </div>

            {/* Deliverables */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase text-gray-700">3. Deliverables</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{proposal.deliverables}</p>
            </div>

            {/* Timeline */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase text-gray-700">4. Timeline</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{proposal.timeline}</p>
            </div>

            {/* Terms */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase text-gray-700">5. Terms & Conditions</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{proposal.terms_conditions}</p>
            </div>

            {/* Footer */}
            <div className="mt-10 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
              <p>Proline Architects — This is a computer-generated proposal.</p>
              <p>{proposal.proposal_number} | {formatDate(proposal.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
