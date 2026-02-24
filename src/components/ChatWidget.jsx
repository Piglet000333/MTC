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
      setInput('')
      setAttachment(null)
      setErrorMsg('')
    } catch (e) {
      setErrorMsg(e.message || 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  const showSuggestions = messages.length === 0

  return createPortal(
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-5 right-5 left-auto px-4 py-3 rounded-full flex items-center gap-2 transition ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-900/30 hover:shadow-blue-900/40' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-200 hover:shadow-blue-300'
        } hover:-translate-y-0.5`}
        style={{ zIndex: 2147483647 }}
        aria-label="Chat"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="font-semibold">Chat</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-70"></span>
          </span>
        )}
      </button>
      {open && (
        <div
          className={`w-80 sm:w-96 rounded-3xl border shadow-2xl overflow-hidden flex flex-col z-[9999] ${
            darkMode ? 'bg-[#0f172a] border-gray-700 shadow-blue-900/30' : 'bg-white border-gray-200 shadow-blue-200'
          }`}
          style={{ position: 'fixed', bottom: 80, right: 20, left: 'auto', maxHeight: '80vh', zIndex: 2147483647 }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            darkMode ? 'border-gray-800 bg-gradient-to-r from-blue-900 to-indigo-900' : 'border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}>
            <div className="flex items-center gap-2">
              <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-blue-200' : 'text-white'}`} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-white'}`}>Chat Support</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className={`${darkMode ? 'text-gray-200 hover:text-white' : 'text-white/80 hover:text-white'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {errorMsg && (
            <div className="px-4 py-2 text-xs bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 border-b border-red-200 dark:border-red-800">
              {errorMsg}
            </div>
          )}
          {showSuggestions && (
            <div className={`px-4 py-2 grid grid-cols-2 gap-2 border-b border-gray-100 dark:border-gray-800`}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s, true)}
                  className={`text-xs px-2 py-1 rounded-lg text-left truncate ${
                    darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className={`px-4 flex-1 overflow-y-auto space-y-3 py-3 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '300px' }}>
            {messages.map(m => (
              <div key={m._id || m.createdAt + m.text} className={`flex items-start gap-2 ${m.senderRole === 'student' ? 'justify-end' : 'justify-start'}`}>
                {m.senderRole !== 'student' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    {m.senderRole === 'bot' ? <Bot className="w-5 h-5" /> : (
                      // Try to show admin profile if available in message (requires backend population or stored info)
                      // For now, use User icon
                       <User className="w-5 h-5" />
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
            <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">Image attached</span>
              <button onClick={() => setAttachment(null)} className="text-red-500 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="px-4 py-3 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800">
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
                darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              } hover:shadow-lg`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
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
