'use client'

import { useState, useRef } from 'react'
import { IconX, IconUpload, IconFileDownload, IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function ImportCsvDialog({ open, onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [errors, setErrors] = useState(null)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  function reset() { setFile(null); setErrors(null); setResult(null) }

  function handleClose() { reset(); onClose() }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setErrors(null)
    setResult(null)
    e.target.value = ''
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.ok) {
        setResult(data)
      } else if (data.errors) {
        setErrors(data.errors)
      } else {
        toast.error(data.error ?? 'Import failed')
      }
    } catch {
      toast.error('Import failed — please try again')
    } finally {
      setImporting(false)
    }
  }

  function handleDone() { reset(); onClose(); onImported() }

  if (!open) return null

  const disabled = !file || importing

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={handleClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--color-fm-line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--color-fm-ink)' }}>Import Products</div>
          <button onClick={handleClose} aria-label="Close dialog" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex' }}><IconX size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
              <IconCircleCheck size={52} color="#16a34a" stroke={1.5} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 6 }}>Import successful</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink2)' }}>
                  {result.imported} product{result.imported !== 1 ? 's' : ''} imported
                  {result.variantsCreated > 0 ? `, ${result.variantsCreated} variant${result.variantsCreated !== 1 ? 's' : ''} created` : ''}
                </div>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink2)', lineHeight: 1.6, margin: 0 }}>
                Upload a CSV to create or update products in bulk. Each row is matched by its <strong>SKU</strong> — existing products are updated, new SKUs are created.
              </p>

              <a
                href="/products_import_template.csv"
                download
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--color-fm-ink2)', textDecoration: 'none', alignSelf: 'flex-start' }}
              >
                <IconFileDownload size={15} color="var(--color-fm-green)" />
                Download template
              </a>

              {errors && (
                <div>
                  <Alert variant="destructive" className="mb-2.5">
                    <IconAlertCircle />
                    <AlertTitle>{errors.length} error{errors.length !== 1 ? 's' : ''} — no products were created</AlertTitle>
                    <AlertDescription>Fix the rows below and upload the file again.</AlertDescription>
                  </Alert>
                  <div style={{ maxHeight: 220, overflowY: 'auto', border: '1.5px solid var(--color-fm-line-soft)', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Row', 'Field', 'Issue'].map(h => (
                            <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {errors.map((err, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--color-fm-line-soft)' }}>
                            <td style={{ padding: '6px 12px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', fontVariantNumeric: 'tabular-nums' }}>{err.row}</td>
                            <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fm-ink2)' }}>{err.field}</td>
                            <td style={{ padding: '6px 12px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)' }}>{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, border: '1.5px solid var(--color-fm-green)', background: 'var(--color-fm-green-soft)' }}>
                  <IconUpload size={15} color="var(--color-fm-green-ink)" />
                  <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', flexShrink: 0 }}>{(file.size / 1024).toFixed(1)} KB</span>
                  <button onClick={() => setFile(null)} aria-label="Remove selected file" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex', padding: 2 }}><IconX size={14} /></button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', padding: '28px 16px', borderRadius: 8, border: '1.5px dashed var(--color-fm-line-soft)', background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                  <IconUpload size={22} color="var(--color-fm-ink3)" stroke={1.5} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>Click to select a CSV file</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>Max 500 KB</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--color-fm-line-soft)', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: '#fff' }}>
          {result ? (
            <button onClick={handleDone} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          ) : (
            <>
              <button onClick={handleClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--color-fm-ink2)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleImport} disabled={disabled} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: disabled ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)', color: disabled ? 'var(--color-fm-green-ink)' : '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' }}>
                {importing ? 'Importing…' : 'Import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
