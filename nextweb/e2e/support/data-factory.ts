import { v4 as uuidv4 } from 'uuid'

export function generateUniqueEmail() {
  return `test-${uuidv4()}@example.com`
}

export function generateUniqueName() {
  return `Test User ${uuidv4().slice(0, 8)}`
}

export function generateUniqueDocument() {
  return `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}