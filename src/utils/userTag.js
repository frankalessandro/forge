// El tag se guarda en minúsculas pero se muestra en mayúsculas.

export function formatUserTag(username, tag) {
  if (!username) return ''
  return tag ? `${username}#${tag.toUpperCase()}` : username
}

// Parsea "username#A3F9K" -> { username, tag } en minúsculas, o null si no
// cumple el formato esperado.
export function parseUserTag(input) {
  const raw = (input ?? '').trim()
  const match = raw.match(/^([a-zA-Z0-9_]{3,12})#([a-zA-Z0-9]{1,5})$/)
  if (!match) return null
  return { username: match[1].toLowerCase(), tag: match[2].toLowerCase() }
}
