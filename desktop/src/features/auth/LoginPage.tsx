import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { errorMessage } from '../../lib/errors'
import { authService } from './authService'
import { authStore, useAuthStore } from './authStore'

export function LoginPage() {
  const session = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session.user?.tipo === 'ADMIN') return <Navigate to="/" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await authService.login(email, senha)
      if (response.usuario.tipo !== 'ADMIN') {
        throw new Error('Esta aplicacao e exclusiva para administradores.')
      }
      authStore.setSession(response.token, response.usuario)
      navigate('/')
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <p className="eyebrow">CollabResearch</p>
        <h1>Admin Desktop</h1>
        <p>Governanca, acompanhamento e seguranca da colaboracao cientifica em um unico painel.</p>
      </section>
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">Acesso administrativo</p>
        <h2>Entrar</h2>
        <Input label="Email" name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Senha" name="senha" type="password" required value={senha} onChange={(event) => setSenha(event.target.value)} />
        {error && <p className="login-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Autenticando...' : 'Entrar no painel'}</Button>
      </form>
    </main>
  )
}
