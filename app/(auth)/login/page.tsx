import { AuthLayout } from "@/components/platform/auth-layout"
import { AuthForm } from "@/components/platform/auth-form"

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthForm mode="login" />
    </AuthLayout>
  )
}
