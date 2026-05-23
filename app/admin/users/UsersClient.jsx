'use client'

import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', background: '#fff', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }

function EditDialog({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name ?? '', phone: user.phone ?? '', role: user.role, isBanned: user.isBanned })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast.success('User updated'); onSaved() }
    else toast.error('Failed to update')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--color-fm-line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>Edit User</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>{user.email}</div>
          <div><label style={labelStyle}>Name</label><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><label style={labelStyle}>Role</label>
            <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="isBanned" checked={form.isBanned} onChange={e => setForm(f => ({ ...f, isBanned: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#dc2626' }} />
            <label htmlFor="isBanned" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626', cursor: 'pointer', fontWeight: 500 }}>Banned</label>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1.5px solid var(--color-fm-line-soft)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function UsersClient({ initialUsers }) {
  const router = useRouter()
  const [editUser, setEditUser] = useState(null)

  function handleSaved() { setEditUser(null); router.refresh() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Customers</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>{initialUsers.length} users</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Name / Email', 'Phone', 'Role', 'Orders', 'Spent', 'Status', 'Joined', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialUsers.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No users</td></tr>
            ) : initialUsers.map((u, i) => (
              <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined, background: u.isBanned ? '#fff5f5' : 'transparent' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{u.name ?? '—'}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{u.phone ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: u.role === 'admin' ? '#ede9fe' : 'var(--color-fm-green-soft)', color: u.role === 'admin' ? '#5b21b6' : 'var(--color-fm-green-ink)' }}>{u.role}</span>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', textAlign: 'center' }}>{u.orderCount}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>₹{u.totalSpent.toFixed(2)}</td>
                <td style={{ padding: '10px 14px' }}>
                  {u.isBanned && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: '#fee2e2', color: '#991b1b' }}>Banned</span>}
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', whiteSpace: 'nowrap' }}>
                  {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => setEditUser(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex', padding: 4 }}><Pencil size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && <EditDialog user={editUser} onClose={() => setEditUser(null)} onSaved={handleSaved} />}
    </div>
  )
}
