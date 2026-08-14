const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateRoomCode(length = 4) {
  let code = ''
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
    for (let i = 0; i < length; i++) {
      code += ROOM_ALPHABET[bytes[i] % ROOM_ALPHABET.length]
    }
    return code
  }
  for (let i = 0; i < length; i++) {
    code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]
  }
  return code
}

export function normalizeRoomCode(value) {
  const raw = String(value || '').trim()
  if (raw.toLowerCase() === 'main-room') return 'main-room'
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function isValidRoomCode(value) {
  const code = normalizeRoomCode(value)
  if (code === 'main-room') return true
  return code.length >= 4 && code.length <= 8
}

export function getOrCreatePlayerId() {
  const key = 'whois25_playerId'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(key, id)
  }
  return id
}

export function playerPageUrl(roomCode) {
  return `${window.location.origin}/player?room=${encodeURIComponent(roomCode)}`
}

export function parseRoomFromQr(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  try {
    const url = new URL(text)
    const room = url.searchParams.get('room')
    if (room) return normalizeRoomCode(room)
  } catch {
    // not a URL — treat as a raw room code
  }
  return normalizeRoomCode(text)
}
