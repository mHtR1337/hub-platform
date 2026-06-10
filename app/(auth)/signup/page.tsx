import { AuthLayout } from "@/components/platform/auth-layout"
import { AuthForm } from "@/components/platform/auth-form"

export default function SignupPage() {
  return (
    <AuthLayout>
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
