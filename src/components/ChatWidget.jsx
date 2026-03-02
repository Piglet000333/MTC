import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, X, Send, Bot, User, Paperclip } from 'lucide-react'

export default function ChatWidget({ darkMode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [studentId, setStudentId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [attachment, setAttachment] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showTimeId, setShowTimeId] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [isAdminOnline, setIsAdminOnline] = useState(false)
  const [adminProfile, setAdminProfile] = useState({ name: 'Admin', image: '' })

  const authHeaders = React.useCallback(() => {
    const token = localStorage.getItem('studentToken')
    return { Authorization: token ? `Bearer ${token}` : '' }
  }, [])

  useEffect(() => {
    const loadMessages = async (sid) => {
      try {
        const res = await fetch(`/api/messages/student/${sid}`, { headers: authHeaders() })
        const ct = res.headers.get('content-type')
        if (!ct || !ct.includes('application/json')) {
          const text = await res.text()
          throw new Error(text.includes('Proxy error') ? 'Backend server is down' : 'Invalid server response')
        }
        const data = res.ok ? await res.json() : []
        setMessages(data)
        try {
          const last = data?.[data.length - 1]
          const lastTs = new Date(last?.createdAt || 0).getTime()
          if (Number.isFinite(lastTs) && lastTs > 0) {
            localStorage.setItem('studentChatLast', String(lastTs))
          }
        } catch {}
        setErrorMsg('')
      } catch (e) {
        setErrorMsg(e.message || 'Unable to load messages')
      }
    }

    const loadUnreadCount = async (sid) => {
      try {
        const res = await fetch(`/api/messages/unread-count`, { headers: authHeaders() })
        const ct = res.headers.get('content-type')
        if (!ct || !ct.includes('application/json')) {
          const text = await res.text()
          throw new Error(text.includes('Proxy error') ? 'Backend server is down' : 'Invalid server response')
        }
        const data = res.ok ? await res.json() : { count: 0 }
        setUnreadCount(data.count || 0)
        setErrorMsg('')
      } catch (e) {
        setErrorMsg(e.message || 'Unable to load unread count')
      }
    }

    const storedInfo = localStorage.getItem('studentInfo')
    const sid = storedInfo ? JSON.parse(storedInfo)._id : null
    setStudentId(sid)
    if (sid) {
      loadMessages(sid)
      loadUnreadCount(sid)
      // Poll for new messages every 10s
      const interval = setInterval(() => {
        loadMessages(sid)
        loadUnreadCount(sid)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [open, authHeaders])

  useEffect(() => {
    const openListener = () => setOpen(true)
    window.addEventListener('openStudentChat', openListener)
    return () => window.removeEventListener('openStudentChat', openListener)
  }, [])

  // Admin presence via localStorage heartbeat set by AdminDashboard
  useEffect(() => {
    let cancelled = false
    const loadAdminProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile/public')
        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          if (!cancelled) setAdminProfile({ name: data?.username || data?.name || 'Admin', image: data?.image || '' })
        }
      } catch {}
    }
    const fetchPresenceFromServer = async () => {
      try {
        const res = await fetch('/api/admin/online', { method: 'GET', credentials: 'include', headers: authHeaders() })
        const ct = res.headers.get('content-type') || ''
        if (!res.ok) return null
        if (ct.includes('application/json')) {
          const d = await res.json().catch(() => ({}))
          if (d === true) return true
          if (typeof d === 'string') {
            const s = d.toLowerCase()
            if (s.includes('online') || s === 'true' || s === '1') return true
            if (s.includes('offline') || s === 'false' || s === '0') return false
            return null
          }
          const s = String(d?.status ?? '').toLowerCase()
          if (['online','available','active','on'].includes(s)) return true
          if (['offline','inactive','off'].includes(s)) return false
          if (d?.online === true || d?.isOnline === true || d?.available === true) return true
          if (String(d?.online).toLowerCase() === 'true') return true
          if (Number(d?.online) === 1 || Number(d?.status) === 1) return true
          if (d?.online === false || d?.isOnline === false) return false
          return null
        } else {
          const text = await res.text().catch(() => '')
          const t = String(text || '').trim().toLowerCase()
          if (t.includes('online') || t === 'true' || t === '1') return true
          if (t.includes('offline') || t === 'false' || t === '0') return false
          return null
        }
      } catch { return null }
    }
    const updatePresence = async () => {
      try {
        const ts = Number(localStorage.getItem('adminHeartbeat') || 0)
        let online = Number.isFinite(ts) && ts > 0 && (Date.now() - ts) < 15000
        if (!online) {
          const serverVal = await fetchPresenceFromServer()
          if (serverVal !== null) online = !!serverVal
        }
        if (!cancelled) setIsAdminOnline(online)
      } catch {
        if (!cancelled) setIsAdminOnline(false)
      }
    }
    loadAdminProfile()
    updatePresence().catch(() => {})
    const onStorage = (e) => { if (e.key === 'adminHeartbeat') updatePresence().catch(() => {}) }
    window.addEventListener('storage', onStorage)
    const id = setInterval(() => { updatePresence().catch(() => {}) }, 7000)
    return () => { cancelled = true; window.removeEventListener('storage', onStorage); clearInterval(id) }
  }, [authHeaders])

  useEffect(() => {
    // Mark as read when opened
    if (open && studentId) {
       fetch(`/api/messages/read/${studentId}`, { 
         method: 'PUT',
         headers: authHeaders() 
       }).then(() => setUnreadCount(0))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, studentId, authHeaders])

  const suggestions = useMemo(() => [
    'What are the Paid Training?',
    'How to apply for assessment?',
    'Payment methods?',
    'Can I change my email?'
  ], [])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAttachment(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const sendMessage = async (text, isAuto = false) => {
    if (!studentId || (!text.trim() && !attachment)) return
    setLoading(true)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ text, studentId, isAuto, attachment })
      })
      const ct = res.headers.get('content-type')
      if (!ct || !ct.includes('application/json')) {
        const textBody = await res.text()
        throw new Error(textBody.includes('Proxy error') ? 'Backend server is down' : 'Invalid server response')
      }
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to send')
      }
      const data = await res.json()
      const added = []
      if (data.message) added.push(data.message)
      if (data.bot) added.push(data.bot)
      setMessages(prev => [...prev, ...added])
      try { localStorage.setItem('studentChatLast', String(Date.now())) } catch {}
      setInput('')
      setAttachment(null)
      setErrorMsg('')
    } catch (e) {
      setErrorMsg(e.message || 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  const lastMessageTs = useMemo(() => {
    if (!messages || messages.length === 0) return 0
    const last = messages[messages.length - 1]
    const t = new Date(last?.createdAt || 0).getTime()
    if (Number.isFinite(t) && t > 0) return t
    const cached = Number(localStorage.getItem('studentChatLast') || 0)
    return Number.isFinite(cached) ? cached : 0
  }, [messages])

  const showSuggestions = useMemo(() => {
    if (!messages || messages.length === 0) return true
    const now = Date.now()
    // Resurface suggestions if no interaction for 24h
    return now - lastMessageTs > 24 * 60 * 60 * 1000
  }, [messages, lastMessageTs])

  return createPortal(
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className={`hidden sm:flex fixed bottom-5 right-5 z-[2147483647] w-14 h-14 rounded-2xl items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95
          ${open
            ? (darkMode 
                ? 'bg-gradient-to-br from-indigo-700 to-blue-700 shadow-blue-900/40' 
                : 'bg-gradient-to-br from-indigo-600 to-blue-600 shadow-blue-400/40')
            : (darkMode 
                ? 'bg-gradient-to-br from-blue-700 to-indigo-700 shadow-blue-900/30' 
                : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-400/30')}`}
        aria-label={open ? 'Close chat' : 'Open chat'}
        type="button"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
        {!open && unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ${darkMode ? 'border-2 border-[#0f172a]' : 'border-2 border-white'}`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
        {/* Mobile backdrop with blur */}
        <div 
          className="sm:hidden fixed inset-0 z-[2147483646] bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <div
          className={`fixed z-[2147483647] overflow-hidden flex flex-col
            sm:bottom-20 sm:right-5 sm:max-w-[360px] sm:w-[360px] sm:max-h-[70vh] sm:rounded-3xl sm:border
            inset-x-0 bottom-0 sm:inset-auto sm:bottom-20 sm:right-5
            ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}
            ${darkMode ? 'shadow-[0_32px_80px_rgba(2,6,23,0.8)]' : 'shadow-[0_32px_80px_rgba(0,0,0,0.25)]'} 
            ${darkMode ? 'border-gray-800' : 'border-gray-100'}
            sm:animate-none animate-slideUp`}
          style={{ maxHeight: '75vh', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}
        >
          <div className={`px-4 pt-6 pb-3 border-b relative bg-gradient-to-r rounded-t-[20px] ${
            darkMode ? 'from-blue-900 to-indigo-900 border-gray-800' : 'from-blue-600 to-indigo-600 border-blue-700/20'
          }`}>
            <div className="sm:hidden absolute left-1/2 top-2 -translate-x-1/2 h-1.5 w-10 rounded-full bg-white/60" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 bg-white/10">
                  {adminProfile.image 
                    ? <img src={adminProfile.image} alt="Admin" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-extrabold">{(adminProfile.name || 'A')[0]}</div>
                  }
                </div>
                <div>
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-white'}`}>Chat Support</div>
                  <div className={`text-xs flex items-center gap-1 ${isAdminOnline ? 'text-emerald-200' : 'text-red-200'}`}>
                    <span className="relative inline-flex w-2 h-2">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isAdminOnline ? 'bg-emerald-300' : 'bg-red-300'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isAdminOnline ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    </span>
                    {isAdminOnline ? 'Online now' : 'Offline'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className={`p-2 rounded-xl ${darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-white/20 text-white'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`absolute left-4 right-4 bottom-0 h-px ${darkMode ? 'bg-blue-500/30' : 'bg-white/20'}`} />
          </div>
          {errorMsg && (
            <div className="px-4 py-2 text-xs bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 border-b border-red-200 dark:border-red-800">
              {errorMsg}
            </div>
          )}
          <div className={`px-4 flex-1 overflow-y-auto space-y-3 py-4 text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`} style={{ minHeight: '260px' }}>
            {messages.map(m => (
              <div key={m._id || m.createdAt + m.text} className={`flex items-start gap-2 ${m.senderRole === 'student' ? 'justify-end' : 'justify-start'}`}>
                {m.senderRole !== 'student' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    {m.senderRole === 'bot' ? <Bot className="w-5 h-5" /> : (
                      adminProfile.image 
                        ? <img src={adminProfile.image} alt="Admin" className="w-full h-full object-cover" />
                        : <User className="w-5 h-5" />
                    )}
                  </div>
                )}
                <div className={`max-w-[75%] space-y-1`}>
                   <div 
                     onClick={() => setShowTimeId(m._id || (m.createdAt + m.text))}
                     className={`px-3 py-2 rounded-2xl text-sm ${
                    m.senderRole === 'student'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                      : darkMode ? 'bg-gray-800 text-gray-100 rounded-bl-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {m.attachment && (
                      m.attachment.startsWith('data:image')
                        ? <img src={m.attachment} alt="" onClick={() => setZoomImage(m.attachment)} className="cursor-zoom-in max-w-full max-h-56 w-auto h-auto object-contain rounded-lg mb-2" />
                        : <a href={m.attachment} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
                            <Paperclip className="w-4 h-4" />
                            <span>Open PDF</span>
                          </a>
                    )}
                    {m.text}
                  </div>
                  {((m._id && showTimeId === m._id) || (!m._id && showTimeId === (m.createdAt + m.text))) && (
                    <p className={`text-[10px] px-1 ${m.senderRole === 'student' ? 'text-right' : ''} ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {m.senderRole === 'student' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-blue-700' : 'bg-blue-500'}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          
          {/* Attachment Preview */}
          {attachment && (
            <div className="px-4 py-2 flex items-center justify-between border-t border-gray-800/60 text-xs text-gray-400">
              <span>Attachment ready</span>
              <button onClick={() => setAttachment(null)} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pre-questions at the bottom */}
          {showSuggestions && (
            <div className={`px-4 pt-3 grid grid-cols-2 gap-2 ${darkMode ? 'text-blue-100' : 'text-blue-700'}`}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s, true)}
                  className={`text-xs px-3 py-2 rounded-xl text-left truncate transition ${
                    darkMode ? 'bg-blue-950/40 hover:bg-blue-900/50 border border-blue-900/40' : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className={`px-4 py-3 flex items-center gap-2 border-t ${darkMode ? 'border-gray-800/60' : 'border-gray-100'}`}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-full transition ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
            />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
                darkMode ? 'bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30' : 'bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
            <button
              disabled={!studentId || (!input.trim() && !attachment) || loading}
              onClick={() => sendMessage(input)}
              className={`px-3 py-2 rounded-full flex items-center gap-1 ${loading ? 'opacity-60' : ''} ${
                darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              } hover:shadow-lg`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        </>
      )}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-all"
              onClick={() => setZoomImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={zoomImage} 
              alt="Zoomed" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
