import { prisma } from '@/lib/prisma'
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/config'

export async function getSettings() {
  const rows = await prisma.setting.findMany()
  const db = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    storeName:             db.store_name             ?? 'TU Cooperative Store',
    storePhone:            db.store_phone            ?? '',
    storeEmail:            db.store_email            ?? '',
    storeAddress:          db.store_address          ?? '',
    deliveryFee:           Number(db.delivery_fee            ?? DELIVERY_FEE),
    freeDeliveryThreshold: Number(db.free_delivery_threshold ?? FREE_DELIVERY_THRESHOLD),
    minOrderAmount:        Number(db.min_order_amount        ?? 0),
    estimatedDeliveryTime: db.estimated_delivery_time ?? '30–45 mins',
    lowStockThreshold:     Number(db.low_stock_threshold     ?? 10),
  }
}
