const TOKEN_KEY = 'collabresearch-admin-token'
const USER_KEY = 'collabresearch-admin-user'

export const tokenStorage = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  getUser: <T>() => {
    const value = sessionStorage.getItem(USER_KEY)
    return value ? (JSON.parse(value) as T) : null
  },
  save: <T>(token: string, user: T) => {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  },
}
