import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Check, X, ChevronRight, Clock, Users, Copy, AtSign, Send, Flame, Crown } from 'lucide-react'
import { sileo } from 'sileo'
import { useFriends } from '../../hooks/useFriends'
import { useProfile } from '../../hooks/useProfile'
import PageHeader from '../../components/ui/PageHeader'
import TutorialGuide from '../../components/features/TutorialGuide'
import { formatUserTag, parseUserTag } from '../../utils/userTag'
import { logError } from '../../utils/logError'

const AVATAR_SIZES = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-16 h-16 text-2xl',
}

function Avatar({ name, url, size = 'md' }) {
  const dim = AVATAR_SIZES[size]
  if (url) {
    return <img src={url} alt={name || 'Avatar'} className={`${dim} rounded-xl object-cover shrink-0`} />
  }
  return (
    <div className={`${dim} rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 font-display font-bold`}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  )
}

// Etiqueta username#TAG.
function TagLabel({ username, tag }) {
  if (!username) return null
  return <p className="text-xs text-zinc-500 font-mono truncate">{formatUserTag(username, tag)}</p>
}

// Pill de conteo para los encabezados de sección.
function CountPill({ n }) {
  return (
    <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-accent/15 text-accent text-[11px] font-display font-bold tabular-nums">
      {n}
    </span>
  )
}

// Mensajes de resultado al enviar una solicitud (compartidos por búsqueda y por ID).
const SEND_FEEDBACK = {
  sent: { ok: true, msg: 'Solicitud enviada.' },
  accepted: { ok: true, msg: '¡Ahora son amigos!' },
  exists: { ok: false, msg: 'Ya existe una relación con este usuario.' },
  self: { ok: false, msg: 'No puedes agregarte a ti mismo.' },
  not_found: { ok: false, msg: 'No existe ningún usuario con ese ID.' },
}

