const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const Student = require('../models/Student')
const { requireStudentOrAdmin } = require('../middleware/auth')

const faq = [
  { q: ['schedule', 'training'], a: 'You can find training schedules under Student Dashboard > Schedules.' },
  { q: ['assessment', 'apply'], a: 'Apply for assessment in Student Dashboard > Assessment.' },
  { q: ['payment', 'gcash'], a: 'We accept GCash. See Payment section for details.' },
  { q: ['email', 'change'], a: 'Email is fixed to your login account and cannot be changed in forms.' }
]

router.get('/conversations', requireStudentOrAdmin, async (req, res) => {
  try {
    if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const students = await Student.find().select('firstName lastName email profilePicture')
    const data = await Promise.all(students.map(async s => {
      // Find last non-auto message for preview
      const last = await Message.find({ studentId: s._id, isAuto: { $ne: true }, hiddenForAdmin: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(1)
      
      // Count unread messages (from student, not read, not auto)
      const unreadCount = await Message.countDocuments({
        studentId: s._id,
        senderRole: 'student',
        isRead: false,
        isAuto: { $ne: true },
        hiddenForAdmin: { $ne: true }
      })

      return { 
        studentId: s._id, 
        name: `${s.firstName} ${s.lastName}`, 
        email: s.email, 
        profilePicture: s.profilePicture,
        lastMessage: last[0] || null,
        unreadCount
      }
    }))
    // Sort by latest message
    data.sort((a, b) => {
      const tA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const tB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      return tB - tA
    })
    res.json(data)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/student/:studentId', requireStudentOrAdmin, async (req, res) => {
  try {
    const isAdmin = req.auth.role === 'admin'
    if (!isAdmin && String(req.auth.userId) !== String(req.params.studentId)) {
      return res.status(403).json({ error: 'You can only view your own messages' })
    }

    // Admin view: exclude auto messages if requested (or by default per user request "it doesnt have to show in the message for admin")
    // User said: "only the chat written by the student will reflect" (for admin)
    const filter = { studentId: req.params.studentId }
    if (isAdmin) {
      filter.isAuto = { $ne: true }
      filter.hiddenForAdmin = { $ne: true }
    }

    const msgs = await Message.find(filter).sort({ createdAt: 1 })
    res.json(msgs)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Mark messages as read
router.put('/read/:studentId', requireStudentOrAdmin, async (req, res) => {
  try {
    const { studentId } = req.params
    const { role } = req.auth
    
    const filter = { studentId, isRead: false }
    // If admin is reading, mark student messages as read
    if (role === 'admin') {
      filter.senderRole = 'student'
    } else {
      // If student is reading, mark admin messages as read
      filter.senderRole = 'admin'
    }

    await Message.updateMany(filter, { $set: { isRead: true } })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/unread-count', requireStudentOrAdmin, async (req, res) => {
  try {
    if (req.auth.role === 'student') {
      const count = await Message.countDocuments({
        studentId: req.auth.userId,
        senderRole: 'admin',
        isRead: false
      })
      res.json({ count })
    } else {
      // For admin, total unread from all students (excluding auto)
      const count = await Message.countDocuments({
        senderRole: 'student',
        isRead: false,
        isAuto: { $ne: true }
      })
      res.json({ count })
    }
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.post('/send', requireStudentOrAdmin, async (req, res) => {
  try {
    const { text, studentId, isAuto, attachment } = req.body
    // text is optional if attachment exists
    if ((!text || !String(text).trim()) && !attachment) {
      return res.status(400).json({ error: 'Text or attachment required' })
    }
    
    let sid = studentId
    let senderRole = req.auth.role
    if (req.auth.role === 'student') sid = req.auth.userId
    if (!sid) return res.status(400).json({ error: 'studentId required' })
    
    const msgData = { 
      studentId: sid, 
      senderRole, 
      text: text ? String(text).trim() : '',
      isAuto: !!isAuto,
      attachment: attachment || null
    }

    const msg = await Message.create(msgData)
    let botMsg = null
    
    // Only trigger bot if it's a student message and NOT an auto-suggestion itself (to prevent loops, though isAuto flag helps)
    // Actually, user said "when the user preanswer chat... it doesnt have to show".
    // "preanswer" implies the suggestions.
    // If student clicks suggestion, isAuto=true.
    // If bot replies, isAuto=true.
    // Admin sees neither.
    
    if (senderRole === 'student') {
      const t = String(text).toLowerCase()
      const hit = faq.find(item => item.q.some(k => t.includes(k)))
      if (hit) {
        // If it was an auto-trigger (suggestion), bot reply is also auto
        // Even if student typed it manually, if it triggers bot, maybe we treat bot reply as auto?
        // Let's assume bot replies are ALWAYS auto.
        // And if the student's message triggered it via suggestion (isAuto=true), then both are hidden.
        // If student typed "schedule" manually (isAuto=false), admin sees student msg, but maybe not bot reply?
        // User said: "only the chat written by the student will reflect".
        // So if student types "schedule", admin sees "schedule".
        // Bot replies. Admin probably shouldn't see bot reply? Or maybe they should to know context?
        // "it doesnt have to show in the message for admin only the chat written by the student"
        // Okay, I will mark bot messages as isAuto=true always.
        
        botMsg = await Message.create({ 
          studentId: sid, 
          senderRole: 'bot', 
          text: hit.a,
          isAuto: true 
        })
      }
    }
    res.status(201).json({ message: msg, bot: botMsg })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/student/:studentId', requireStudentOrAdmin, async (req, res) => {
  try {
    if (req.auth.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const { studentId } = req.params
    await Message.updateMany({ studentId }, { $set: { hiddenForAdmin: true } })
    res.json({ success: true, hiddenForAdmin: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

module.exports = router
