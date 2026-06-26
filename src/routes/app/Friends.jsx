import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Check, X, ChevronRight, Clock, Users } from 'lucide-react'
import { useFriends } from '../../hooks/useFriends'
import PageHeader from '../../components/ui/PageHeader'

function Avatar({ name, size = 'md' }) {
  const dim = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base'
  return (
    <div className={`${dim} rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 font-display font-bold`}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  )
}

export default function Friends() {
  const navigate = useNavigate()
  const { searchUsers, listFriends, listRequests, sendRequest, acceptRequest, removeFriendship } = useFriends()

  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [f, r] = await Promise.all([listFriends(), listRequests()])
      setFriends(f)
      setRequests(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [listFriends, listRequests])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [f, r] = await Promise.all([listFriends(), listRequests()])
        if (cancelled) return
        setFriends(f)
        setRequests(r)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [listFriends, listRequests])

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
        setError(err.message)
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [query, searchUsers])

  const handleSend = async (userId) => {
    try {
      await sendRequest(userId)
      await refresh()
      setResults((prev) => prev.map((r) => (r.user_id === userId ? { ...r, status: 'pending', is_incoming: false } : r)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAccept = async (friendshipId) => {
    try {
      await acceptRequest(friendshipId)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemove = async (friendshipId) => {
    try {
      await removeFriendship(friendshipId)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Amigos" back="/app/profile" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Buscar */}
        <section>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar usuarios por nombre…"
              className="input pl-9"
            />
          </div>

          {query.trim() && (
            <div className="mt-3 space-y-2">
              {searching && <p className="text-sm text-zinc-500 px-1">Buscando…</p>}
              {!searching && results.length === 0 && (
                <p className="text-sm text-zinc-500 px-1">No se encontraron usuarios.</p>
              )}
              {results.map((u) => (
                <div key={u.user_id} className="card flex items-center gap-3 px-4 py-3">
                  <button onClick={() => navigate(`/app/u/${u.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Avatar name={u.name} size="sm" />
                    <p className="display text-sm text-zinc-100 truncate">{u.name}</p>
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

        {/* Solicitudes entrantes */}
        {requests.length > 0 && (
          <section>
            <h2 className="section-title mb-3">Solicitudes ({requests.length})</h2>
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.friendship_id} className="card flex items-center gap-3 px-4 py-3">
                  <Avatar name={r.name} size="sm" />
                  <p className="display text-sm text-zinc-100 flex-1 min-w-0 truncate">{r.name}</p>
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

        {/* Amigos */}
        <section>
          <h2 className="section-title mb-3">Mis amigos</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 card animate-pulse" />)}
            </div>
          ) : friends.length === 0 ? (
            <div className="card border-dashed px-6 py-10 text-center">
              <Users size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="display text-sm text-zinc-300">Aún no tienes amigos agregados</p>
              <p className="text-sm text-zinc-500 mt-1">Busca a alguien por su nombre para empezar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.friendship_id} className="card flex items-center gap-3 px-4 py-3">
                  <button onClick={() => navigate(`/app/u/${f.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Avatar name={f.name} size="sm" />
                    <p className="display text-sm text-zinc-100 truncate">{f.name}</p>
                    <ChevronRight size={16} className="text-zinc-600 ml-auto shrink-0" />
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
