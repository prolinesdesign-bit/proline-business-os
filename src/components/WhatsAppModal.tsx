import { useState } from 'react'
import type { WhatsAppTemplate } from '../types'
import { WHATSAPP_TEMPLATES } from '../types'
import { generateWhatsAppUrl } from '../lib/api/followups'

interface Props {
  phone: string
  clientName: string
  onClose: () => void
}

export default function WhatsAppModal({ phone, clientName, onClose }: Props) {
  const [template, setTemplate] = useState<WhatsAppTemplate>('payment_reminder')
  const [message, setMessage] = useState(() => WHATSAPP_TEMPLATES.payment_reminder(clientName))

  function selectTemplate(t: WhatsAppTemplate) {
    setTemplate(t)
    setMessage(WHATSAPP_TEMPLATES[t](clientName))
  }

  function send() {
    const url = generateWhatsAppUrl(phone, message)
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-1">WhatsApp to {clientName}</h2>
        <p className="text-sm text-gray-500 mb-4">{phone}</p>

        <div className="flex gap-2 mb-3 flex-wrap">
          {(Object.keys(WHATSAPP_TEMPLATES) as WhatsAppTemplate[]).map(t => (
            <button
              key={t}
              onClick={() => selectTemplate(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                template === t
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={message}
          onChange={e => { setMessage(e.target.value); setTemplate('custom') }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={send} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
