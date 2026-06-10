import { SignUp } from '@clerk/nextjs'
import { AuthLayout } from '@/components/platform/auth-layout'

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  )
}
