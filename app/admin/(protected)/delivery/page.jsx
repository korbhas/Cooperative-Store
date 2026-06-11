'use client'

import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const VEHICLE_COLORS = { bike: { bg: '#dbeafe', color: '#1e40af' }, scooter: { bg: '#ede9fe', color: '#5b21b6' }, car: { bg: '#dcfce7', color: '#166534' }, van: { bg: '#fef9c3', color: '#854d0e' } }

const agentSchema = z.object({
  name: z.string().trim().min(1, 'Agent name is required.'),
  phone: z.string().trim().min(1, 'Phone number is required.'),
  vehicleType: z.enum(['bike', 'scooter', 'car', 'van']),
  isActive: z.boolean(),
})

const EMPTY_AGENT = { name: '', phone: '', vehicleType: 'bike', isActive: true }

function AgentDialog({ open, onClose, agent, onSaved }) {
  const isEdit = !!agent
  const [saving, setSaving] = useState(false)

  const form = useForm({
    defaultValues: EMPTY_AGENT,
    validators: { onSubmit: agentSchema },
    onSubmit: async ({ value }) => save(value),
  })

  useEffect(() => {
    form.reset(agent
      ? { name: agent.name, phone: agent.phone, vehicleType: agent.vehicleType, isActive: agent.isActive }
      : EMPTY_AGENT)
  }, [agent, open, form])

  async function save(value) {
    setSaving(true)
    const url = isEdit ? `/api/admin/agents/${agent.id}` : '/api/admin/agents'
    const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
    setSaving(false)
    if (res.ok) { toast.success(isEdit ? 'Agent updated' : 'Agent added'); onSaved(); onClose() }
    else toast.error('Failed to save')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Agent' : 'Add Agent'}</DialogTitle>
        </DialogHeader>

        <form
          id="agent-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4">
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="agent-name">Name</FieldLabel>
                    <Input
                      id="agent-name"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="phone">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="agent-phone">Phone</FieldLabel>
                    <Input
                      id="agent-phone"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      type="tel"
                      autoComplete="off"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="vehicleType">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="agent-vehicle">Vehicle Type</FieldLabel>
                  <Select name={field.name} value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id="agent-vehicle" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['bike', 'scooter', 'car', 'van'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="isActive">
              {(field) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="agent-active"
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                  <FieldLabel htmlFor="agent-active" className="font-normal">
                    Active
                  </FieldLabel>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="agent-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Delivery Agent</DialogTitle>
          <DialogDescription>
            Order #{order.id} · ₹{order.totalAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="assign-agent">Agent</FieldLabel>
          <Select
            value={agentId === '' ? '__unassigned' : String(agentId)}
            onValueChange={val => setAgentId(val === '__unassigned' ? '' : val)}
          >
            <SelectTrigger id="assign-agent" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned">Unassigned</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.vehicleType})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
            <IconPlus size={15} /> Add Agent
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
                        <button onClick={() => { setEditAgent(a); setDialogOpen(true) }} aria-label={`Edit agent ${a.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex', padding: 4 }}><IconPencil size={14} /></button>
                        <button onClick={() => handleDeleteAgent(a.id, a.name)} aria-label={`Delete agent ${a.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 4 }}><IconTrash size={14} /></button>
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
