import WelcomeScreen from '@/components/welcome/WelcomeScreen'
import { welcomeIllustrations } from '@/components/welcome/illustrations'

export const metadata = {
  title: 'Welcome — FreshMart',
  description: 'Fresh groceries, delivered fast',
  robots: { index: false },
}

export default function WelcomePage() {
  return <WelcomeScreen illustrations={welcomeIllustrations()} />
}
