'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', background: '#fff', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }
const VEHICLE_COLORS = { bike: { bg: '#dbeafe', color: '#1e40af' }, scooter: { bg: '#ede9fe', color: '#5b21b6' }, car: { bg: '#dcfce7', color: '#166534' }, van: { bg: '#fef9c3', color: '#854d0e' } }

function AgentDialog({ open, onClose, agent, onSaved }) {
  const isEdit = !!agent
  const [form, setForm] = useState({ name: '', phone: '', vehicleType: 'bike', isActive: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(agent ? { name: agent.name, phone: agent.phone, vehicleType: agent.vehicleType, isActive: agent.isActive } : { name: '', phone: '', vehicleType: 'bike', isActive: true })
  }, [agent, open])

  async function handleSave() {
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return }
    setSaving(true)
    const url = isEdit ? `/api/admin/agents/${agent.id}` : '/api/admin/agents'
    const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast.success(isEdit ? 'Agent updated' : 'Agent added'); onSaved(); onClose() }
    else toast.error('Failed to save')
  }

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--color-fm-line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>{isEdit ? 'Edit Agent' : 'Add Agent'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelStyle}>Name</label><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><label style={labelStyle}>Vehicle Type</label>
            <select style={inputStyle} value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}>
              {['bike', 'scooter', 'car', 'van'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="agentActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--color-fm-green)' }} />
            <label htmlFor="agentActive" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', cursor: 'pointer' }}>Active</label>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1.5px solid var(--color-fm-line-soft)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

function AssignDialog({ order, agents, onClose, onSaved }) {
  const [agentId, setAgentId] = useState(order.deliveryAgentId ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliveryAgentId: agentId || null }) })
    setSaving(false)
    if (res.ok) { toast.success('Assignment updated'); onSaved(); onClose() }
    else toast.error('Failed')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--color-fm-line-soft)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>Assign Delivery Agent</div>
        <div style={{ padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', marginBottom: 10 }}>Order #{order.id} · ₹{order.totalAmount.toFixed(2)}</div>
          <select style={inputStyle} value={agentId} onChange={e => setAgentId(e.target.value)}>
            <option value="">Unassigned</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.vehicleType})</option>)}
          </select>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1.5px solid var(--color-fm-line-soft)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Assign'}</button>
        </div>
      </div>
    </div>
  )
}

export default function DeliveryPage() {
  const [tab, setTab] = useState('agents')
  const [agents, setAgents] = useState([])
  const [orders, setOrders] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editAgent, setEditAgent] = useState(null)
  const [assignOrder, setAssignOrder] = useState(null)

  const fetchAgents = () => fetch('/api/admin/agents').then(r => r.json()).then(setAgents)
  const fetchOrders = () => fetch('/api/admin/orders').then(r => r.json()).then(d => setOrders(d.filter(o => !['delivered','cancelled','refunded'].includes(o.status))))

  useEffect(() => { fetchAgents(); fetchOrders() }, [])

  async function handleDeleteAgent(id, name) {
    if (!confirm(`Delete "${name}"?`)) return
    const res = await fetch(`/api/admin/agents/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Agent removed'); fetchAgents() }
    else toast.error('Failed')
  }

  async function handleToggleActive(agent) {
    const res = await fetch(`/api/admin/agents/${agent.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !agent.isActive }) })
    if (res.ok) fetchAgents()
    else toast.error('Failed')
  }

  const STATUS_COLORS = { pending: { bg: '#fef9c3', color: '#854d0e' }, processing: { bg: '#dbeafe', color: '#1e40af' }, out_for_delivery: { bg: '#ede9fe', color: '#5b21b6' } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Delivery</h1>
        </div>
        {tab === 'agents' && (
          <button onClick={() => { setEditAgent(null); setDialogOpen(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={15} /> Add Agent
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid var(--color-fm-line-soft)', paddingBottom: 0 }}>
        {['agents', 'assignments'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', background: tab === t ? '#fff' : 'transparent', color: tab === t ? 'var(--color-fm-ink)' : 'var(--color-fm-ink3)', borderBottom: tab === t ? '2px solid var(--color-fm-green)' : '2px solid transparent', marginBottom: -1.5 }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'agents' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              {['Name', 'Phone', 'Vehicle', 'Status', ''].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {agents.length === 0 ? <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No agents yet</td></tr>
              : agents.map((a, i) => {
                const vc = VEHICLE_COLORS[a.vehicleType] ?? { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={a.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{a.name}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{a.phone}</td>
                    <td style={{ padding: '10px 16px' }}><span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: vc.bg, color: vc.color }}>{a.vehicleType}</span></td>
                    <td style={{ padding: '10px 16px' }}>
                      <button onClick={() => handleToggleActive(a)} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', border: 'none', cursor: 'pointer', background: a.isActive ? '#dcfce7' : '#f1f5f9', color: a.isActive ? '#166534' : '#64748b' }}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditAgent(a); setDialogOpen(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex', padding: 4 }}><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteAgent(a.id, a.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 4 }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {orders.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', gridColumn: '1/-1' }}>No active orders needing assignment</div>
          ) : orders.map(o => {
            const sc = STATUS_COLORS[o.status] ?? { bg: '#f1f5f9', color: '#475569' }
            const assignedAgent = agents.find(a => a.id === o.deliveryAgentId)
            return (
              <div key={o.id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--color-fm-ink)' }}>#{o.id}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: sc.bg, color: sc.color }}>{o.status.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{o.customer?.name ?? 'Guest'}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>₹{o.totalAmount.toFixed(2)}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: assignedAgent ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink3)' }}>
                  {assignedAgent ? `Agent: ${assignedAgent.name}` : 'Unassigned'}
                </div>
                <button onClick={() => setAssignOrder(o)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--color-fm-ink2)', cursor: 'pointer' }}>
                  {assignedAgent ? 'Reassign' : 'Assign Agent'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <AgentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} agent={editAgent} onSaved={fetchAgents} />
      {assignOrder && <AssignDialog order={assignOrder} agents={agents.filter(a => a.isActive)} onClose={() => setAssignOrder(null)} onSaved={() => { fetchOrders(); fetchAgents() }} />}
    </div>
  )
}
