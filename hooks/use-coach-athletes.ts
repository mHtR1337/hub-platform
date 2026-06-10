"use client"

// TODO (Phase 4): Fetch /api/coach/athletes for the coach dashboard.
//
// import useSWR from 'swr'
// import type { CoachAthlete } from '@/types'
//
// export function useCoachAthletes() {
//   const { data, isLoading, mutate } = useSWR<{ athletes: CoachAthlete[] }>('/api/coach/athletes')
//   return { athletes: data?.athletes ?? [], isLoading, mutate }
// }

export function useCoachAthletes() {
  return { athletes: [] as never[], isLoading: false, mutate: async () => {} }
}
