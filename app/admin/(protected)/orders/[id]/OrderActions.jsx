'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']

const selectStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)',
  fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)',
  background: '#fff', cursor: 'pointer', outline: 'none',
}

export default function OrderActions({ orderId, currentStatus, currentAgentId, agents }) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [agentId, setAgentId] = useState(currentAgentId ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, deliveryAgentId: agentId || null }),
      })
      if (!res.ok) throw new Error()
      toast.success('Order updated')
      router.refresh()
    } catch {
      toast.error('Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', padding: 20, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Status</div>
        <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Delivery Agent</div>
        <select value={agentId} onChange={e => setAgentId(e.target.value)} style={selectStyle}>
          <option value="">Unassigned</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '9px 20px', borderRadius: 8, border: 'none',
          background: saving ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)',
          color: saving ? 'var(--color-fm-green-ink)' : '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
