import { useEffect, useState, useRef, useCallback } from 'react'
import { useApi } from '../../lib/api'
import Avatar from '../../components/ui/Avatar'

interface Conversation {
  leaseId: string
  tenant: { id: string; firstName: string; lastName: string; email: string }
  unit: { number: string; property: string }
  lastMessage: { body: string; createdAt: string; sender: { firstName: string; role: string } } | null
  unread: number
}

interface Message {
  id: string
  body: string
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; role: string }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { apiFetch } = useApi()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiFetch('/api/messages/conversations').then(r => r.json()).then(setConversations)
  }, [])

  const fetchThread = useCallback(async (leaseId: string) => {
    const data = await apiFetch(`/api/messages/${leaseId}`).then(r => r.json())
    if (Array.isArray(data)) {
      setMessages(data)
      setConversations(prev => prev.map(c => c.leaseId === leaseId ? { ...c, unread: 0 } : c))
    }
  }, [])

  useEffect(() => {
    if (!selected) return
    fetchThread(selected.leaseId)
    const interval = setInterval(() => fetchThread(selected.leaseId), 5000)
    return () => clearInterval(interval)
  }, [selected?.leaseId, fetchThread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleDelete(messageId: string) {
    if (!selected) return
    setDeleting(messageId)
    try {
      const res = await apiFetch(`/api/messages/${messageId}/delete`, { method: 'DELETE' })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
      }
    } finally {
      setDeleting(null)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || !selected) return
    setSending(true)
    try {
      const res = await apiFetch(`/api/messages/${selected.leaseId}`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setBody('')
        setConversations(prev =>
          prev.map(c => c.leaseId === selected.leaseId
            ? { ...c, lastMessage: { body: body.trim(), createdAt: new Date().toISOString(), sender: { firstName: 'You', role: 'LANDLORD' } } }
            : c
          )
        )
      }
    } finally {
      setSending(false)
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px 0' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Messages</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="card" style={{ display: 'flex', overflow: 'hidden', height: 'calc(100vh - 180px)', minHeight: 400 }}>
        {/* Thread list */}
        <div style={{ width: 280, borderRight: '1px solid #f0f0f5', overflowY: 'auto', flexShrink: 0 }}>
          {conversations.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No conversations yet.</div>
          )}
          {conversations.map(conv => (
            <div
              key={conv.leaseId}
              onClick={() => { setSelected(conv); setMessages([]) }}
              style={{
                padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f4f4f8',
                background: selected?.leaseId === conv.leaseId ? '#f5f3ff' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (selected?.leaseId !== conv.leaseId) (e.currentTarget as HTMLDivElement).style.background = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = selected?.leaseId === conv.leaseId ? '#f5f3ff' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={`${conv.tenant.firstName} ${conv.tenant.lastName}`} size={36} />
                  {conv.unread > 0 && (
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700 }}>
                      {conv.unread}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: conv.unread ? 700 : 600, color: '#0d0f18' }}>
                      {conv.tenant.firstName} {conv.tenant.lastName}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>
                      {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: conv.unread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.lastMessage.sender.role === 'LANDLORD' ? 'You: ' : ''}{conv.lastMessage.body}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#c4c4d0', marginTop: 2 }}>{conv.unit.property} · Unit {conv.unit.number}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat area */}
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9ca3af' }}>
            Select a conversation to view messages
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f5', display: 'flex', alignItems: 'center', gap: 12, background: '#fafafa' }}>
              <Avatar name={`${selected.tenant.firstName} ${selected.tenant.lastName}`} size={34} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.tenant.firstName} {selected.tenant.lastName}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{selected.unit.property} · Unit {selected.unit.number}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: 48, fontSize: 13, color: '#9ca3af' }}>No messages yet.</div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.sender.role === 'LANDLORD'
                const isHovered = hoveredMsg === msg.id
                const isBeingDeleted = deleting === msg.id
                return (
                  <div
                    key={msg.id || i}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}
                    onMouseEnter={() => setHoveredMsg(msg.id)}
                    onMouseLeave={() => setHoveredMsg(null)}
                  >
                    {!isMe && <span style={{ fontSize: 10, color: '#9ca3af', paddingLeft: 4 }}>{msg.sender.firstName}</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isMe ? 'row' : 'row-reverse' }}>
                      <div style={{
                        maxWidth: '72%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
                        background: isBeingDeleted ? '#e5e7eb' : isMe ? '#4f46e5' : '#f4f4f8',
                        color: isMe ? '#fff' : '#0d0f18',
                        borderBottomRightRadius: isMe ? 4 : 14,
                        borderBottomLeftRadius: isMe ? 14 : 4,
                        opacity: isBeingDeleted ? 0.5 : 1,
                        transition: 'background 0.15s, opacity 0.15s',
                      }}>
                        {msg.body}
                      </div>
                      {isHovered && !isBeingDeleted && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          title="Delete message"
                          style={{
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            padding: 4, color: '#ef4444', display: 'flex', alignItems: 'center',
                            opacity: 0.7, borderRadius: 4,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#c4c4d0', paddingLeft: 4 }}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f5', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={`Reply to ${selected.tenant.firstName}…`}
                className="input"
                style={{ flex: 1 }}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="btn-primary"
                style={{ opacity: sending || !body.trim() ? 0.5 : 1 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