export default function Friends() {
  const navigate = useNavigate()
  const { searchUsers, listFriends, listRequests, listSentRequests, sendRequest, addFriendByTag, acceptRequest, removeFriendship } = useFriends()
  const { getProfile } = useProfile()

  const [me, setMe] = useState(null)
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [tagInput, setTagInput] = useState('')
  const [addingByTag, setAddingByTag] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [f, r, s] = await Promise.all([listFriends(), listRequests(), listSentRequests()])
      setFriends(f)
      setRequests(r)
      setSent(s)
    } catch (err) {
      logError('Friends.refresh', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [listFriends, listRequests, listSentRequests])

  useEffect(() => {
    async function load() {
      const { data } = await getProfile()
      if (data) setMe({ name: data.name, username: data.username, tag: data.tag, avatar_url: data.avatar_url, is_premium: data.is_premium })
      await refresh()
    }
    load()
  }, [getProfile, refresh])

  // Búsqueda con debounce. Todo el setState ocurre dentro del timeout para no
  // disparar renders en cascada desde el cuerpo del efecto.
  useEffect(() => {
    const q = query.trim()
    const handle = setTimeout(async () => {
      if (!q) { setResults([]); setSearching(false); return }
      setSearching(true)
      try {
        setResults(await searchUsers(q))
      } catch (err) {
        logError('Friends.search', err)
        setError(err.message)
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [query, searchUsers])

  const handleSend = async (userId) => {
    try {
      const res = await sendRequest(userId)
      await refresh()
      setResults((prev) => prev.map((r) => (r.user_id === userId ? { ...r, status: 'pending', is_incoming: false } : r)))
      const fb = SEND_FEEDBACK[res]
      if (fb) fb.ok ? sileo.success({ title: fb.msg }) : sileo.error({ title: fb.msg })
    } catch (err) {
      logError('Friends.sendRequest', err)
      setError(err.message)
    }
  }

  const handleAddByTag = async (e) => {
    e.preventDefault()
    const parsed = parseUserTag(tagInput)
    if (!parsed) {
      sileo.error({ title: 'ID inválido', description: 'Usa el formato usuario#TAG (ej. frank#F7L1R).' })
      return
    }
    setAddingByTag(true)
    try {
      const res = await addFriendByTag(parsed.username, parsed.tag)
      const fb = SEND_FEEDBACK[res]
      if (fb?.ok) {
        setTagInput('')
        await refresh()
        sileo.success({ title: fb.msg })
      } else {
        sileo.error({ title: fb?.msg ?? 'No se pudo agregar.' })
      }
    } catch (err) {
      logError('Friends.addByTag', err)
      setError(err.message)
    } finally {
      setAddingByTag(false)
    }
  }

  const handleCopyTag = async () => {
    if (!me?.username) return
    try {
      await navigator.clipboard.writeText(formatUserTag(me.username, me.tag))
      sileo.success({ title: 'ID copiado al portapapeles.' })
    } catch (err) {
      logError('Friends.copyTag', err)
    }
  }

  const handleAccept = async (friendshipId) => {
    try {
      await acceptRequest(friendshipId)
      await refresh()
    } catch (err) {
      logError('Friends.acceptRequest', err)
      setError(err.message)
    }
  }

  const handleRemove = async (friendshipId) => {
    try {
      await removeFriendship(friendshipId)
      await refresh()
    } catch (err) {
      logError('Friends.removeFriendship', err)
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <TutorialGuide module="friends" />
      <PageHeader title="Amigos" back="/app/profile" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Hero social */}
        {me?.username ? (
          <section className="card glow-accent p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={me.name} url={me.avatar_url} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold uppercase tracking-tight text-xl text-zinc-100 leading-none truncate">
                    {me.name || me.username}
                  </p>
                  {me.is_premium && (
                    <span className="chip bg-amber-400/15 text-amber-300 shrink-0">
                      <Crown size={12} /> Premium
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 font-mono mt-1.5 truncate">{formatUserTag(me.username, me.tag)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-ink-800">
              <div className="flex items-center gap-2 flex-1 pt-3">
                <Users size={16} className="text-accent" />
                <span className="stat-num text-lg text-zinc-100">{loading ? '—' : friends.length}</span>
                <span className="text-sm text-zinc-500">{friends.length === 1 ? 'amigo' : 'amigos'}</span>
              </div>
              <button onClick={handleCopyTag} className="btn-dark px-3 py-1.5 text-xs shrink-0 mt-3">
                <Copy size={14} /> Copiar ID
              </button>
            </div>
          </section>
        ) : (
          <div className="h-32 card animate-pulse" />
        )}

        {/* Agregar amigos */}
        <section>
          <h2 className="section-title mb-3">Agregar amigos</h2>
          <div className="space-y-3">
            <form onSubmit={handleAddByTag} className="flex gap-2">
              <div className="relative flex-1">
                <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Agregar por ID · usuario#TAG"
                  className="input pl-9 font-mono"
                />
              </div>
              <button type="submit" disabled={addingByTag || !tagInput.trim()} className="btn-accent px-4 shrink-0 disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>

            <div className="relative" data-tutorial="friends-search">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por usuario o nombre…"
                className="input pl-9"
              />
            </div>
          </div>

          {query.trim() && (
            <div className="mt-3 space-y-2">
              {searching && <p className="text-sm text-zinc-500 px-1">Buscando…</p>}
              {!searching && results.length === 0 && (
                <p className="text-sm text-zinc-500 px-1">No se encontraron usuarios.</p>
              )}
              {results.map((u) => (
                <div key={u.user_id} className="card card-hover flex items-center gap-3 px-4 py-3">
                  <button onClick={() => navigate(`/app/u/${u.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Avatar name={u.name} url={u.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="display text-sm text-zinc-100 truncate">{u.name || u.username}</p>
                      <TagLabel username={u.username} tag={u.tag} />
                    </div>
                  </button>
                  {u.status === 'accepted' ? (
                    <span className="chip-accent shrink-0">Amigos</span>
                  ) : u.status === 'pending' ? (
                    u.is_incoming ? (
                      <button onClick={() => handleAccept(u.friendship_id)} className="btn-accent px-3 py-1.5 text-xs shrink-0">
                        <Check size={14} /> Aceptar
                      </button>
                    ) : (
                      <span className="chip-muted shrink-0"><Clock size={12} className="inline mr-1" />Pendiente</span>
                    )
                  ) : (
                    <button onClick={() => handleSend(u.user_id)} className="btn-dark px-3 py-1.5 text-xs shrink-0">
                      <UserPlus size={14} /> Agregar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Solicitudes recibidas */}
        {requests.length > 0 && (
          <section data-tutorial="friends-requests">
            <h2 className="section-title mb-3 flex items-center">Solicitudes recibidas<CountPill n={requests.length} /></h2>
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.friendship_id} className="card flex items-center gap-3 px-4 py-3">
                  <Avatar name={r.name} url={r.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="display text-sm text-zinc-100 truncate">{r.name || r.username}</p>
                    <TagLabel username={r.username} tag={r.tag} />
                  </div>
                  <button onClick={() => handleAccept(r.friendship_id)} className="btn-accent px-3 py-1.5 text-xs shrink-0">
                    <Check size={14} /> Aceptar
                  </button>
                  <button onClick={() => handleRemove(r.friendship_id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0" title="Rechazar">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Solicitudes enviadas */}
        {sent.length > 0 && (
          <section>
            <h2 className="section-title mb-3 flex items-center">Enviadas<CountPill n={sent.length} /></h2>
            <div className="space-y-2">
              {sent.map((s) => (
                <div key={s.friendship_id} className="card flex items-center gap-3 px-4 py-3">
                  <Avatar name={s.name} url={s.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="display text-sm text-zinc-100 truncate">{s.name || s.username}</p>
                    <TagLabel username={s.username} tag={s.tag} />
                  </div>
                  <span className="chip-muted shrink-0"><Clock size={12} className="inline mr-1" />Pendiente</span>
                  <button onClick={() => handleRemove(s.friendship_id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0" title="Cancelar">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Amigos */}
        <section data-tutorial="friends-list">
          <h2 className="section-title mb-3 flex items-center">Mis amigos{friends.length > 0 && <CountPill n={friends.length} />}</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-17 card animate-pulse" />)}
            </div>
          ) : friends.length === 0 ? (
            <div className="card border-dashed px-6 py-10 text-center">
              <Users size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="display text-sm text-zinc-300">Aún no tienes amigos agregados</p>
              <p className="text-sm text-zinc-500 mt-1">Busca por usuario o comparte tu ID para empezar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.friendship_id} className="card card-hover flex items-center gap-3 px-4 py-3">
                  <button onClick={() => navigate(`/app/u/${f.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Avatar name={f.name} url={f.avatar_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="display text-sm text-zinc-100 truncate">{f.name || f.username}</p>
                      <TagLabel username={f.username} tag={f.tag} />
                    </div>
                    {f.streak > 0 && (
                      <span className="chip bg-accent/15 text-accent shrink-0" title={`Racha de ${f.streak} días`}>
                        <Flame size={12} /> {f.streak}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                  </button>
                  <button onClick={() => handleRemove(f.friendship_id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0" title="Eliminar">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
