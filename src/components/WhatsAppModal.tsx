import { useState } from 'react'
import type { WhatsAppTemplate } from '../types'
import { WHATSAPP_TEMPLATES } from '../types'
import { generateWhatsAppUrl } from '../lib/api/followups'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'

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
            <Button
              key={t}
              type="button"
              size="sm"
              variant={template === t ? 'success' : 'secondary'}
              onClick={() => selectTemplate(t)}
            >
              {t.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>

        <Textarea
          rows={4}
          value={message}
          onChange={e => { setMessage(e.target.value); setTemplate('custom') }}
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="success" onClick={send}>
            Send via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}
