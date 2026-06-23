import { test, expect } from '@playwright/test'

test('calcula mediana corretamente', () => {
  const valores = [100, 200, 150, 180, 120]
  const mediana = calcularMediana(valores)
  expect(mediana).toBe(150)
})

test('calcula percentil 95 corretamente', () => {
  const valores = Array.from({ length: 100 }, (_, i) => i + 1)
  const p95 = calcularPercentil(valores, 95)
  expect(p95).toBe(95)
})

function calcularMediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 !== 0
    ? ordenados[meio]
    : (ordenados[meio - 1] + ordenados[meio]) / 2
}

function calcularPercentil(valores: number[], percentil: number): number {
  const ordenados = [...valores].sort((a, b) => a - b)
  const indice = Math.ceil((percentil / 100) * ordenados.length) - 1
  return ordenados[indice]
}