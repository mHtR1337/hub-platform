"use client"

// TODO (Phase 1): Fetch /api/entitlements and return the list of active slugs.
// Used to optimistically show unlock state without a full page reload after checkout.
//
// import useSWR from 'swr'
//
// export function useEntitlements() {
//   const { data, isLoading } = useSWR<{ slugs: string[] }>('/api/entitlements')
//   return { slugs: data?.slugs ?? [], isLoading }
// }
//
// export function useHasEntitlement(slug: string) {
//   const { slugs, isLoading } = useEntitlements()
//   return { hasEntitlement: slugs.includes(slug), isLoading }
// }

export function useEntitlements() {
  return { slugs: [] as string[], isLoading: false }
}

export function useHasEntitlement(_slug: string) {
  return { hasEntitlement: false, isLoading: false }
}
