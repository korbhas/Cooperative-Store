import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'

// Signed-in customer's profile snapshot (loyalty balance for checkout/settings UI)
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) throw new ApiError('Unauthorized', 401)

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    if (!email) throw new ApiError('No email on account', 400)

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { name: true, email: true, loyaltyPoints: true },
    })

    return apiResponse({
      name: dbUser?.name ?? null,
      email,
      loyaltyPoints: dbUser?.loyaltyPoints ?? 0,
    })
  } catch (err) {
    return apiError(err)
  }
}
