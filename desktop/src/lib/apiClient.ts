import { ApiError } from './errors'
import { tokenStorage } from './tokenStorage'

type RequestOptions = RequestInit & { skipAuth?: boolean }
type ResponseType = 'text' | 'binary'

const apiUrl = () => {
  const configured = import.meta.env.VITE_API_URL as string | undefined
  return (configured?.replace(/\/$/, '') || '/api')
}

const isOk = (status: number) => status >= 200 && status < 300

type ApiErrorBody = {
  message?: string
  code?: string
  errors?: Array<{ field?: string; message?: string }>
}

const parseApiErrorBody = (responseBody: string): ApiErrorBody | null => {
  try {
    const parsed: unknown = JSON.parse(responseBody)
    if (!parsed || typeof parsed !== 'object') return null
    const body = parsed as ApiErrorBody
    return body
  } catch {
    return null
  }
}

const formatApiError = (body: ApiErrorBody | null) => {
  const validationMessages = body?.errors
    ?.map((item) => item.field && item.message ? `${item.field}: ${item.message}` : item.message)
    .filter((message): message is string => Boolean(message))
  const detail = validationMessages?.join('; ')
  if (body?.message && detail && body.message !== detail) return `${body.message}: ${detail}`
  return detail || body?.message || 'Erro ao comunicar com o servidor.'
}

const send = async (path: string, options: RequestOptions = {}, responseType: ResponseType = 'text'): Promise<DesktopApiResponse> => {
  const { skipAuth, headers, ...init } = options
  const token = tokenStorage.getToken()

  if (window.location.protocol === 'file:' && window.desktop?.request) {
    if (init.body && typeof init.body !== 'string') {
      throw new ApiError('Tipo de requisicao nao suportado no aplicativo desktop.', 0)
    }

    return window.desktop.request({
      path,
      method: init.method || 'GET',
      body: typeof init.body === 'string' ? init.body : undefined,
      token: !skipAuth && token ? token : undefined,
      responseType,
    })
  }

  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  return {
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    body: responseType === 'binary'
      ? new Uint8Array(await response.arrayBuffer())
      : await response.text(),
  }
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await send(path, options)

  if (response.status === 401 && !options.skipAuth) {
    tokenStorage.clear()
    window.dispatchEvent(new CustomEvent('auth:expired'))
  }

  if (!isOk(response.status)) {
    const body = typeof response.body === 'string' ? parseApiErrorBody(response.body) : null
    throw new ApiError(formatApiError(body), response.status, body?.code)
  }

  if (response.status === 204) return undefined as T
  if (typeof response.body !== 'string') {
    throw new ApiError('Resposta invalida recebida do servidor.', response.status)
  }
  return response.contentType.includes('application/json')
    ? JSON.parse(response.body) as T
    : response.body as T
}

const blob = async (path: string): Promise<Blob> => {
  const response = await send(path, {}, 'binary')
  if (!isOk(response.status)) throw new ApiError('Nao foi possivel carregar o documento.', response.status)
  if (!(response.body instanceof Uint8Array)) throw new ApiError('Resposta invalida recebida do servidor.', response.status)
  return new Blob([response.body], { type: response.contentType })
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, skipAuth = false) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, skipAuth }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
  blob,
}
