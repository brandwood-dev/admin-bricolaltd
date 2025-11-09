// Using global Socket.IO client from CDN loaded in index.html
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    io: any
  }
}

let adminSocket: any | null = null

export function getAdminSocket(): any | null {
  try {
    if (adminSocket) return adminSocket

    // Construct connection with JWT from localStorage
    const token = localStorage.getItem('admin_token')
    if (!token) return null

    if (!window.io) {
      console.warn('[AdminSocket] window.io not available')
      return null
    }
    // Build WS base from API base: drop trailing /api for namespaces
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
    const wsBase = apiBase.replace(/\/(api)\/?$/, '')

    adminSocket = window.io(`${wsBase}/admin-notifications`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
    })

    // Optional: basic connection logging
    adminSocket.on('connect', () => {
      console.log('[AdminSocket] Connected', adminSocket?.id)
    })

    adminSocket.on('connect_error', (err) => {
      console.warn('[AdminSocket] Connection error', err.message)
    })

    adminSocket.on('disconnect', (reason: string) => {
      console.log('[AdminSocket] Disconnected', reason)
    })

    return adminSocket
  } catch (e) {
    console.warn('[AdminSocket] Failed to init', e)
    return null
  }
}

export function closeAdminSocket() {
  try {
    adminSocket?.disconnect()
    adminSocket = null
  } catch (e) {
    console.warn('[AdminSocket] Failed to close', e)
  }
}
