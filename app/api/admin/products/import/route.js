import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { ApiError, apiError, apiResponse } from '@/lib/api-error'

const MAX_SIZE = 512_000
const VALID_UNITS = new Set(['piece', 'kg', 'g', 'litre', 'ml', 'pack', 'dozen'])
const REQUIRED_HEADERS = ['sku', 'name', 'price']

function parseCSVLine(line) {
  const fields = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else { field += c }
    } else {
      if (c === '"') { inQuotes = true }
      else if (c === ',') { fields.push(field.trim()); field = '' }
      else { field += c }
    }
  }
  fields.push(field.trim())
  return fields
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  return lines.filter(l => l.trim()).map(parseCSVLine)
}

export async function POST(request) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') throw new ApiError('No file provided', 400)

    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_SIZE) throw new ApiError('File exceeds 500 KB limit', 400)

    const text = new TextDecoder('utf-8').decode(arrayBuffer)
    const rows = parseCsv(text)

    if (rows.length < 2) throw new ApiError('No data rows found in CSV', 400)

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h))
    if (missing.length > 0) throw new ApiError(`Missing required columns: ${missing.join(', ')}`, 400)

    const col = (name) => headers.indexOf(name)
    const get = (row, name) => (row[col(name)] ?? '').trim()

    const allCategories = await prisma.category.findMany({ select: { id: true, name: true } })
    const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]))

    const errors = []
    const dataRows = rows.slice(1)

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNum = i + 2

      const sku = get(row, 'sku')
      const name = get(row, 'name')
      const price = get(row, 'price')
      const unit = get(row, 'unit')
      const stockQty = get(row, 'stock_qty')
      const isActive = get(row, 'is_active')
      const imageUrl = get(row, 'image_url')
      const category = get(row, 'category')
      const variantName = get(row, 'variant_name')
      const variantPrice = get(row, 'variant_price')
      const variantStockQty = get(row, 'variant_stock_qty')

      if (!sku) errors.push({ row: rowNum, field: 'sku', message: 'SKU is required' })
      if (!name) errors.push({ row: rowNum, field: 'name', message: 'Name is required' })

      const priceNum = parseFloat(price)
      if (!price || isNaN(priceNum) || priceNum < 0) {
        errors.push({ row: rowNum, field: 'price', message: 'Must be a non-negative number' })
      }

      if (unit && !VALID_UNITS.has(unit)) {
        errors.push({ row: rowNum, field: 'unit', message: `Must be one of: ${[...VALID_UNITS].join(', ')}` })
      }

      if (stockQty && (isNaN(parseInt(stockQty)) || parseInt(stockQty) < 0)) {
        errors.push({ row: rowNum, field: 'stock_qty', message: 'Must be a non-negative integer' })
      }

      if (isActive && !['true', 'false'].includes(isActive.toLowerCase())) {
        errors.push({ row: rowNum, field: 'is_active', message: 'Must be true or false' })
      }

      if (imageUrl && !imageUrl.startsWith('https://res.cloudinary.com/')) {
        errors.push({ row: rowNum, field: 'image_url', message: 'Must be a Cloudinary URL (https://res.cloudinary.com/...)' })
      }

      if (category && !categoryMap.has(category.toLowerCase())) {
        errors.push({ row: rowNum, field: 'category', message: `Category "${category}" not found` })
      }

      if (variantName) {
        const vp = parseFloat(variantPrice)
        if (!variantPrice || isNaN(vp) || vp < 0) {
          errors.push({ row: rowNum, field: 'variant_price', message: 'Required when variant_name is provided' })
        }
      }

      if (variantStockQty && (isNaN(parseInt(variantStockQty)) || parseInt(variantStockQty) < 0)) {
        errors.push({ row: rowNum, field: 'variant_stock_qty', message: 'Must be a non-negative integer' })
      }
    }

    if (errors.length > 0) return apiResponse({ ok: false, errors }, 400)

    // Group rows by SKU — first row sets product fields, all rows contribute variants
    const groups = new Map()
    for (const row of dataRows) {
      const sku = get(row, 'sku')
      if (!groups.has(sku)) {
        const catName = get(row, 'category')
        groups.set(sku, {
          sku,
          name: get(row, 'name'),
          description: get(row, 'description') || null,
          categoryId: catName ? (categoryMap.get(catName.toLowerCase()) ?? null) : null,
          price: parseFloat(get(row, 'price')),
          unit: get(row, 'unit') || 'piece',
          stockQty: parseInt(get(row, 'stock_qty')) || 0,
          imageUrl: get(row, 'image_url') || null,
          isActive: get(row, 'is_active').toLowerCase() !== 'false',
          variants: [],
        })
      }
      const variantName = get(row, 'variant_name')
      if (variantName) {
        groups.get(sku).variants.push({
          name: variantName,
          price: parseFloat(get(row, 'variant_price')),
          stockQty: parseInt(get(row, 'variant_stock_qty')) || 0,
        })
      }
    }

    let imported = 0
    let variantsCreated = 0

    await prisma.$transaction(async (tx) => {
      for (const group of groups.values()) {
        const { sku, variants, ...productData } = group

        const product = await tx.product.upsert({
          where: { sku },
          create: { sku, ...productData },
          update: productData,
        })

        if (variants.length > 0) {
          await tx.productVariant.deleteMany({ where: { productId: product.id } })
          await tx.productVariant.createMany({
            data: variants.map(v => ({ ...v, productId: product.id })),
          })
          variantsCreated += variants.length
        }

        imported++
      }
    })

    return apiResponse({ ok: true, imported, variantsCreated }, 201)
  } catch (e) {
    return apiError(e)
  }
}
