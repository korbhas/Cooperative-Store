import { uploadImage } from '@/lib/cloudinary'
import { apiResponse, apiError } from '@/lib/api-error'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') return apiError({ message: 'No file', status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`
    const url = await uploadImage(dataUri)
    return apiResponse({ url })
  } catch (err) {
    return apiError(err)
  }
}
