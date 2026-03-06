import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import {
  CalendarClock,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Files,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Shield,
  ShieldCheck
} from 'lucide-react'
import DeleteModal from './components/DeleteModal'
import EditReasonModal from './components/EditReasonModal'
import PasswordModal from './components/PasswordModal'
import InactivityModal from './components/InactivityModal'
import KPIBar from './components/KPIBar'
import DocumentForm from './components/DocumentForm'
import DocumentCard from './components/DocumentCard'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  const [documents, setDocuments] = useState([])
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState(null)
  const [beneficiary, setBeneficiary] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('pending')
  const [manualDocumentType, setManualDocumentType] = useState('')
  const [activeTab, setActiveTab] = useState('third_party')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [activeSidebarLink, setActiveSidebarLink] = useState('dashboard')
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [inactivityCountdown, setInactivityCountdown] = useState(120)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordUpdating, setPasswordUpdating] = useState(false)
  const [editBeneficiary, setEditBeneficiary] = useState('')
  const [editReference, setEditReference] = useState('')
  const [editBatchNumber, setEditBatchNumber] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editStatus, setEditStatus] = useState('pending')
  const [editDueDate, setEditDueDate] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [historyExpandedId, setHistoryExpandedId] = useState(null)
  const [activityLogs, setActivityLogs] = useState({})
  const [activityLogUsers, setActivityLogUsers] = useState({})
  const [editReasonModalId, setEditReasonModalId] = useState(null)
  const [editReason, setEditReason] = useState('')
  const [editCounts, setEditCounts] = useState({})
  const [editedCounts, setEditedCounts] = useState({})
  const [permissionMessages, setPermissionMessages] = useState({})
  const [canExport, setCanExport] = useState(false)
  const [exportPickerOpen, setExportPickerOpen] = useState(false)
  const [selectedExportMonth, setSelectedExportMonth] = useState(() => String(new Date().getMonth() + 1))
  const [selectedExportYear, setSelectedExportYear] = useState(() => String(new Date().getFullYear()))
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [staffUsers, setStaffUsers] = useState([])
  const [staffExportAccess, setStaffExportAccess] = useState({})
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState(null)
  const [permissionActionId, setPermissionActionId] = useState(null)
  const [exportLogs, setExportLogs] = useState([])
  const [exportLogsLoading, setExportLogsLoading] = useState(false)
  const [exportLogsError, setExportLogsError] = useState(null)
  const [recentAuditLogs, setRecentAuditLogs] = useState([])
  const [recentAuditUsers, setRecentAuditUsers] = useState({})
  const [recentAuditLoading, setRecentAuditLoading] = useState(false)
  const [recentAuditError, setRecentAuditError] = useState(null)
  const dashboardSectionRef = useRef(null)
  const documentsSectionRef = useRef(null)
  const exportSectionRef = useRef(null)
  const auditSectionRef = useRef(null)
  const permissionsSectionRef = useRef(null)
  const passwordCloseTimerRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const inactivityWarningVisibleRef = useRef(false)

  async function getUserWithProfile(authUser) {
    if (!authUser) return null
    const { data } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', authUser.id)
      .single()

    return {
      ...authUser,
      role: data?.role || 'staff',
      name: data?.name || authUser.email
    }
  }

  async function fetchUserExportPermission(currentUser) {
    if (!currentUser) {
      setCanExport(false)
      return
    }

    if (currentUser.role === 'admin') {
      setCanExport(true)
      return
    }

    const { data } = await supabase
      .from('export_permissions')
      .select('is_active')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .single()

    setCanExport(Boolean(data?.is_active))
  }

  async function fetchStaffExportPermissions() {
    if (!user || user.role !== 'admin') return

    setPermissionsLoading(true)
    setPermissionsError(null)

    const { data: staffData, error: staffError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'staff')
      .order('name', { ascending: true })

    if (staffError) {
      setPermissionsError(staffError.message)
      setPermissionsLoading(false)
      return
    }

    const nextStaffUsers = staffData || []
    setStaffUsers(nextStaffUsers)

    if (nextStaffUsers.length === 0) {
      setStaffExportAccess({})
      setPermissionsLoading(false)
      return
    }

    const staffIds = nextStaffUsers.map((staffUser) => staffUser.id)
    const { data: accessData, error: accessError } = await supabase
      .from('export_permissions')
      .select('user_id')
      .eq('is_active', true)
      .in('user_id', staffIds)

    if (accessError) {
      setPermissionsError(accessError.message)
      setPermissionsLoading(false)
      return
    }

    const nextAccessMap = {}
    for (const row of accessData || []) {
      nextAccessMap[row.user_id] = true
    }
    setStaffExportAccess(nextAccessMap)
    setPermissionsLoading(false)
  }

  async function fetchExportHistory() {
    if (!user || user.role !== 'admin') return

    setExportLogsLoading(true)
    setExportLogsError(null)

    const { data: logsData, error: logsError } = await supabase
      .from('export_logs')
      .select('id, exported_by, month_year, record_count, exported_at')
      .order('exported_at', { ascending: false })

    if (logsError) {
      setExportLogsError(logsError.message)
      setExportLogsLoading(false)
      return
    }

    const logs = logsData || []
    const exporterIds = [...new Set(logs.map((log) => log.exported_by).filter(Boolean))]
    let nameMap = {}

    if (exporterIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', exporterIds)

      if (profileError) {
        setExportLogsError(profileError.message)
      } else {
        nameMap = (profileData || []).reduce((acc, profile) => {
          acc[profile.id] = profile.name
          return acc
        }, {})
      }
    }

    setExportLogs(
      logs.map((log) => ({
        ...log,
        exporterName: nameMap[log.exported_by] || log.exported_by
      }))
    )
    setExportLogsLoading(false)
  }

  async function fetchRecentAuditLogs() {
    if (!user) return

    setRecentAuditLoading(true)
    setRecentAuditError(null)

    const { data: logsData, error: logsError } = await supabase
      .from('activity_logs')
      .select('id, document_id, action, old_value, new_value, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(12)

    if (logsError) {
      setRecentAuditError(logsError.message)
      setRecentAuditLoading(false)
      return
    }

    const logs = logsData || []
    setRecentAuditLogs(logs)

    const actorIds = [...new Set(logs.map((log) => log.user_id).filter(Boolean))]
    if (actorIds.length === 0) {
      setRecentAuditUsers({})
      setRecentAuditLoading(false)
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', actorIds)

    if (profileError) {
      setRecentAuditError(profileError.message)
      setRecentAuditLoading(false)
      return
    }

    const userMap = (profileData || []).reduce((acc, profile) => {
      acc[profile.id] = profile.name
      return acc
    }, {})

    setRecentAuditUsers(userMap)
    setRecentAuditLoading(false)
  }

  async function handleToggleExportPermission(staffUserId) {
    if (!user || user.role !== 'admin') return

    setPermissionActionId(staffUserId)
    setPermissionsError(null)

    const hasActivePermission = Boolean(staffExportAccess[staffUserId])
    if (hasActivePermission) {
      const { error } = await supabase
        .from('export_permissions')
        .update({ is_active: false })
        .eq('user_id', staffUserId)
        .eq('is_active', true)

      if (error) {
        setPermissionsError(error.message)
        setPermissionActionId(null)
        return
      }
    } else {
      const { error } = await supabase
        .from('export_permissions')
        .insert({
          user_id: staffUserId,
          is_active: true,
          granted_by: user.id
        })

      if (error) {
        setPermissionsError(error.message)
        setPermissionActionId(null)
        return
      }
    }

    await fetchStaffExportPermissions()
    setPermissionActionId(null)
  }

  useEffect(() => {
    let mounted = true

    async function syncSessionUser(sessionUser) {
      if (!mounted) return
      if (!sessionUser) {
        setUser(null)
        setLoading(false)
        return
      }

      setUser(sessionUser)
      setLoading(false)

      const nextUser = await getUserWithProfile(sessionUser)
      if (!mounted) return
      setUser(nextUser)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSessionUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => (
    () => {
      if (passwordCloseTimerRef.current) {
        clearTimeout(passwordCloseTimerRef.current)
      }
    }
  ), [])

  useEffect(() => {
    if (!user) {
      setActiveSidebarLink('dashboard')
      setPasswordModalOpen(false)
      setShowInactivityWarning(false)
      setInactivityCountdown(120)
      inactivityWarningVisibleRef.current = false
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
      setPasswordError('')
      setPasswordSuccess('')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setCanExport(false)
      setExportPickerOpen(false)
      setExportError(null)
      setEditCounts({})
      setEditedCounts({})
      setStaffUsers([])
      setStaffExportAccess({})
      setPermissionsError(null)
      setPermissionActionId(null)
      setExportLogs([])
      setExportLogsError(null)
      setRecentAuditLogs([])
      setRecentAuditUsers({})
      setRecentAuditLoading(false)
      setRecentAuditError(null)
      return
    }

    if (!user.role) return

    fetchUserExportPermission(user)
    fetchRecentAuditLogs()

    if (user.role === 'admin') {
      fetchStaffExportPermissions()
      fetchExportHistory()
    } else {
      setStaffUsers([])
      setStaffExportAccess({})
      setPermissionsError(null)
      setPermissionActionId(null)
      setExportLogs([])
      setExportLogsError(null)
    }
  }, [user?.id, user?.role])

  async function fetchDocuments() {
    if (!user) return
    setDocLoading(true)
    setDocError(null)
    const { data, error } = await supabase
      .from('documents')
      .select('id, reference, beneficiary, description, status, due_date, date_out, status_updated_at, created_at, created_by, amount, document_type, batch_number')
      .order('created_at', { ascending: false })
    setDocLoading(false)
    if (error) {
      setDocError(error.message)
      return
    }
    const nextDocuments = data || []
    setDocuments(nextDocuments)
    fetchEditCounts(nextDocuments)
    fetchRecentAuditLogs()
  }

  async function fetchEditCounts(nextDocuments) {
    if (!user) {
      setEditCounts({})
      setEditedCounts({})
      return
    }

    const docIds = (nextDocuments || []).map((doc) => doc.id)
    if (docIds.length === 0) {
      setEditCounts({})
      setEditedCounts({})
      return
    }

    const { data: editData } = await supabase
      .from('activity_logs')
      .select('document_id')
      .eq('action', 'edited')
      .eq('user_id', user.id)
      .in('document_id', docIds)

    const counts = (editData || []).reduce((acc, log) => {
      acc[log.document_id] = (acc[log.document_id] || 0) + 1
      return acc
    }, {})
    setEditCounts(counts)

    const { data: allEditData } = await supabase
      .from('activity_logs')
      .select('document_id')
      .eq('action', 'edited')
      .in('document_id', docIds)

    const allCounts = (allEditData || []).reduce((acc, log) => {
      acc[log.document_id] = (acc[log.document_id] || 0) + 1
      return acc
    }, {})
    setEditedCounts(allCounts)
  }

  async function updateDocumentDetails(id) {
    setDocError(null)
    const beneficiaryValue = editBeneficiary.trim()
    const referenceValue = editReference.trim()
    const batchValue = editBatchNumber.trim()
    const descriptionValue = editDescription.trim()
    const amountValue = parseFloat(editAmount)

    if (!beneficiaryValue) {
      setDocError('Beneficiary is required')
      return false
    }
    if (!referenceValue) {
      setDocError('Reference number is required')
      return false
    }
    if (!batchValue) {
      setDocError('Batch number is required')
      return false
    }
    if (!descriptionValue) {
      setDocError('Description is required.')
      return false
    }
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setDocError('Amount must be a positive number')
      return false
    }

    const { error } = await supabase
      .from('documents')
      .update({
        beneficiary: beneficiaryValue,
        reference: referenceValue,
        batch_number: batchValue,
        description: descriptionValue,
        amount: amountValue,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null
      })
      .eq('id', id)

    if (error) {
      setDocError(error.message)
      return false
    }

    await supabase.from('activity_logs').insert({
      document_id: id,
      action: 'edited',
      new_value: editReason,
      user_id: user.id
    })

    setEditingId(null)
    setEditReason('')
    setEditBeneficiary('')
    setEditReference('')
    setEditBatchNumber('')
    setEditDescription('')
    setEditAmount('')
    setEditStatus('pending')
    setEditDueDate('')
    fetchDocuments()
    if (historyExpandedId === id) fetchActivityLogs(id)
    return true
  }

  async function handleInlineEditSave(doc) {
    const detailsSaved = await updateDocumentDetails(doc.id)
    if (!detailsSaved) return
    if (editStatus !== doc.status) {
      await updateDocumentStatus(doc.id, editStatus, doc.status)
    }
  }

  function setPermissionMessage(docId, message) {
    setPermissionMessages((prev) => ({ ...prev, [docId]: message }))
  }

  function clearPermissionMessage(docId) {
    setPermissionMessages((prev) => {
      if (!prev[docId]) return prev
      const next = { ...prev }
      delete next[docId]
      return next
    })
  }

  function toDateInputValue(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    const tzOffset = date.getTimezoneOffset() * 60 * 1000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10)
  }

  function startEdit(doc) {
    setEditingId(doc.id)
    setEditBeneficiary(doc.beneficiary || '')
    setEditReference(doc.reference || '')
    setEditBatchNumber(doc.batch_number || '')
    setEditDescription(doc.description || '')
    setEditAmount(doc.amount != null ? String(doc.amount) : '')
    setEditStatus(doc.status || 'pending')
    setEditDueDate(toDateInputValue(doc.due_date))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditReason('')
    setEditBeneficiary('')
    setEditReference('')
    setEditBatchNumber('')
    setEditDescription('')
    setEditAmount('')
    setEditStatus('pending')
    setEditDueDate('')
  }

  function handleEditClick(doc, userRole) {
    clearPermissionMessage(doc.id)
    if (userRole === 'staff' && doc.created_by !== user.id) {
      setPermissionMessage(doc.id, 'You can only edit documents you created.')
      return
    }

    setEditReason('')
    setEditReasonModalId(doc.id)
  }

  function handleEditReasonContinue() {
    if (!editReasonModalId) return
    const reason = editReason.trim()
    if (!reason) return

    const doc = documents.find((item) => item.id === editReasonModalId)
    if (!doc) {
      setEditReason('')
      setEditReasonModalId(null)
      return
    }

    setEditReason(reason)
    setEditReasonModalId(null)
    startEdit(doc)
  }

  function handleEditReasonCancel() {
    setEditReason('')
    setEditReasonModalId(null)
  }

  async function fetchActivityLogs(documentId) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, old_value, new_value, user_id, created_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
    if (error) return
    const logs = data || []
    setActivityLogs((prev) => ({ ...prev, [documentId]: logs }))

    const uniqueIds = [...new Set(logs.map((log) => log.user_id).filter(Boolean))]
    if (uniqueIds.length === 0) {
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', uniqueIds)

    const userMap = (profileData || []).reduce((acc, profile) => {
      acc[profile.id] = profile.name
      return acc
    }, {})
    setActivityLogUsers((prev) => ({ ...prev, ...userMap }))
  }

  function toggleHistory(docId) {
    if (historyExpandedId === docId) {
      setHistoryExpandedId(null)
      setActivityLogs((prev) => {
        if (!prev[docId]) return prev
        const next = { ...prev }
        delete next[docId]
        return next
      })
    } else {
      setHistoryExpandedId(docId)
      fetchActivityLogs(docId)
    }
  }

  async function updateDocumentStatus(id, newStatus, oldStatus) {
    const { error } = await supabase
      .from('documents')
      .update({
        status: newStatus,
        date_out: newStatus === 'completed' ? new Date().toISOString() : null,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      setDocError(error.message)
      return
    }

    await supabase.from('activity_logs').insert({
      document_id: id,
      action: 'status_changed',
      old_value: oldStatus ?? null,
      new_value: newStatus,
      user_id: user.id
    })

    fetchDocuments()
    if (historyExpandedId === id) fetchActivityLogs(id)
  }

  async function handleStatusChange(doc, newStatus, userRole) {
    clearPermissionMessage(doc.id)
    if (userRole === 'staff' && doc.created_by !== user.id) {
      setPermissionMessage(doc.id, 'You can only edit documents you created.')
      return
    }

    await updateDocumentStatus(doc.id, newStatus, doc.status)
  }

  async function deleteDocument(docId) {
    setDocError(null)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)

    if (error) {
      setDocError(error.message)
      return false
    }

    if (historyExpandedId === docId) {
      setHistoryExpandedId(null)
    }

    setActivityLogs((prev) => {
      if (!prev[docId]) return prev
      const next = { ...prev }
      delete next[docId]
      return next
    })

    if (editReasonModalId === docId) {
      setEditReason('')
      setEditReasonModalId(null)
    }

    clearPermissionMessage(docId)
    fetchDocuments()
    return true
  }

  async function handleDeleteClick(doc, userRole) {
    clearPermissionMessage(doc.id)
    if (userRole === 'staff') {
      setPermissionMessage(doc.id, 'Only admins can delete documents.')
      return
    }

    await deleteDocument(doc.id)
  }

  async function createDocument() {
    const refValue = reference.trim()
    if (!refValue) {
      setDocError('Reference number is required')
      return false
    }
    const beneficiaryValue = beneficiary.trim()
    if (!beneficiaryValue) {
      setDocError('Beneficiary is required')
      return false
    }
    const batchValue = batchNumber.trim()
    if (!batchValue) {
      setDocError('Batch number is required')
      return false
    }
    const descriptionValue = description.trim()
    if (!descriptionValue) {
      setDocError('Description is required.')
      return false
    }
    const detectedType = detectDocumentType(batchValue)
    const documentType = detectedType || manualDocumentType
    if (!documentType) {
      setDocError('Document type is required')
      return false
    }
    const amountValue = parseFloat(amount)
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setDocError('Amount must be a positive number')
      return false
    }

    const { data: newDoc, error } = await supabase
      .from('documents')
      .insert({
        reference: refValue,
        beneficiary: beneficiaryValue,
        batch_number: batchValue,
        description: descriptionValue,
        amount: amountValue,
        status,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user.id,
        document_type: documentType
      })
      .select('id')
      .single()

    if (error) {
      setDocError(error.message)
      return false
    }

    await supabase.from('activity_logs').insert({
      document_id: newDoc.id,
      action: 'created',
      user_id: user.id
    })

    fetchDocuments()
    return true
  }

  useEffect(() => {
    if (user) fetchDocuments()
  }, [user])

  async function handleSubmitDocument(e) {
    e.preventDefault()
    setDocError(null)

    if (!beneficiary || beneficiary.trim() === '') {
      setDocError('Beneficiary is required')
      return
    }

    if (!reference || reference.trim() === '') {
      setDocError('Reference number is required')
      return
    }

    if (!batchNumber || batchNumber.trim() === '') {
      setDocError('Batch number is required')
      return
    }

    setSubmitLoading(true)
    const success = await createDocument()
    setSubmitLoading(false)

    if (success) {
      setBeneficiary('')
      setDescription('')
      setReference('')
      setBatchNumber('')
      setManualDocumentType('')
      setAmount('')
      setStatus('pending')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoginLoading(true)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoginLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    if (signInData?.user) {
      const nextUser = await getUserWithProfile(signInData.user)
      setUser(nextUser)
    }

    setEmail('')
    setPassword('')
    setShowPassword(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  function resetInactivityTimer() {
    if (inactivityWarningVisibleRef.current) {
      inactivityWarningVisibleRef.current = false
      setShowInactivityWarning(false)
      setInactivityCountdown(120)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    inactivityTimerRef.current = setTimeout(() => {
      inactivityWarningVisibleRef.current = true
      setShowInactivityWarning(true)
      setInactivityCountdown(120)

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }

      countdownIntervalRef.current = setInterval(() => {
        setInactivityCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }
            inactivityWarningVisibleRef.current = false
            setShowInactivityWarning(false)
            handleLogout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 58 * 60 * 1000)
  }

  useEffect(() => {
    if (!user) return

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer))
    resetInactivityTimer()

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer))
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [user])

  function closePasswordModal() {
    setPasswordModalOpen(false)
    setPasswordError('')
    setPasswordSuccess('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setPasswordUpdating(false)
    if (passwordCloseTimerRef.current) {
      clearTimeout(passwordCloseTimerRef.current)
      passwordCloseTimerRef.current = null
    }
  }

  function openPasswordModal() {
    setPasswordModalOpen(true)
    setPasswordError('')
    setPasswordSuccess('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm must match.')
      return
    }

    setPasswordUpdating(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })
    if (signInError) {
      setPasswordError('Current password is incorrect.')
      setPasswordUpdating(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (updateError) {
      setPasswordError(updateError.message)
      setPasswordUpdating(false)
      return
    }

    setPasswordUpdating(false)
    setPasswordSuccess('Password updated successfully.')
    if (passwordCloseTimerRef.current) {
      clearTimeout(passwordCloseTimerRef.current)
    }
    passwordCloseTimerRef.current = setTimeout(() => {
      closePasswordModal()
    }, 2000)
  }

  async function handleExportMonthlyReport() {
    if (!user || !(user.role === 'admin' || canExport)) return

    const monthNumber = Number(selectedExportMonth)
    const yearNumber = Number(selectedExportYear)
    if (!monthNumber || !yearNumber) {
      setExportError('Select a valid month and year.')
      return
    }

    setExportLoading(true)
    setExportError(null)

    try {
      const filteredDocs = documents.filter((doc) => {
        if (!doc.created_at) return false
        const createdAt = new Date(doc.created_at)
        return createdAt.getFullYear() === yearNumber &&
          createdAt.getMonth() + 1 === monthNumber &&
          doc.document_type === activeTab
      })

      const monthlyTotalAmount = filteredDocs.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0)
      const reportRows = [
        ['Entry Date', 'Beneficiary', 'Description', 'Reference Number / Payment Voucher Number', 'Batch No', 'Amount', 'Date Out', 'Status'],
        ...filteredDocs.map((doc) => ([
          doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '',
          doc.beneficiary || '',
          doc.description || '',
          doc.reference || '',
          doc.batch_number || '',
          formatAmount(doc.amount),
          doc.date_out ? new Date(doc.date_out).toLocaleDateString() : '',
          formatStatusForDisplay(doc.status)
        ])),
        [],
        ['TOTAL DOCUMENTS', filteredDocs.length],
        ['TOTAL AMOUNT', formatAmount(monthlyTotalAmount)]
      ]

      const workbook = XLSX.utils.book_new()
      const reportSheet = XLSX.utils.aoa_to_sheet(reportRows)

      XLSX.utils.book_append_sheet(workbook, reportSheet, 'Monthly Report')

      const paddedMonth = String(monthNumber).padStart(2, '0')
      const reportPrefix = activeTab === 'third_party' ? 'third-party-report' : 'claims-report'
      XLSX.writeFile(workbook, `${reportPrefix}-${yearNumber}-${paddedMonth}.xlsx`)

      const { error: exportLogError } = await supabase.from('export_logs').insert({
        exported_by: user.id,
        month_year: `${selectedExportMonth}/${selectedExportYear}`,
        record_count: filteredDocs.length,
        exported_at: new Date().toISOString()
      })
      if (exportLogError) throw new Error(exportLogError.message)

      setExportPickerOpen(false)
      if (user.role === 'admin') {
        fetchExportHistory()
      }
    } catch (err) {
      setExportError(err?.message || 'Failed to export report.')
    } finally {
      setExportLoading(false)
    }
  }

  function getDueStatus(dueDate) {
    if (!dueDate) return 'normal'
    const now = new Date()
    const due = new Date(dueDate)
    if (now > due) return 'overdue'
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'due_today'
    return 'normal'
  }

  function getDueText(dueDate) {
    if (!dueDate) return 'No due date'
    const now = new Date()
    const due = new Date(dueDate)
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `Overdue by ${Math.abs(diff)} day(s)`
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Due tomorrow'
    return `Due in ${diff} days`
  }

  function isDocOverdue(doc) {
    if (!doc?.due_date) return false
    return new Date(doc.due_date) < new Date() && doc.status !== 'completed'
  }

  function isDueSoon(doc) {
    if (!doc?.due_date || doc.status === 'completed') return false
    const now = new Date()
    const due = new Date(doc.due_date)
    if (now > due) return false
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    return diff <= 2
  }

  function formatDueDate(value) {
    if (!value) return 'No due date'
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatAmount(value) {
    const number = Number(value)
    if (Number.isNaN(number)) return '0.00'
    return number.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  function detectDocumentType(batchValue) {
    const val = (batchValue || '').trim().toUpperCase()
    if (val.startsWith('TPP') || val.startsWith('NCDF')) return 'third_party'
    if (val.startsWith('SP')) return 'claims'
    return null
  }

  function getDescriptionExcerpt(value) {
    if (!value) return 'No description provided.'
    const text = value.replace(/\s+/g, ' ').trim()
    if (text.length <= 160) return text
    return `${text.slice(0, 157)}...`
  }

  function formatStatusForDisplay(value) {
    if (value === 'pending') return 'Pending'
    if (value === 'in_progress') return 'In Progress'
    if (value === 'completed') return 'Sent'
    if (value === 'overdue') return 'Overdue'
    return value
  }

  function formatActivityLog(log, currentUserId, userMap) {
    const actor = log.user_id === currentUserId ? 'You' : (userMap[log.user_id] || 'Unknown')
    if (log.action === 'created') return `${actor} created this document`
    if (log.action === 'edited') {
      return log.new_value
        ? `${actor} edited this document - Reason: ${log.new_value}`
        : `${actor} edited this document`
    }
    if (log.action === 'status_changed') {
      const from = formatStatusForDisplay(log.old_value)
      const to = formatStatusForDisplay(log.new_value)
      return `${actor} changed status from ${from} → ${to}`
    }
    return `${actor} performed action: ${log.action}`
  }

  function getBadgeForDocument(doc) {
    if (isDocOverdue(doc)) return { label: 'Overdue', className: 'status-overdue' }
    if (doc.status === 'pending') return { label: 'Pending', className: 'status-pending' }
    if (doc.status === 'in_progress') return { label: 'In Progress', className: 'status-in-progress' }
    if (doc.status === 'completed') return { label: 'Sent', className: 'status-sent' }
    return { label: formatStatusForDisplay(doc.status), className: 'status-pending' }
  }

  function formatDocumentType(value) {
    if (value === 'third_party') return 'Third Party'
    if (value === 'claims') return 'Claims'
    return value
  }

  function getDocumentTypeClassName(value) {
    return value === 'third_party' ? 'doc-type-third-party' : 'doc-type-claims'
  }

  function handleSidebarNavigation(linkKey, targetRef, disabled = false) {
    if (disabled) return

    setActiveSidebarLink(linkKey)
    if (!targetRef?.current) return

    targetRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const activeTabDocuments = documents.filter((doc) => doc.document_type === activeTab)
  const detectedDocumentType = detectDocumentType(batchNumber)

  const filteredDocuments = activeTabDocuments.filter((doc) => {
    const matchesSearch = !search.trim() || [doc.beneficiary, doc.description, doc.reference, doc.batch_number]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))

    const matchesFilter =
      filter === 'all' ||
      (filter === 'overdue' && isDocOverdue(doc)) ||
      (filter === 'pending' && doc.status === 'pending') ||
      (filter === 'in_progress' && doc.status === 'in_progress') ||
      (filter === 'completed' && doc.status === 'completed')

    const matchesDateFrom = !filterDateFrom ||
      new Date(doc.created_at) >= new Date(filterDateFrom)
    const matchesDateTo = !filterDateTo ||
      new Date(doc.created_at) <= new Date(filterDateTo + 'T23:59:59')

    return matchesSearch && matchesFilter && matchesDateFrom && matchesDateTo
  })

  const overdueCount = documents.filter(isDocOverdue).length
  const dueSoonCount = documents.filter(isDueSoon).length
  const sentCount = documents.filter((doc) => doc.status === 'completed').length
  const totalAmount = documents.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0)
  const userRole = user?.role === 'admin' ? 'admin' : 'staff'
  const hasExportAccess = userRole === 'admin' || canExport
  const displayName = user?.name || user?.email || 'Unknown User'
  const documentReferenceMap = documents.reduce((acc, doc) => {
    acc[doc.id] = doc.reference || doc.batch_number || 'Unknown document'
    return acc
  }, {})
  const sidebarLinks = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      targetRef: dashboardSectionRef,
      disabled: false
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: Files,
      targetRef: documentsSectionRef,
      disabled: false,
      badge: documents.length
    },
    {
      key: 'export',
      label: 'Export',
      icon: Download,
      targetRef: userRole === 'admin' ? exportSectionRef : documentsSectionRef,
      disabled: !hasExportAccess
    },
    {
      key: 'audit',
      label: 'Audit Log',
      icon: ClipboardList,
      targetRef: auditSectionRef,
      disabled: false
    },
    {
      key: 'permissions',
      label: 'Permissions',
      icon: Shield,
      targetRef: permissionsSectionRef,
      disabled: userRole !== 'admin'
    }
  ]
  const editReasonModalDocument = documents.find((doc) => doc.id === editReasonModalId)
  const deleteConfirmDocument = documents.find((doc) => doc.id === deleteConfirmId)
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]
  const exportYearOptions = [
    ...new Set([
      String(new Date().getFullYear()),
      ...documents
        .map((doc) => new Date(doc.created_at).getFullYear())
        .filter((year) => !Number.isNaN(year))
        .map(String)
    ])
  ].sort((a, b) => Number(b) - Number(a))

  if (loading) {
    return (
      <div className="app-shell app-loading">
        <p className="loading-msg">Loading...</p>
      </div>
    )
  }

  const dashboardView = (
    <div className="app-shell app-shell-dashboard">
      <aside className="app-sidebar" aria-label="Workspace navigation">
        <div className="sidebar-main">
          <div className="sidebar-brand">
            <span className="sidebar-logo" aria-hidden="true">
              <FileSpreadsheet size={16} strokeWidth={2.1} />
            </span>
            <div>
              <p className="sidebar-brand-title">Document Tracker</p>
              <p className="sidebar-brand-subtitle">Workspace</p>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Primary">
            {sidebarLinks.map((link) => {
              const LinkIcon = link.icon
              const isActive = activeSidebarLink === link.key && !link.disabled
              return (
                <button
                  key={link.key}
                  type="button"
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                  disabled={link.disabled}
                  onClick={() => handleSidebarNavigation(link.key, link.targetRef, link.disabled)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="sidebar-link-icon" aria-hidden="true">
                    <LinkIcon size={16} strokeWidth={2.1} />
                  </span>
                  <span className="sidebar-link-label">{link.label}</span>
                  {typeof link.badge === 'number' && (
                    <span className="sidebar-doc-count">{link.badge}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-user-name">{displayName}</p>
          <span className={`role-badge role-badge-${userRole}`}>{userRole}</span>
          <p className="sidebar-user-email">{user?.email}</p>
          <div className="sidebar-user-actions">
            <button type="button" className="sidebar-action-btn" onClick={openPasswordModal}>
              <KeyRound size={14} strokeWidth={2.1} />
              <span>Change password</span>
            </button>
            <button
              type="button"
              className="sidebar-action-btn sidebar-action-btn-danger"
              onClick={handleLogout}
            >
              <LogOut size={14} strokeWidth={2.1} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-content">
        <section ref={dashboardSectionRef} className="sidebar-target">
          <KPIBar
            totalDocuments={documents.length}
            totalAmount={totalAmount}
            overdueCount={overdueCount}
            dueSoonCount={dueSoonCount}
            sentCount={sentCount}
            formatAmount={formatAmount}
          />
        </section>

        <DocumentForm
          beneficiary={beneficiary}
          setBeneficiary={setBeneficiary}
          reference={reference}
          setReference={setReference}
          batchNumber={batchNumber}
          setBatchNumber={setBatchNumber}
          description={description}
          setDescription={setDescription}
          amount={amount}
          setAmount={setAmount}
          status={status}
          setStatus={setStatus}
          manualDocumentType={manualDocumentType}
          setManualDocumentType={setManualDocumentType}
          detectedDocumentType={detectedDocumentType}
          docError={docError}
          submitLoading={submitLoading}
          onSubmit={handleSubmitDocument}
          formatDocumentType={formatDocumentType}
        />

        <section
          ref={documentsSectionRef}
          className="panel documents-panel sidebar-target"
          data-print-title="Third Party Documents"
        >
          <div className="tab-switcher" role="tablist" aria-label="Document Type Tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'third_party' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('third_party')}
            >
              Third Party
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'claims' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('claims')}
            >
              Claims
            </button>
          </div>

          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Documents</h2>
              <p>Search, filter, edit, and monitor activity inline.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-neutral"
                onClick={() => window.print()}
              >
                Print List
              </button>
              {hasExportAccess && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setExportError(null)
                    setExportPickerOpen((prev) => !prev)
                  }}
                >
                  {exportPickerOpen ? 'Close Export' : 'Export Monthly Report'}
                </button>
              )}
            </div>
          </div>

          {hasExportAccess && exportPickerOpen && (
            <div className="export-picker">
              <div className="export-picker-controls">
                <div className="form-group export-control">
                  <label htmlFor="export-month">Month</label>
                  <select
                    id="export-month"
                    value={selectedExportMonth}
                    onChange={(e) => setSelectedExportMonth(e.target.value)}
                  >
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group export-control">
                  <label htmlFor="export-year">Year</label>
                  <select
                    id="export-year"
                    value={selectedExportYear}
                    onChange={(e) => setSelectedExportYear(e.target.value)}
                  >
                    {exportYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary export-confirm-btn"
                  onClick={handleExportMonthlyReport}
                  disabled={exportLoading}
                >
                  {exportLoading ? 'Exporting...' : 'Confirm Export'}
                </button>
              </div>
              {exportError && <p className="error-msg">{exportError}</p>}
            </div>
          )}

          <div className="controls-row">
            <div className="control-field">
              <label htmlFor="search-documents">Search</label>
              <input
                id="search-documents"
                type="text"
                placeholder="Search by beneficiary, description, reference, or batch number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="control-field">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Sent</option>
              </select>
            </div>
            <div className="control-field">
              <label htmlFor="filter-date-from">From</label>
              <input
                id="filter-date-from"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className="control-field">
              <label htmlFor="filter-date-to">To</label>
              <input
                id="filter-date-to"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>

          {docError && <p className="error-msg">{docError}</p>}

          {docLoading && <p className="loading-msg">Loading documents...</p>}
          {!docLoading && activeTabDocuments.length === 0 && <p className="empty-msg">No documents yet.</p>}
          {!docLoading && activeTabDocuments.length > 0 && filteredDocuments.length === 0 && (
            <p className="empty-msg">No documents match your search or filter.</p>
          )}

          {!docLoading && activeTabDocuments.length > 0 && filteredDocuments.length > 0 && (
            <div className="document-grid">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  userRole={userRole}
                  currentUserId={user.id}
                  editingId={editingId}
                  editBeneficiary={editBeneficiary}
                  setEditBeneficiary={setEditBeneficiary}
                  editReference={editReference}
                  setEditReference={setEditReference}
                  editBatchNumber={editBatchNumber}
                  setEditBatchNumber={setEditBatchNumber}
                  editDescription={editDescription}
                  setEditDescription={setEditDescription}
                  editAmount={editAmount}
                  setEditAmount={setEditAmount}
                  editStatus={editStatus}
                  setEditStatus={setEditStatus}
                  editDueDate={editDueDate}
                  setEditDueDate={setEditDueDate}
                  historyExpandedId={historyExpandedId}
                  activityLogs={activityLogs}
                  activityLogUsers={activityLogUsers}
                  editCounts={editCounts}
                  editedCounts={editedCounts}
                  permissionMessages={permissionMessages}
                  onEditClick={handleEditClick}
                  onDeleteClick={setDeleteConfirmId}
                  onToggleHistory={toggleHistory}
                  onStatusChange={handleStatusChange}
                  onInlineEditSave={handleInlineEditSave}
                  onCancelEdit={cancelEdit}
                  getBadgeForDocument={getBadgeForDocument}
                  getDueStatus={getDueStatus}
                  getDueText={getDueText}
                  formatDueDate={formatDueDate}
                  formatAmount={formatAmount}
                  formatStatusForDisplay={formatStatusForDisplay}
                  formatDocumentType={formatDocumentType}
                  getDocumentTypeClassName={getDocumentTypeClassName}
                  formatActivityLog={formatActivityLog}
                  getDescriptionExcerpt={getDescriptionExcerpt}
                  isDocOverdue={isDocOverdue}
                />
              ))}
            </div>
          )}
        </section>

        {userRole === 'admin' && (
          <section ref={exportSectionRef} className="panel export-history-panel sidebar-target">
            <div className="panel-heading">
              <h2>Export History</h2>
              <p>Who exported, when, and how many records were included.</p>
            </div>
            {exportLogsError && <p className="error-msg">{exportLogsError}</p>}
            {exportLogsLoading && <p className="loading-msg">Loading export history...</p>}
            {!exportLogsLoading && exportLogs.length === 0 && (
              <p className="empty-msg">No export history yet.</p>
            )}
            {!exportLogsLoading && exportLogs.length > 0 && (
              <ul className="export-history-list">
                {exportLogs.map((log) => (
                  <li key={log.id} className="export-history-item">
                    <span className="export-history-icon" aria-hidden="true">
                      <FileSpreadsheet size={16} strokeWidth={2.1} />
                    </span>
                    <div className="export-history-content">
                      <p className="export-history-primary">{log.exporterName || 'Unknown User'}</p>
                      <p className="export-history-meta">
                        {log.month_year} | {log.record_count} record(s) | {new Date(log.exported_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section ref={auditSectionRef} className="panel audit-log-panel sidebar-target">
          <div className="panel-heading">
            <h2>Audit Log</h2>
            <p>Recent actions captured across the workspace.</p>
          </div>
          {recentAuditError && <p className="error-msg">{recentAuditError}</p>}
          {recentAuditLoading && <p className="loading-msg">Loading audit log...</p>}
          {!recentAuditLoading && recentAuditLogs.length === 0 && (
            <p className="empty-msg">No audit events yet.</p>
          )}
          {!recentAuditLoading && recentAuditLogs.length > 0 && (
            <ul className="audit-log-list">
              {recentAuditLogs.map((log) => (
                <li key={log.id} className="audit-log-item">
                  <p className="audit-log-primary">{formatActivityLog(log, user.id, recentAuditUsers)}</p>
                  <p className="audit-log-meta">
                    {documentReferenceMap[log.document_id] || 'Unknown document'} | {new Date(log.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {userRole === 'admin' && (
          <section ref={permissionsSectionRef} className="panel export-permissions-panel sidebar-target">
            <div className="panel-heading">
              <h2>Export Permissions</h2>
              <p>Grant or revoke export access for staff users.</p>
            </div>
            {permissionsError && <p className="error-msg">{permissionsError}</p>}
            {permissionsLoading && <p className="loading-msg">Loading permissions...</p>}
            {!permissionsLoading && staffUsers.length === 0 && (
              <p className="empty-msg">No staff users found.</p>
            )}
            {!permissionsLoading && staffUsers.length > 0 && (
              <ul className="permission-list">
                {staffUsers.map((staffUser) => {
                  const hasAccess = Boolean(staffExportAccess[staffUser.id])
                  const buttonLabel = hasAccess ? 'Revoke Access' : 'Grant Access'
                  return (
                    <li key={staffUser.id} className="permission-item">
                      <span className="permission-user-name">{staffUser.name || staffUser.id}</span>
                      <button
                        type="button"
                        className={`btn btn-small ${hasAccess ? 'btn-danger' : 'btn-primary'}`}
                        disabled={permissionActionId === staffUser.id}
                        onClick={() => handleToggleExportPermission(staffUser.id)}
                      >
                        {permissionActionId === staffUser.id ? 'Saving...' : buttonLabel}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        {editReasonModalDocument && (
          <EditReasonModal
            document={editReasonModalDocument}
            editReason={editReason}
            onReasonChange={setEditReason}
            onContinue={handleEditReasonContinue}
            onCancel={handleEditReasonCancel}
          />
        )}

        {deleteConfirmDocument && (
          <DeleteModal
            document={deleteConfirmDocument}
            onConfirm={async () => {
              await handleDeleteClick(deleteConfirmDocument, userRole)
              setDeleteConfirmId(null)
            }}
            onCancel={() => setDeleteConfirmId(null)}
          />
        )}

        {passwordModalOpen && (
          <PasswordModal
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmNewPassword={confirmNewPassword}
            passwordError={passwordError}
            passwordSuccess={passwordSuccess}
            passwordUpdating={passwordUpdating}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmNewPasswordChange={setConfirmNewPassword}
            onSubmit={handlePasswordUpdate}
            onCancel={closePasswordModal}
          />
        )}

        {showInactivityWarning && (
          <InactivityModal countdown={inactivityCountdown} onStayLoggedIn={resetInactivityTimer} />
        )}
      </main>
    </div>
  )

  const loginView = (
    <div className="auth-shell">
      <section className="auth-hero" aria-label="Product highlights">
        <div className="auth-brand">
          <span className="auth-logo" aria-hidden="true">
            <FileSpreadsheet size={18} strokeWidth={2.1} />
          </span>
          <span className="auth-brand-name">Document Tracker</span>
        </div>

        <div className="auth-hero-content">
          <h1>Every document. Accounted for.</h1>
          <p>
            Keep every case document traceable from intake to completion in one clean, shared
            workspace.
          </p>

          <ul className="auth-feature-list">
            <li>
              <span className="auth-feature-icon" aria-hidden="true">
                <ShieldCheck size={15} strokeWidth={2.2} />
              </span>
              <span>Full audit trail</span>
            </li>
            <li>
              <span className="auth-feature-icon" aria-hidden="true">
                <FileSpreadsheet size={15} strokeWidth={2.2} />
              </span>
              <span>Monthly Excel export</span>
            </li>
            <li>
              <span className="auth-feature-icon" aria-hidden="true">
                <CalendarClock size={15} strokeWidth={2.2} />
              </span>
              <span>Auto due dates</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="auth-panel" aria-label="Sign in form">
        <div className="auth-form-wrap">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in with your workspace credentials.</p>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <div className="auth-password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={14} strokeWidth={2.2} /> : <Eye size={14} strokeWidth={2.2} />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Sign in to workspace'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : loginView} />
      <Route path="/" element={user ? dashboardView : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
