import { test as base, expect } from '@playwright/test'

type BenchmarkReport = {
  name: string
  durationMs: number
  metadata?: Record<string, string | number | boolean>
}

type BenchmarkFixtures = {
  report: (data: Omit<BenchmarkReport, 'name'>) => void
}

export const benchmark = base.extend<BenchmarkFixtures>({
  report: async ({}, use, testInfo) => {
    await use((data) => {
      console.log(`BENCHMARK ${JSON.stringify({ name: testInfo.title, ...data })}`)
    })
  },
})

export { expect }