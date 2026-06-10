import { SignIn } from "@clerk/nextjs"
import { AuthLayout } from "@/components/platform/auth-layout"

export default function LoginPage() {
  return (
    <AuthLayout>
      <SignIn
        forceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/onboarding"
      />
    </AuthLayout>
  )
}
