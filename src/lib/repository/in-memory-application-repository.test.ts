import { describe, expect, it } from 'vitest'
import { InMemoryApplicationRepository } from './in-memory-application-repository'
import type { Application } from './application-repository'

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app_1', briefId: 'brief_1', creatorId: 'creator_1',
    quoteAmount: 18000, currency: 'INR', message: 'hi', status: 'applied',
    createdAt: '2026-06-08T00:00:00.000Z', ...overrides,
  }
}

describe('InMemoryApplicationRepository', () => {
  it('saves and gets by id', async () => {
    const repo = new InMemoryApplicationRepository()
    await repo.saveApplication(makeApp())
    expect((await repo.getApplicationById('app_1'))?.quoteAmount).toBe(18000)
  })
  it('returns null for an unknown id', async () => {
    expect(await new InMemoryApplicationRepository().getApplicationById('x')).toBeNull()
  })
  it('lists applications by brief', async () => {
    const repo = new InMemoryApplicationRepository()
    await repo.saveApplication(makeApp({ id: 'a1', briefId: 'b1' }))
    await repo.saveApplication(makeApp({ id: 'a2', briefId: 'b2' }))
    expect((await repo.listApplicationsByBrief('b1')).map((a) => a.id)).toEqual(['a1'])
  })
  it('finds an existing application by brief + creator', async () => {
    const repo = new InMemoryApplicationRepository()
    await repo.saveApplication(makeApp({ briefId: 'b1', creatorId: 'c1' }))
    expect(await repo.findApplication('b1', 'c1')).not.toBeNull()
    expect(await repo.findApplication('b1', 'c2')).toBeNull()
  })
})
