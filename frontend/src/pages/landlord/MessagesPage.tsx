import { useEffect, useState, useRef, useCallback } from 'react'
import { useApi } from '../../lib/api'

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
  const { apiFetch } = useApi()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiFetch('/api/messages/conversations').then(r => r.json()).then(setConversations)
  }, [])

  const fetchThread = useCallback(async (leaseId: string) => {
    const data = await apiFetch(`/api/messages/${leaseId}`).then(r => r.json())
    if (Array.isArray(data)) {
      setMessages(data)
      setConversations(prev =>
        prev.map(c => c.leaseId === leaseId ? { ...c, unread: 0 } : c)
      )
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
    <div className="h-[calc(100vh-0px)] flex flex-col">
      <div className="px-7 py-5 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">No conversations yet.</div>
          )}
          {conversations.map(conv => (
            <button
              key={conv.leaseId}
              onClick={() => { setSelected(conv); setMessages([]) }}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.leaseId === conv.leaseId ? 'bg-indigo-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-indigo-600">
                      {conv.tenant.firstName[0]}{conv.tenant.lastName[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-medium truncate ${conv.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                      {conv.tenant.firstName} {conv.tenant.lastName}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">{conv.unit.property} · {conv.unit.number}</div>
                  </div>
                </div>
                {conv.unread > 0 && (
                  <span className="shrink-0 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {conv.unread > 9 ? '9+' : conv.unread}
                  </span>
                )}
              </div>
              {conv.lastMessage && (
                <p className="text-[10px] text-gray-400 mt-1.5 line-clamp-1 pl-10">
                  {conv.lastMessage.sender.role === 'LANDLORD' ? 'You: ' : ''}{conv.lastMessage.body}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-3.5 border-b border-gray-100 bg-white">
                <div className="text-sm font-medium text-gray-900">
                  {selected.tenant.firstName} {selected.tenant.lastName}
                </div>
                <div className="text-xs text-gray-400">{selected.unit.property} · Unit {selected.unit.number}</div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-gray-400 pt-12">No messages yet.</div>
                )}
                {messages.map(msg => {
                  const isMe = msg.sender.role === 'LANDLORD'
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-[10px] text-gray-400 px-1">{msg.sender.firstName}</span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
                        }`}>
                          {msg.body}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-5 py-3 border-t border-gray-100 flex gap-2">
                <input
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={`Reply to ${selected.tenant.firstName}…`}
                  className="flex-1 input"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !body.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
