import { AuthLayout } from "@/components/auth-layout"
import { AuthForm } from "@/components/auth-form"

export default function SignupPage() {
  return (
    <AuthLayout>
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
