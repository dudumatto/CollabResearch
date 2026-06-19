export const exportCsv = (name: string, rows: Array<Record<string, string | number>>) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const content = [headers.map(escape).join(';'), ...rows.map((row) => headers.map((key) => escape(row[key])).join(';'))].join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
