import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
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
  const accountMenuRef = useRef(null)
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

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!accountMenuRef.current) return
      if (!accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
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
      setAccountMenuOpen(false)
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
      return
    }

    if (!user.role) return

    fetchUserExportPermission(user)

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
  }

  async function handleLogout() {
    setAccountMenuOpen(false)
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
    setAccountMenuOpen(false)
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
    if (!user || !canExport) return

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

    return matchesSearch && matchesFilter
  })

  const overdueCount = documents.filter(isDocOverdue).length
  const dueSoonCount = documents.filter(isDueSoon).length
  const sentCount = documents.filter((doc) => doc.status === 'completed').length
  const totalAmount = documents.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0)
  const userRole = user?.role === 'admin' ? 'admin' : 'staff'
  const displayName = user?.name || user?.email || 'Unknown User'
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
    <div className="app-shell">
      <header className="top-nav">
        <div className="nav-brand">
          <span className="brand-mark">DT</span>
          <div>
            <p className="brand-title">Document Tracker</p>
            <p className="brand-subtitle">SaaS Workspace</p>
          </div>
        </div>
        <div className="nav-user">
          <div className="account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className="account-trigger"
              onClick={() => setAccountMenuOpen((prev) => !prev)}
            >
              <div className="user-identity">
                <span className="user-name">{displayName}</span>
                <span className={`role-badge role-badge-${userRole}`}>{userRole}</span>
              </div>
            </button>
            {accountMenuOpen && (
              <div className="account-dropdown">
                <button type="button" className="account-menu-item" onClick={openPasswordModal}>
                  Change Password
                </button>
                <button type="button" className="account-menu-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
          <span className="user-email">{user?.email}</span>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="kpi-bar" aria-label="Document Summary">
          <article className="kpi-card">
            <p className="kpi-label">Total Documents</p>
            <p className="kpi-value">{documents.length}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Total Amount</p>
            <p className="kpi-value">{formatAmount(totalAmount)}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Overdue</p>
            <p className="kpi-value value-overdue">{overdueCount}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Due Soon</p>
            <p className="kpi-value">{dueSoonCount}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Total Sent</p>
            <p className="kpi-value">{sentCount}</p>
          </article>
        </section>

        {userRole === 'admin' && (
          <section className="panel export-permissions-panel">
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

        <section className="panel create-panel">
          <div className="panel-heading">
            <h2>Create Document</h2>
            <p>Add new records with an initial workflow status.</p>
          </div>
          <form className="create-form" onSubmit={handleSubmitDocument}>
            <div className="form-group">
              <label htmlFor="beneficiary">Beneficiary</label>
              <input
                id="beneficiary"
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reference">Reference Number / Payment Voucher Number</label>
              <input
                id="reference"
                type="text"
                placeholder="e.g. DOC-2026-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="batch-number">Batch Number</label>
              <input
                id="batch-number"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                required
              />
              {detectedDocumentType ? (
                <p className="detected-type-label">Detected: {formatDocumentType(detectedDocumentType)}</p>
              ) : (
                <div className="manual-type-select-wrap">
                  <label htmlFor="manual-document-type">Select type</label>
                  <select
                    id="manual-document-type"
                    value={manualDocumentType}
                    onChange={(e) => setManualDocumentType(e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option value="third_party">Third Party</option>
                    <option value="claims">Claims</option>
                  </select>
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Sent</option>
              </select>
            </div>
            {docError && <p className="error-msg">{docError}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? 'Adding...' : 'Add Document'}
            </button>
          </form>
        </section>

        <section className="panel documents-panel">
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
            {canExport && (
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

          {canExport && exportPickerOpen && (
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
          </div>

          {docError && <p className="error-msg">{docError}</p>}

          {docLoading && <p className="loading-msg">Loading documents...</p>}
          {!docLoading && activeTabDocuments.length === 0 && <p className="empty-msg">No documents yet.</p>}
          {!docLoading && activeTabDocuments.length > 0 && filteredDocuments.length === 0 && (
            <p className="empty-msg">No documents match your search or filter.</p>
          )}

          {!docLoading && activeTabDocuments.length > 0 && filteredDocuments.length > 0 && (
            <div className="document-grid">
              {filteredDocuments.map((doc) => {
                const badge = getBadgeForDocument(doc)
                const dueStatus = getDueStatus(doc.due_date)
                const documentActivityLogs = activityLogs[doc.id] || []
                const hasEdited = (editedCounts[doc.id] || 0) > 0
                const hasReachedEditLimit = userRole === 'staff' && (editCounts[doc.id] || 0) >= 3
                return (
                  <article key={doc.id} className="document-card">
                    {editingId === doc.id ? (
                      <div className="edit-panel">
                        <h3 className="edit-title">Edit Document</h3>
                        <div className="form-group">
                          <label htmlFor={`edit-beneficiary-${doc.id}`}>Beneficiary</label>
                          <input
                            id={`edit-beneficiary-${doc.id}`}
                            type="text"
                            value={editBeneficiary}
                            onChange={(e) => setEditBeneficiary(e.target.value)}
                            autoFocus
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-reference-${doc.id}`}>Reference Number / Payment Voucher Number</label>
                          <input
                            id={`edit-reference-${doc.id}`}
                            type="text"
                            value={editReference}
                            onChange={(e) => setEditReference(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-batch-${doc.id}`}>Batch Number</label>
                          <input
                            id={`edit-batch-${doc.id}`}
                            type="text"
                            value={editBatchNumber}
                            onChange={(e) => setEditBatchNumber(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-desc-${doc.id}`}>Description</label>
                          <textarea
                            id={`edit-desc-${doc.id}`}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-amount-${doc.id}`}>Amount</label>
                          <input
                            id={`edit-amount-${doc.id}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-status-${doc.id}`}>Status</label>
                          <select
                            id={`edit-status-${doc.id}`}
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Sent</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-due-${doc.id}`}>Due Date</label>
                          <input
                            id={`edit-due-${doc.id}`}
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                          />
                        </div>
                        <div className="inline-actions">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleInlineEditSave(doc)}
                          >
                            Save
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="card-top-row">
                          <span className={`document-type-pill ${getDocumentTypeClassName(doc.document_type)}`}>
                            {formatDocumentType(doc.document_type)}
                          </span>
                        </div>
                        <h3 className="document-title">{doc.beneficiary || 'N/A'}</h3>
                        <p className="document-reference">PV No: {doc.reference || 'N/A'}</p>
                        <p className="document-batch">Batch No: {doc.batch_number || 'N/A'}</p>
                        <p className="document-description">{getDescriptionExcerpt(doc.description)}</p>
                        <p className="document-amount">Amount: ₦ {formatAmount(doc.amount)}</p>
                        <div className="status-row">
                          <span className={`status-pill ${badge.className}`}>{badge.label}</span>
                          {hasEdited && <span className="edited-pill">Edited</span>}
                        </div>
                        <p className={`document-due ${dueStatus === 'overdue' ? 'due-overdue' : ''}`}>
                          Due Date: {formatDueDate(doc.due_date)} ({getDueText(doc.due_date)})
                        </p>

                        <div className="status-control">
                          <label htmlFor={`status-${doc.id}`}>Status</label>
                          <select
                            id={`status-${doc.id}`}
                            value={doc.status}
                            onChange={(e) => handleStatusChange(doc, e.target.value, userRole)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Sent</option>
                          </select>
                        </div>

                        <div className="card-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-small"
                            onClick={() => handleEditClick(doc, userRole)}
                            disabled={hasReachedEditLimit}
                            title={hasReachedEditLimit ? 'Edit limit reached. Contact your administrator.' : undefined}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger btn-small" onClick={() => setDeleteConfirmId(doc.id)}>
                            Delete
                          </button>
                          <button
                            type="button"
                            className={`btn btn-neutral btn-small ${historyExpandedId === doc.id ? 'btn-active' : ''}`}
                            onClick={() => toggleHistory(doc.id)}
                          >
                            {historyExpandedId === doc.id ? 'Hide History' : 'View History'}
                          </button>
                        </div>
                        {hasReachedEditLimit && (
                          <p className="edit-limit-msg">Edit limit reached. Contact your administrator.</p>
                        )}
                        {permissionMessages[doc.id] && (
                          <p className="inline-permission-msg">{permissionMessages[doc.id]}</p>
                        )}

                        {historyExpandedId === doc.id && (
                          <div className="activity-history">
                            {documentActivityLogs.length === 0 && <p className="empty-msg">No activity yet.</p>}
                            {documentActivityLogs.length > 0 && (
                              <ul className="activity-list">
                                {documentActivityLogs.map((log) => (
                                  <li key={log.id} className="activity-item">
                                    <span className="activity-message">
                                      {formatActivityLog(log, user.id, activityLogUsers)}
                                    </span>
                                    <span className="activity-meta">
                                      {' '}
                                      {new Date(log.created_at).toLocaleString()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {editReasonModalDocument && (
          <div className="modal-overlay">
            <div className="edit-reason-modal" role="dialog" aria-modal="true" aria-labelledby="edit-reason-title">
              <h3 id="edit-reason-title" className="edit-reason-title">Reason for Edit</h3>
              <div className="form-group">
                <label htmlFor="edit-reason-textarea">Please provide a reason for editing this document.</label>
                <textarea
                  id="edit-reason-textarea"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={4}
                  required
                  autoFocus
                />
              </div>
              <div className="edit-reason-actions">
                <button type="button" className="btn btn-primary" onClick={handleEditReasonContinue}>
                  Continue
                </button>
                <button type="button" className="btn btn-neutral" onClick={handleEditReasonCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmDocument && (
          <div className="modal-overlay">
            <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-message">
              <p id="delete-confirm-message" className="confirm-modal-message">
                Are you sure you want to delete this document? This action cannot be undone.
              </p>
              <p className="confirm-modal-detail">
                Beneficiary: <strong>{deleteConfirmDocument.beneficiary || 'N/A'}</strong>
              </p>
              <p className="confirm-modal-detail">
                Reference Number / Payment Voucher Number: <strong>{deleteConfirmDocument.reference || 'N/A'}</strong>
              </p>
              <div className="confirm-modal-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    await handleDeleteClick(deleteConfirmDocument, userRole)
                    setDeleteConfirmId(null)
                  }}
                >
                  Delete
                </button>
                <button type="button" className="btn btn-neutral" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {passwordModalOpen && (
          <div className="modal-overlay">
            <div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
              <h3 id="change-password-title" className="password-modal-title">Change Password</h3>
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                  <label htmlFor="current-password">Current Password</label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
                {passwordError && <p className="error-msg">{passwordError}</p>}
                {passwordSuccess && <p className="success-msg">{passwordSuccess}</p>}
                <div className="password-modal-actions">
                  <button type="submit" className="btn btn-primary" disabled={passwordUpdating}>
                    {passwordUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                  <button type="button" className="btn btn-neutral" onClick={closePasswordModal}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInactivityWarning && (
          <div className="modal-overlay" onClick={resetInactivityTimer}>
            <div className="inactivity-modal" role="alertdialog" aria-modal="true">
              <h3 className="inactivity-modal-title">Session Expiring</h3>
              <p className="inactivity-modal-body">
                You'll be logged out in <strong>{inactivityCountdown}</strong> second(s) due to inactivity.
              </p>
              <button type="button" className="btn btn-primary" onClick={resetInactivityTimer}>
                Stay Logged In
              </button>
            </div>
          </div>
        )}

        {userRole === 'admin' && (
          <section className="panel export-history-panel">
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
                    <p className="export-history-primary">{log.exporterName || 'Unknown User'}</p>
                    <p className="export-history-meta">
                      {log.month_year} | {log.record_count} record(s) | {new Date(log.exported_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  )

  const loginView = (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Document Tracker</h1>
        <p className="auth-subtitle">Sign in to continue.</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary full-width" disabled={loginLoading}>
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
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
