import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { errorMessage } from '../../lib/errors'
import type { UserRole } from '../auth/authTypes'
import { usersService } from './usersService'
import type { UserProfile } from './usersTypes'

export function UserFormModal({ user, initialRole, onSaved, onClose }: { user?: UserProfile; initialRole?: UserRole; onSaved: () => void; onClose: () => void }) {
  const [nome, setNome] = useState(user?.nome ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [senha, setSenha] = useState('')
  const [tipo, setTipo] = useState<UserRole>(user?.tipo ?? initialRole ?? 'ALUNO')
  const [instituicao, setInstituicao] = useState(user?.instituicao ?? '')
  const [ra, setRa] = useState(user?.ra ?? '')
  const [semestre, setSemestre] = useState(String(user?.semestre ?? ''))
  const [departamento, setDepartamento] = useState(user?.departamento ?? '')
  const [titulacao, setTitulacao] = useState(user?.titulacao ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      nome, email, tipo, instituicao,
      senha: senha || undefined,
      ra: tipo === 'ALUNO' ? ra : undefined,
      semestre: tipo === 'ALUNO' && semestre ? Number(semestre) : undefined,
      departamento: tipo === 'ORIENTADOR' ? departamento : undefined,
      titulacao: tipo === 'ORIENTADOR' ? titulacao : undefined,
    }
    try {
      if (user) await usersService.update(user.id, payload)
      else await usersService.create(payload)
      onSaved()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={user ? 'Editar usuario' : 'Novo usuario'} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Input label="Nome" required value={nome} onChange={(event) => setNome(event.target.value)} />
        <Input label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label={user ? 'Nova senha (opcional)' : 'Senha'} type="password" required={!user} minLength={8} value={senha} onChange={(event) => setSenha(event.target.value)} />
        <Select label="Perfil" value={tipo} disabled={Boolean(user)} onChange={(event) => setTipo(event.target.value as UserRole)} options={[
          { label: 'Aluno', value: 'ALUNO' }, { label: 'Orientador', value: 'ORIENTADOR' }, { label: 'Administrador', value: 'ADMIN' },
        ]} />
        <Input label="Instituicao" value={instituicao} onChange={(event) => setInstituicao(event.target.value)} />
        {tipo === 'ALUNO' && <><Input label="RA" required value={ra} onChange={(event) => setRa(event.target.value)} /><Input label="Semestre" type="number" min={1} value={semestre} onChange={(event) => setSemestre(event.target.value)} /></>}
        {tipo === 'ORIENTADOR' && <><Input label="Departamento" required value={departamento} onChange={(event) => setDepartamento(event.target.value)} /><Input label="Titulacao" required value={titulacao} onChange={(event) => setTitulacao(event.target.value)} /></>}
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions"><Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</Button></div>
      </form>
    </Modal>
  )
}
