import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input } from '../../components/ui/Input'
import { LoadingState } from '../../components/ui/LoadingState'
import { useToast } from '../../components/ui/Toast'
import { errorMessage } from '../../lib/errors'
import { settingsService } from './settingsService'
import type { SystemSetting } from './settingsTypes'

function SettingForm({ setting, onSaved }: { setting: SystemSetting; onSaved: (updated: SystemSetting) => void }) {
  const [value, setValue] = useState(setting.valor)
  const [busy, setBusy] = useState(false)
  const { notify } = useToast()
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const updated = await settingsService.update(setting.chave, value, setting.descricao)
      onSaved(updated)
      notify('Configuracao salva.')
    } catch (caught) { notify(errorMessage(caught), 'error') } finally { setBusy(false) }
  }
  return (
    <form className="setting-row" onSubmit={submit}>
      <div><strong>{setting.chave}</strong><p>{setting.descricao}</p></div>
      <Input aria-label={setting.chave} value={value} onChange={(event) => setValue(event.target.value)} />
      <Button variant="secondary" disabled={busy} type="submit">Salvar</Button>
    </form>
  )
}

export function SettingsPage() {
  const [items, setItems] = useState<SystemSetting[] | null>(null)
  const [error, setError] = useState('')
  const load = async () => {
    try { setError(''); setItems(await settingsService.list()) } catch (caught) { setError(errorMessage(caught)) }
  }
  useEffect(() => { void load() }, [])
  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Sistema</p><h1>Configuracoes</h1><p>Valores operacionais permitidos para o painel administrativo.</p></div></header>
      <Card title="Configuracoes gerais">
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : !items ? <LoadingState /> : items.map((setting) => (
          <SettingForm key={setting.chave} setting={setting} onSaved={(updated) => setItems((current) => current?.map((item) => item.chave === updated.chave ? updated : item) ?? [])} />
        ))}
      </Card>
    </div>
  )
}
