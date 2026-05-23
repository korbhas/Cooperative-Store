import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const settings = await prisma.setting.findMany()
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    return apiResponse(map)
  } catch (e) { return apiError(e) }
}

export async function PATCH(request) {
  try {
    await requireAdmin()
    const body = await request.json()
    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    )
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}
