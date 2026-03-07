import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  Activity,
  BarChart2,
  CalendarClock,
  ChevronDown,
  CirclePlus,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Files,
  KeyRound,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Menu,
  PencilLine,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Table2,
  TriangleAlert,
  Trash2,
  X
} from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import DeleteModal from './components/DeleteModal'
import EditReasonModal from './components/EditReasonModal'
import PasswordModal from './components/PasswordModal'
import InactivityModal from './components/InactivityModal'
import KPIBar from './components/KPIBar'
import DocumentForm from './components/DocumentForm'
import DocumentCard from './components/DocumentCard'
import { supabase } from './lib/supabase'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [documentView, setDocumentView] = useState('card')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
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
  const [exportSearch, setExportSearch] = useState('')
  const [staffUsers, setStaffUsers] = useState([])
  const [staffExportAccess, setStaffExportAccess] = useState({})
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState(null)
  const [permissionActionId, setPermissionActionId] = useState(null)
  const [permissionsSearch, setPermissionsSearch] = useState('')
  const [exportLogs, setExportLogs] = useState([])
  const [exportLogsLoading, setExportLogsLoading] = useState(false)
  const [exportLogsError, setExportLogsError] = useState(null)
  const [recentAuditLogs, setRecentAuditLogs] = useState([])
  const [recentAuditUsers, setRecentAuditUsers] = useState({})
  const [recentAuditLoading, setRecentAuditLoading] = useState(false)
  const [recentAuditError, setRecentAuditError] = useState(null)
  const [auditFilter, setAuditFilter] = useState('all')
  const [auditSearch, setAuditSearch] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const passwordCloseTimerRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const inactivityWarningVisibleRef = useRef(false)
  const profileMenuRef = useRef(null)

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
    if (!user) return
    if (!(user.role === 'admin' || canExport)) {
      setExportLogs([])
      return
    }

    setExportLogsLoading(true)
    setExportLogsError(null)

    let logsQuery = supabase
      .from('export_logs')
      .select('id, exported_by, month_year, record_count, exported_at')
      .order('exported_at', { ascending: false })

    if (user.role !== 'admin') {
      logsQuery = logsQuery.eq('exported_by', user.id)
    }

    const { data: logsData, error: logsError } = await logsQuery

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
      .limit(40)

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
      setHistoryExpandedId(null)
      setPasswordModalOpen(false)
      setShowInactivityWarning(false)
      setInactivityCountdown(120)
      setMobileNavOpen(false)
      setProfileMenuOpen(false)
      setCreateDrawerOpen(false)
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
      setExportSearch('')
      setEditCounts({})
      setEditedCounts({})
      setStaffUsers([])
      setStaffExportAccess({})
      setPermissionsError(null)
      setPermissionActionId(null)
      setPermissionsSearch('')
      setExportLogs([])
      setExportLogsError(null)
      setRecentAuditLogs([])
      setRecentAuditUsers({})
      setRecentAuditLoading(false)
      setRecentAuditError(null)
      setAuditFilter('all')
      setAuditSearch('')
      setSearch('')
      setFilter('all')
      setFilterDateFrom('')
      setFilterDateTo('')
      setDocumentView('card')
      setActiveTab('third_party')
      return
    }

    if (!user.role) return

    fetchUserExportPermission(user)
    fetchRecentAuditLogs()

    if (user.role === 'admin') {
      fetchStaffExportPermissions()
    } else {
      setStaffUsers([])
      setStaffExportAccess({})
      setPermissionsError(null)
      setPermissionActionId(null)
    }

    if (user.role === 'admin' || canExport) {
      fetchExportHistory()
    } else {
      setExportLogs([])
      setExportLogsError(null)
    }
  }, [user?.id, user?.role, canExport])

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

  async function fetchProfileNamesByIds(ids) {
    const uniqueIds = [...new Set((ids || []).filter(Boolean))]
    if (uniqueIds.length === 0) return

    const unresolvedIds = uniqueIds.filter((id) => !activityLogUsers[id])
    if (unresolvedIds.length === 0) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', unresolvedIds)

    const userMap = (profileData || []).reduce((acc, profile) => {
      acc[profile.id] = profile.name
      return acc
    }, {})

    if (Object.keys(userMap).length > 0) {
      setActivityLogUsers((prev) => ({ ...prev, ...userMap }))
    }
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

    const actorIds = [...new Set(logs.map((log) => log.user_id).filter(Boolean))]
    fetchProfileNamesByIds(actorIds)
  }

  function toggleHistory(docId) {
    if (historyExpandedId === docId) {
      setHistoryExpandedId(null)
    } else {
      setHistoryExpandedId(docId)
      const doc = documents.find((item) => item.id === docId)
      fetchProfileNamesByIds([doc?.created_by])
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
      setCreateDrawerOpen(false)
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
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message)
      return
    }

    // Clear auth state locally before routing so the login screen paints immediately.
    setUser(null)
    setLoading(false)
    setCreateDrawerOpen(false)
    setMobileNavOpen(false)
    setProfileMenuOpen(false)
    navigate('/login', { replace: true })
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
      return `${actor} changed status from ${from} -> ${to}`
    }
    return `${actor} performed action: ${log.action}`
  }

  function getAuditTimelineEntry(log, currentUserId, userMap) {
    const actor = log.user_id === currentUserId ? 'You' : (userMap[log.user_id] || 'Unknown User')

    if (log.action === 'created') {
      return {
        action: 'Created',
        detail: 'Document record created.',
        actor,
        tone: 'created'
      }
    }

    if (log.action === 'edited') {
      return {
        action: 'Edited',
        detail: log.new_value ? `Reason: ${log.new_value}` : 'Document details were updated.',
        actor,
        tone: 'edited'
      }
    }

    if (log.action === 'status_changed') {
      const from = formatStatusForDisplay(log.old_value)
      const to = formatStatusForDisplay(log.new_value)
      return {
        action: 'Status Changed',
        detail: `From ${from} to ${to}`,
        actor,
        tone: 'status'
      }
    }

    return {
      action: formatStatusForDisplay(log.action?.replaceAll('_', ' ') || 'Activity'),
      detail: log.new_value || 'Activity recorded.',
      actor,
      tone: 'other'
    }
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

  function formatExportPeriod(value) {
    if (!value) return 'Unknown period'

    const [monthPart, yearPart] = String(value).split('/')
    const month = Number(monthPart)
    const year = Number(yearPart)
    if (!month || !year) return value

    const date = new Date(year, month - 1, 1)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric'
    })
  }

  function getDocumentTypeClassName(value) {
    return value === 'third_party' ? 'doc-type-third-party' : 'doc-type-claims'
  }

  function formatCurrency(value) {
    return `NGN ${formatAmount(value)}`
  }

  function matchesDocumentSearch(doc, term) {
    const normalizedTerm = term.trim().toLowerCase()
    if (!normalizedTerm) return true

    return [doc.beneficiary, doc.reference, doc.batch_number]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedTerm))
  }

  const activeTabDocuments = documents.filter((doc) => doc.document_type === activeTab)
  const detectedDocumentType = detectDocumentType(batchNumber)

  const filteredDocuments = activeTabDocuments.filter((doc) => {
    const matchesSearch = matchesDocumentSearch(doc, search)

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

  const userRole = user?.role === 'admin' ? 'admin' : 'staff'
  const hasExportAccess = userRole === 'admin' || canExport
  const displayName = user?.name || user?.email || 'Unknown User'
  const currentPath = location.pathname
  const documentReferenceMap = documents.reduce((acc, doc) => {
    acc[doc.id] = doc.reference || doc.batch_number || 'Unknown document'
    return acc
  }, {})
  const navLinks = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      to: '/documents',
      label: 'Documents',
      icon: Files,
      badge: documents.length
    },
    {
      to: '/export',
      label: 'Export',
      icon: Download
    },
    {
      to: '/audit-log',
      label: 'Audit Log',
      icon: ClipboardList
    },
    {
      to: '/permissions',
      label: 'Permissions',
      icon: Shield
    }
  ]
  const currentPageLabel = navLinks.find((link) => link.to === currentPath)?.label || 'Dashboard'
  const currentPageDescription = currentPath === '/documents'
    ? 'Manage every record with shared search, filters, and workflow actions.'
    : currentPath === '/export'
      ? 'Run monthly exports and review the delivery history in one place.'
      : currentPath === '/audit-log'
        ? 'Track meaningful activity with a cleaner audit timeline.'
        : currentPath === '/permissions'
          ? 'Manage export access for staff without crowding the rest of the workspace.'
          : 'Track the current month, urgent work, and recent activity at a glance.'
  const currentUserId = user?.id ?? null
  const currentYear = new Date().getFullYear()
  const auditTimelineEntries = recentAuditLogs.map((log) => ({
    log,
    timelineEntry: getAuditTimelineEntry(log, currentUserId, recentAuditUsers)
  }))
  const dashboardUrgentDocuments = useMemo(() => (
    documents
      .filter((doc) => matchesDocumentSearch(doc, search) && (isDocOverdue(doc) || isDueSoon(doc)))
      .sort((a, b) => {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
        return aTime - bTime
      })
      .slice(0, 5)
  ), [documents, search])
  const dashboardRecentDocuments = useMemo(() => (
    documents
      .filter((doc) => matchesDocumentSearch(doc, search))
      .slice(0, 5)
  ), [documents, search])
  const dashboardRecentActivity = useMemo(() => (
    auditTimelineEntries
      .filter(({ log, timelineEntry }) => {
        const normalizedSearch = search.trim().toLowerCase()
        if (!normalizedSearch) return true

        return [
          documentReferenceMap[log.document_id],
          timelineEntry.actor,
          timelineEntry.action,
          timelineEntry.detail
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      })
      .slice(0, 5)
  ), [auditTimelineEntries, documentReferenceMap, search])
  const filteredExportLogs = useMemo(() => {
    const normalizedSearch = exportSearch.trim().toLowerCase()
    if (!normalizedSearch) return exportLogs

    return exportLogs.filter((log) => (
      [log.exporterName, formatExportPeriod(log.month_year), `${log.record_count}`]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    ))
  }, [exportLogs, exportSearch])
  const filteredAuditEntries = useMemo(() => {
    const normalizedSearch = auditSearch.trim().toLowerCase()

    return auditTimelineEntries.filter(({ log, timelineEntry }) => {
      const matchesFilter =
        auditFilter === 'all' ||
        (auditFilter === 'created' && log.action === 'created') ||
        (auditFilter === 'edited' && log.action === 'edited') ||
        (auditFilter === 'status_changed' && log.action === 'status_changed')

      const matchesSearch = !normalizedSearch || [
        timelineEntry.action,
        timelineEntry.detail,
        timelineEntry.actor,
        documentReferenceMap[log.document_id]
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))

      return matchesFilter && matchesSearch
    })
  }, [auditTimelineEntries, auditFilter, auditSearch, documentReferenceMap])
  const filteredStaffUsers = useMemo(() => {
    const normalizedSearch = permissionsSearch.trim().toLowerCase()
    if (!normalizedSearch) return staffUsers

    return staffUsers.filter((staffUser) => (
      [staffUser.name, staffUser.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    ))
  }, [staffUsers, permissionsSearch])
  const permissionsSummary = {
    total: staffUsers.length,
    active: Object.values(staffExportAccess).filter(Boolean).length,
    inactive: Math.max(0, staffUsers.length - Object.values(staffExportAccess).filter(Boolean).length)
  }
  const monthlyVolumeData = useMemo(() => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const counts = Array(12).fill(0)
    const currentMonth = new Date().getMonth()

    for (const doc of documents) {
      if (!doc.created_at) continue
      const createdAt = new Date(doc.created_at)
      if (Number.isNaN(createdAt.getTime())) continue
      if (createdAt.getFullYear() !== currentYear) continue
      counts[createdAt.getMonth()] += 1
    }

    return monthLabels.map((label, index) => ({
      label,
      count: counts[index],
      isCurrentMonth: index === currentMonth
    }))
  }, [documents, currentYear])
  const historyPanelDocument = historyExpandedId
    ? documents.find((doc) => doc.id === historyExpandedId)
    : null
  const historyPanelLogs = historyPanelDocument ? (activityLogs[historyPanelDocument.id] || []) : []
  const historyPanelBadge = historyPanelDocument ? getBadgeForDocument(historyPanelDocument) : null
  const historyPanelCreator = historyPanelDocument
    ? (historyPanelDocument.created_by === user?.id
      ? 'You'
      : (activityLogUsers[historyPanelDocument.created_by] || 'Unknown User'))
    : 'Unknown User'
  const historyPanelHasReachedEditLimit = historyPanelDocument
    ? userRole === 'staff' && (editCounts[historyPanelDocument.id] || 0) >= 3
    : false
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

  useEffect(() => {
    setMobileNavOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!profileMenuOpen) return

    function handlePointerDown(event) {
      if (profileMenuRef.current?.contains(event.target)) return
      setProfileMenuOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('touchstart', handlePointerDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('touchstart', handlePointerDown)
    }
  }, [profileMenuOpen])

  useEffect(() => {
    const hasOverlayOpen = Boolean(historyExpandedId || createDrawerOpen || mobileNavOpen)
    if (!hasOverlayOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event) {
      if (event.key !== 'Escape') return
      if (historyExpandedId) {
        setHistoryExpandedId(null)
        return
      }
      if (createDrawerOpen) {
        setCreateDrawerOpen(false)
        return
      }
      if (mobileNavOpen) {
        setMobileNavOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [historyExpandedId, createDrawerOpen, mobileNavOpen])

  if (loading) {
    return (
      <div className="app-shell app-loading">
        <p className="loading-msg">Loading...</p>
      </div>
    )
  }

  const topbarSearchConfig = currentPath === '/export'
    ? {
        value: exportSearch,
        onChange: setExportSearch,
        placeholder: 'Search export history by user or period',
        ariaLabel: 'Search export history by user or period'
      }
    : currentPath === '/audit-log'
      ? {
          value: auditSearch,
          onChange: setAuditSearch,
          placeholder: 'Search activity or document reference',
          ariaLabel: 'Search audit activity by user, action, or document reference'
        }
      : currentPath === '/permissions'
        ? {
            value: permissionsSearch,
            onChange: setPermissionsSearch,
            placeholder: 'Search staff by name',
            ariaLabel: 'Search staff by name'
          }
        : {
            value: search,
            onChange: setSearch,
            placeholder: 'Search documents by beneficiary or PV number',
            ariaLabel: 'Search documents by beneficiary or PV number'
          }

  const documentsListContent = docLoading
    ? <p className="loading-msg">Loading documents...</p>
    : activeTabDocuments.length === 0
      ? <p className="empty-msg">No documents yet.</p>
      : filteredDocuments.length === 0
        ? <p className="empty-msg">No documents match your search or filter.</p>
        : (
          documentView === 'card' ? (
            <div className="document-grid">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  userRole={userRole}
                  currentUserId={currentUserId}
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
                  formatAmount={formatCurrency}
                  formatStatusForDisplay={formatStatusForDisplay}
                  formatDocumentType={formatDocumentType}
                  getDocumentTypeClassName={getDocumentTypeClassName}
                  formatActivityLog={formatActivityLog}
                  getDescriptionExcerpt={getDescriptionExcerpt}
                  isDocOverdue={isDocOverdue}
                />
              ))}
            </div>
          ) : (
            <div className="documents-table-wrap">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Beneficiary</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const badge = getBadgeForDocument(doc)
                    const hasReachedEditLimit = userRole === 'staff' && (editCounts[doc.id] || 0) >= 3
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div className="documents-table-beneficiary">
                            <span className="documents-table-beneficiary-name">{doc.beneficiary || 'N/A'}</span>
                            <span className="documents-table-beneficiary-meta">PV No: {doc.reference || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`document-type-pill ${getDocumentTypeClassName(doc.document_type)}`}>
                            {formatDocumentType(doc.document_type)}
                          </span>
                        </td>
                        <td className="documents-table-amount">{formatCurrency(doc.amount)}</td>
                        <td>
                          <span className={`status-pill ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td>
                          <div className="documents-table-date">
                            <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</span>
                            <span>{doc.batch_number || 'No batch'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-small card-action-btn"
                              onClick={() => {
                                setDocumentView('card')
                                handleEditClick(doc, userRole)
                              }}
                              disabled={hasReachedEditLimit}
                              aria-label="Edit document"
                              title={hasReachedEditLimit ? 'Edit limit reached. Contact your administrator.' : undefined}
                            >
                              <PencilLine size={14} strokeWidth={2.1} />
                            </button>
                            <button
                              type="button"
                              className={`btn btn-small card-action-btn ${historyExpandedId === doc.id ? 'btn-active' : ''}`}
                              onClick={() => toggleHistory(doc.id)}
                              aria-label={historyExpandedId === doc.id ? 'Close history' : 'View history'}
                              title={historyExpandedId === doc.id ? 'Close history' : 'View history'}
                            >
                              <Eye size={14} strokeWidth={2.1} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-small card-action-btn card-action-btn-delete"
                              onClick={() => setDeleteConfirmId(doc.id)}
                              aria-label="Delete document"
                              title="Delete document"
                            >
                              <Trash2 size={14} strokeWidth={2.1} />
                            </button>
                          </div>
                          {permissionMessages[doc.id] && (
                            <p className="table-inline-msg">{permissionMessages[doc.id]}</p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )

  const dashboardPage = (
    <div className="workspace-view dashboard-view">
      <KPIBar
        documents={documents}
        formatAmount={formatCurrency}
        isDocOverdue={isDocOverdue}
        isDueSoon={isDueSoon}
      />

      <div className="dashboard-overview-grid">
        <section className="panel monthly-volume-panel" aria-label="Monthly volume chart">
          <div className="monthly-volume-header">
            <h2 className="monthly-volume-title">
              <BarChart2 size={15} strokeWidth={2.2} />
              <span>Monthly Volume</span>
            </h2>
            <p className="monthly-volume-year">{currentYear}</p>
          </div>
          <div className="monthly-volume-chart">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={monthlyVolumeData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={22}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)'
                  }}
                  formatter={(value) => [`${value}`, 'Documents']}
                  labelFormatter={(label) => `${label} ${currentYear}`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {monthlyVolumeData.map((entry) => (
                    <Cell key={entry.label} fill={entry.isCurrentMonth ? '#4338ca' : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel overview-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Urgent Items</h2>
              <p>Overdue and due-soon work that needs attention now.</p>
            </div>
            <Link to="/documents" className="section-link">Open Documents</Link>
          </div>

          {dashboardUrgentDocuments.length === 0 ? (
            <p className="empty-msg">No urgent items for the current search.</p>
          ) : (
            <ul className="overview-list">
              {dashboardUrgentDocuments.map((doc) => {
                const badge = getBadgeForDocument(doc)
                return (
                  <li key={doc.id} className="overview-list-item">
                    <div className="overview-list-icon tone-alert" aria-hidden="true">
                      <TriangleAlert size={15} strokeWidth={2.1} />
                    </div>
                    <div className="overview-list-content">
                      <div className="overview-list-row">
                        <p className="overview-list-title">{doc.beneficiary || 'Unknown beneficiary'}</p>
                        <span className={`status-pill ${badge.className}`}>{badge.label}</span>
                      </div>
                      <p className="overview-list-meta">
                        {doc.reference || 'No reference'} | {getDueText(doc.due_date)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ghost-action-btn"
                      onClick={() => toggleHistory(doc.id)}
                    >
                      View
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="dashboard-preview-grid">
        <section className="panel overview-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Recent Documents</h2>
              <p>Fresh records across the workspace.</p>
            </div>
            <Link to="/documents" className="section-link">View all</Link>
          </div>

          {dashboardRecentDocuments.length === 0 ? (
            <p className="empty-msg">No recent documents for the current search.</p>
          ) : (
            <ul className="overview-list">
              {dashboardRecentDocuments.map((doc) => (
                <li key={doc.id} className="overview-list-item">
                  <div className="overview-list-icon tone-neutral" aria-hidden="true">
                    <FileSpreadsheet size={15} strokeWidth={2.1} />
                  </div>
                  <div className="overview-list-content">
                    <div className="overview-list-row">
                      <p className="overview-list-title">{doc.beneficiary || 'Unknown beneficiary'}</p>
                      <span className={`document-type-pill ${getDocumentTypeClassName(doc.document_type)}`}>
                        {formatDocumentType(doc.document_type)}
                      </span>
                    </div>
                    <p className="overview-list-meta">
                      {doc.reference || 'No reference'} | {formatCurrency(doc.amount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost-action-btn"
                    onClick={() => toggleHistory(doc.id)}
                  >
                    History
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel overview-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest changes worth reviewing.</p>
            </div>
            <Link to="/audit-log" className="section-link">View all</Link>
          </div>

          {recentAuditLoading && <p className="loading-msg">Loading activity...</p>}
          {!recentAuditLoading && dashboardRecentActivity.length === 0 && (
            <p className="empty-msg">No recent activity for the current search.</p>
          )}
          {!recentAuditLoading && dashboardRecentActivity.length > 0 && (
            <ul className="overview-list">
              {dashboardRecentActivity.map(({ log, timelineEntry }) => {
                const TimelineIcon = timelineEntry.tone === 'created'
                  ? CirclePlus
                  : timelineEntry.tone === 'edited'
                    ? PencilLine
                    : timelineEntry.tone === 'status'
                      ? RefreshCw
                      : ClipboardList

                return (
                  <li key={log.id} className="overview-list-item">
                    <div className={`overview-list-icon tone-${timelineEntry.tone}`} aria-hidden="true">
                      <TimelineIcon size={15} strokeWidth={2.1} />
                    </div>
                    <div className="overview-list-content">
                      <div className="overview-list-row">
                        <p className="overview-list-title">{timelineEntry.action}</p>
                        <span className="overview-list-time">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="overview-list-meta">
                        {timelineEntry.actor} | {documentReferenceMap[log.document_id] || 'Unknown document'}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )

  const documentsPage = (
    <div className="workspace-view documents-view">
      <header className="page-intro">
        <p className="page-kicker">Workspace records</p>
        <h1>Documents</h1>
        <p>{currentPageDescription}</p>
      </header>

      <section className="panel documents-panel documents-page-panel" data-print-title="Documents">
        <div className="documents-page-header">
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

          <div className="documents-heading-actions">
            <div className="documents-view-toggle" role="group" aria-label="Document view">
              <button
                type="button"
                className={`documents-view-btn ${documentView === 'card' ? 'documents-view-btn-active' : ''}`}
                onClick={() => setDocumentView('card')}
                aria-label="Card view"
                title="Card view"
              >
                <LayoutGrid size={14} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className={`documents-view-btn ${documentView === 'list' ? 'documents-view-btn-active' : ''}`}
                onClick={() => setDocumentView('list')}
                aria-label="List view"
                title="List view"
              >
                <Table2 size={14} strokeWidth={2.2} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn-neutral"
              onClick={() => window.print()}
            >
              Print list
            </button>
          </div>
        </div>

        <div className="documents-summary">
          <span className="summary-pill">{filteredDocuments.length} shown</span>
          <span className="summary-pill">{activeTabDocuments.length} total</span>
          <span className="summary-pill summary-pill-alert">{activeTabDocuments.filter(isDocOverdue).length} overdue</span>
          <span className="summary-pill">{activeTabDocuments.filter(isDueSoon).length} due soon</span>
        </div>

        <div className="controls-row workspace-filters-row">
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
              <option value="in_progress">In progress</option>
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
        {documentsListContent}
      </section>
    </div>
  )

  const exportPage = (
    <div className="workspace-view export-view">
      <header className="page-intro">
        <p className="page-kicker">Monthly delivery</p>
        <h1>Export</h1>
        <p>{currentPageDescription}</p>
      </header>

      {!hasExportAccess ? (
        <section className="panel access-state">
          <div className="access-state-icon" aria-hidden="true">
            <Shield size={18} strokeWidth={2.1} />
          </div>
          <div>
            <h2>Export access required</h2>
            <p>Only admins or staff with export permission can generate monthly reports.</p>
          </div>
        </section>
      ) : (
        <div className="export-grid">
          <section className="panel export-control-panel">
            <div className="panel-heading">
              <h2>Monthly export</h2>
              <p>Generate the current document type as an Excel workbook for a selected month.</p>
            </div>

            <div className="tab-switcher" role="tablist" aria-label="Export document type">
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

            <div className="export-picker export-picker-always">
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
                  {exportLoading ? 'Exporting...' : 'Export monthly report'}
                </button>
              </div>
              {exportError && <p className="error-msg">{exportError}</p>}
            </div>
          </section>

          <section className="panel export-history-panel">
            <div className="panel-heading panel-heading-row">
              <div>
                <h2>Export history</h2>
                <p>Recent generated files, periods, and record counts.</p>
              </div>
              <span className="summary-pill">{filteredExportLogs.length} entries</span>
            </div>

            {exportLogsError && <p className="error-msg">{exportLogsError}</p>}
            {exportLogsLoading && <p className="loading-msg">Loading export history...</p>}
            {!exportLogsLoading && filteredExportLogs.length === 0 && (
              <p className="empty-msg">No export history yet.</p>
            )}
            {!exportLogsLoading && filteredExportLogs.length > 0 && (
              <ul className="export-history-list">
                {filteredExportLogs.map((log) => (
                  <li key={log.id} className="export-history-item">
                    <div className="export-history-item-top">
                      <span className="export-history-icon" aria-hidden="true">
                        <Download size={16} strokeWidth={2.1} />
                      </span>
                      <div className="export-history-content">
                        <p className="export-history-primary">{log.exporterName || 'Unknown User'}</p>
                        <p className="export-history-time">{new Date(log.exported_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="export-history-chips">
                      <span className="export-history-chip">{formatExportPeriod(log.month_year)}</span>
                      <span className="export-history-chip export-history-chip-strong">
                        {log.record_count} record(s)
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )

  const auditLogPage = (
    <div className="workspace-view audit-view">
      <header className="page-intro">
        <p className="page-kicker">Workspace activity</p>
        <h1>Audit Log</h1>
        <p>{currentPageDescription}</p>
      </header>

      <section className="panel audit-log-panel audit-log-page-panel">
        <div className="audit-toolbar">
          <div className="audit-filter-pills" role="group" aria-label="Audit filter">
            <button
              type="button"
              className={`audit-filter-btn ${auditFilter === 'all' ? 'audit-filter-btn-active' : ''}`}
              onClick={() => setAuditFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`audit-filter-btn ${auditFilter === 'created' ? 'audit-filter-btn-active' : ''}`}
              onClick={() => setAuditFilter('created')}
            >
              Created
            </button>
            <button
              type="button"
              className={`audit-filter-btn ${auditFilter === 'edited' ? 'audit-filter-btn-active' : ''}`}
              onClick={() => setAuditFilter('edited')}
            >
              Edited
            </button>
            <button
              type="button"
              className={`audit-filter-btn ${auditFilter === 'status_changed' ? 'audit-filter-btn-active' : ''}`}
              onClick={() => setAuditFilter('status_changed')}
            >
              Status changes
            </button>
          </div>
          <span className="summary-pill">{filteredAuditEntries.length} events</span>
        </div>

        {recentAuditError && <p className="error-msg">{recentAuditError}</p>}
        {recentAuditLoading && <p className="loading-msg">Loading audit log...</p>}
        {!recentAuditLoading && filteredAuditEntries.length === 0 && (
          <p className="empty-msg">No audit events match the current filters.</p>
        )}
        {!recentAuditLoading && filteredAuditEntries.length > 0 && (
          <ul className="audit-log-list audit-log-list-detailed">
            {filteredAuditEntries.map(({ log, timelineEntry }) => {
              const AuditIcon = timelineEntry.tone === 'created'
                ? CirclePlus
                : timelineEntry.tone === 'edited'
                  ? PencilLine
                  : timelineEntry.tone === 'status'
                    ? RefreshCw
                    : Activity

              return (
                <li key={log.id} className="audit-log-item">
                  <span className={`audit-log-icon audit-log-icon-${timelineEntry.tone}`} aria-hidden="true">
                    <AuditIcon size={14} strokeWidth={2.15} />
                  </span>
                  <div className="audit-log-content">
                    <div className="audit-log-row">
                      <p className="audit-log-primary">{timelineEntry.action}</p>
                      <p className="audit-log-timestamp">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <p className="audit-log-detail">{timelineEntry.detail}</p>
                    <p className="audit-log-meta">
                      {timelineEntry.actor} | {documentReferenceMap[log.document_id] || 'Unknown document'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )

  const permissionsPage = (
    <div className="workspace-view permissions-view">
      <header className="page-intro">
        <p className="page-kicker">Admin controls</p>
        <h1>Permissions</h1>
        <p>{currentPageDescription}</p>
      </header>

      {userRole !== 'admin' ? (
        <section className="panel access-state">
          <div className="access-state-icon" aria-hidden="true">
            <Shield size={18} strokeWidth={2.1} />
          </div>
          <div>
            <h2>Admin access required</h2>
            <p>This screen is limited to administrators managing workspace export permissions.</p>
          </div>
        </section>
      ) : (
        <>
          <div className="permissions-summary-grid">
            <article className="panel stat-panel">
              <p className="stat-panel-label">Staff users</p>
              <p className="stat-panel-value">{permissionsSummary.total}</p>
            </article>
            <article className="panel stat-panel">
              <p className="stat-panel-label">With export access</p>
              <p className="stat-panel-value">{permissionsSummary.active}</p>
            </article>
            <article className="panel stat-panel">
              <p className="stat-panel-label">Without access</p>
              <p className="stat-panel-value">{permissionsSummary.inactive}</p>
            </article>
          </div>

          <section className="panel permissions-management-panel">
            <div className="panel-heading panel-heading-row">
              <div>
                <h2>Staff access</h2>
                <p>Grant or revoke export access without crowding the rest of the workspace.</p>
              </div>
              <span className="summary-pill">{filteredStaffUsers.length} users</span>
            </div>

            {permissionsError && <p className="error-msg">{permissionsError}</p>}
            {permissionsLoading && <p className="loading-msg">Loading permissions...</p>}
            {!permissionsLoading && filteredStaffUsers.length === 0 && (
              <p className="empty-msg">No staff users match the current search.</p>
            )}
            {!permissionsLoading && filteredStaffUsers.length > 0 && (
              <div className="permission-card-list">
                {filteredStaffUsers.map((staffUser) => {
                  const hasAccess = Boolean(staffExportAccess[staffUser.id])
                  return (
                    <article key={staffUser.id} className="permission-card">
                      <div className="permission-card-copy">
                        <p className="permission-card-name">{staffUser.name || staffUser.id}</p>
                        <p className="permission-card-meta">{staffUser.id}</p>
                      </div>
                      <div className="permission-card-actions">
                        <span className={`summary-pill ${hasAccess ? 'summary-pill-active' : ''}`}>
                          {hasAccess ? 'Export enabled' : 'No export access'}
                        </span>
                        <button
                          type="button"
                          className={`btn btn-small ${hasAccess ? 'btn-danger' : 'btn-primary'}`}
                          disabled={permissionActionId === staffUser.id}
                          onClick={() => handleToggleExportPermission(staffUser.id)}
                        >
                          {permissionActionId === staffUser.id
                            ? 'Saving...'
                            : hasAccess
                              ? 'Revoke access'
                              : 'Grant access'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )

  const authenticatedLayout = (
    <div className="workspace-shell">
      {mobileNavOpen && (
        <div
          className="workspace-drawer-overlay"
          aria-hidden="true"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className="workspace-sidebar" aria-label="Workspace navigation">
        <div className="workspace-sidebar-main">
          <div className="workspace-brand">
            <span className="workspace-brand-logo" aria-hidden="true">
              <FileSpreadsheet size={17} strokeWidth={2.1} />
            </span>
            <div>
              <p className="workspace-brand-title">Document Tracker</p>
              <p className="workspace-brand-subtitle">Workspace</p>
            </div>
          </div>

          <nav className="workspace-nav" aria-label="Primary">
            {navLinks.map((link) => {
              const LinkIcon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `workspace-nav-link ${isActive ? 'workspace-nav-link-active' : ''}`}
                >
                  <span className="workspace-nav-icon" aria-hidden="true">
                    <LinkIcon size={16} strokeWidth={2.1} />
                  </span>
                  <span>{link.label}</span>
                  {typeof link.badge === 'number' && (
                    <span className="workspace-nav-badge">{link.badge}</span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="workspace-profile" ref={profileMenuRef}>
          <button
            type="button"
            className="workspace-profile-trigger"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
          >
            <div className="workspace-profile-copy">
              <div className="workspace-profile-title-row">
                <p className="workspace-profile-name">{displayName}</p>
                <span className={`role-badge role-badge-${userRole}`}>
                  {userRole === 'admin' ? 'Admin' : 'Staff'}
                </span>
              </div>
              <p className="workspace-profile-email">{user?.email}</p>
            </div>
            <ChevronDown size={16} strokeWidth={2.1} className={profileMenuOpen ? 'workspace-profile-chevron-open' : ''} />
          </button>

          {profileMenuOpen && (
            <div className="workspace-profile-menu" role="menu">
              <button
                type="button"
                className="workspace-profile-menu-item"
                onClick={() => {
                  setProfileMenuOpen(false)
                  openPasswordModal()
                }}
              >
                <KeyRound size={15} strokeWidth={2.1} />
                <span>Change password</span>
              </button>
              <button
                type="button"
                className="workspace-profile-menu-item workspace-profile-menu-item-danger"
                onClick={() => {
                  setProfileMenuOpen(false)
                  handleLogout()
                }}
              >
                <LogOut size={15} strokeWidth={2.1} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {mobileNavOpen && (
        <aside className="workspace-mobile-drawer" aria-label="Mobile navigation">
          <div className="workspace-mobile-drawer-header">
            <div className="workspace-brand">
              <span className="workspace-brand-logo" aria-hidden="true">
                <FileSpreadsheet size={17} strokeWidth={2.1} />
              </span>
              <div>
                <p className="workspace-brand-title">Document Tracker</p>
                <p className="workspace-brand-subtitle">Workspace</p>
              </div>
            </div>
            <button
              type="button"
              className="workspace-drawer-close"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>

          <nav className="workspace-nav" aria-label="Mobile primary navigation">
            {navLinks.map((link) => {
              const LinkIcon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `workspace-nav-link ${isActive ? 'workspace-nav-link-active' : ''}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <span className="workspace-nav-icon" aria-hidden="true">
                    <LinkIcon size={16} strokeWidth={2.1} />
                  </span>
                  <span>{link.label}</span>
                  {typeof link.badge === 'number' && (
                    <span className="workspace-nav-badge">{link.badge}</span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <div className="workspace-profile workspace-profile-mobile" ref={profileMenuRef}>
            <button
              type="button"
              className="workspace-profile-trigger"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
              <div className="workspace-profile-copy">
                <div className="workspace-profile-title-row">
                  <p className="workspace-profile-name">{displayName}</p>
                  <span className={`role-badge role-badge-${userRole}`}>
                    {userRole === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                </div>
                <p className="workspace-profile-email">{user?.email}</p>
              </div>
              <ChevronDown size={16} strokeWidth={2.1} className={profileMenuOpen ? 'workspace-profile-chevron-open' : ''} />
            </button>

            {profileMenuOpen && (
              <div className="workspace-profile-menu" role="menu">
                <button
                  type="button"
                  className="workspace-profile-menu-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setMobileNavOpen(false)
                    openPasswordModal()
                  }}
                >
                  <KeyRound size={15} strokeWidth={2.1} />
                  <span>Change password</span>
                </button>
                <button
                  type="button"
                  className="workspace-profile-menu-item workspace-profile-menu-item-danger"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setMobileNavOpen(false)
                    handleLogout()
                  }}
                >
                  <LogOut size={15} strokeWidth={2.1} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-leading">
            <button
              type="button"
              className="workspace-menu-btn"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} strokeWidth={2.1} />
            </button>

            <div className="workspace-breadcrumb" aria-label="Breadcrumb">
              <span>Workspace</span>
              <span className="workspace-breadcrumb-separator">/</span>
              <span className="workspace-breadcrumb-current">{currentPageLabel}</span>
            </div>
          </div>

          <label className="workspace-search" htmlFor="workspace-search">
            <Search size={15} strokeWidth={2.1} aria-hidden="true" />
            <input
              id="workspace-search"
              type="text"
              placeholder={topbarSearchConfig.placeholder}
              value={topbarSearchConfig.value}
              onChange={(e) => topbarSearchConfig.onChange(e.target.value)}
              aria-label={topbarSearchConfig.ariaLabel}
            />
          </label>

          <div className="workspace-topbar-actions">
            <button
              type="button"
              className="workspace-primary-btn"
              onClick={() => setCreateDrawerOpen(true)}
            >
              New Document
            </button>
          </div>
        </header>

        <main className="workspace-page">
          <Outlet />
        </main>
      </div>

      {createDrawerOpen && (
        <>
          <div
            className="create-drawer-overlay"
            aria-hidden="true"
            onClick={() => setCreateDrawerOpen(false)}
          />
          <aside
            className="create-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-drawer-title"
          >
            <div className="create-drawer-scroll">
              <div className="create-drawer-header">
                <div>
                  <p className="page-kicker">New record</p>
                  <h2 id="create-drawer-title">Create document</h2>
                  <p className="create-drawer-description">
                    Add a new document record without leaving the current page.
                  </p>
                </div>
                <button
                  type="button"
                  className="create-drawer-close"
                  aria-label="Close create document drawer"
                  onClick={() => setCreateDrawerOpen(false)}
                >
                  <X size={16} strokeWidth={2.3} />
                </button>
              </div>

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
                framed={false}
                title="Create document"
                descriptionText="Set the record details and initial workflow status."
                submitLabel="Add document"
              />
            </div>
          </aside>
        </>
      )}

      {historyPanelDocument && (
        <>
          <div
            className="history-drawer-overlay"
            aria-hidden="true"
            onClick={() => setHistoryExpandedId(null)}
          />
          <aside
            className="history-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-drawer-title"
          >
            <div className="history-drawer-scroll">
              <div className="history-drawer-header">
                <div>
                  <h2 id="history-drawer-title" className="history-drawer-title">
                    {historyPanelDocument.beneficiary || 'Document'}
                  </h2>
                  <div className="history-drawer-badges">
                    {historyPanelBadge && (
                      <span className={`status-pill ${historyPanelBadge.className}`}>{historyPanelBadge.label}</span>
                    )}
                    <span className={`document-type-pill ${getDocumentTypeClassName(historyPanelDocument.document_type)}`}>
                      {formatDocumentType(historyPanelDocument.document_type)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="history-drawer-close"
                  aria-label="Close history panel"
                  onClick={() => setHistoryExpandedId(null)}
                >
                  <X size={16} strokeWidth={2.3} />
                </button>
              </div>

              <div className="history-info-grid">
                <article className="history-info-card">
                  <p>PV number</p>
                  <strong>{historyPanelDocument.reference || 'N/A'}</strong>
                </article>
                <article className="history-info-card">
                  <p>Batch number</p>
                  <strong>{historyPanelDocument.batch_number || 'N/A'}</strong>
                </article>
                <article className="history-info-card">
                  <p>Amount</p>
                  <strong>{formatCurrency(historyPanelDocument.amount)}</strong>
                </article>
                <article className="history-info-card">
                  <p>Sent date</p>
                  <strong>{historyPanelDocument.date_out ? formatDueDate(historyPanelDocument.date_out) : 'Not sent'}</strong>
                </article>
                <article className="history-info-card">
                  <p>Created by</p>
                  <strong>{historyPanelCreator}</strong>
                </article>
                <article className="history-info-card">
                  <p>Due date</p>
                  <strong>{formatDueDate(historyPanelDocument.due_date)}</strong>
                </article>
              </div>

              <section className="history-description">
                <h3>Description</h3>
                <p>{historyPanelDocument.description || 'No description provided.'}</p>
              </section>

              <section className="history-timeline">
                <h3>Audit Trail</h3>
                {historyPanelLogs.length === 0 && <p className="empty-msg">No activity yet.</p>}
                {historyPanelLogs.length > 0 && (
                  <ul className="history-timeline-list">
                    {historyPanelLogs.map((log) => {
                      const timelineEntry = getAuditTimelineEntry(log, currentUserId, activityLogUsers)
                      const TimelineIcon = timelineEntry.tone === 'created'
                        ? CirclePlus
                        : timelineEntry.tone === 'edited'
                          ? PencilLine
                          : timelineEntry.tone === 'status'
                            ? RefreshCw
                            : ClipboardList

                      return (
                        <li key={log.id} className="history-timeline-item">
                          <span className={`history-timeline-icon history-timeline-icon-${timelineEntry.tone}`}>
                            <TimelineIcon size={13} strokeWidth={2.2} />
                          </span>
                          <div className="history-timeline-content">
                            <p className="history-timeline-action">{timelineEntry.action}</p>
                            <p className="history-timeline-detail">{timelineEntry.detail}</p>
                            <p className="history-timeline-meta">
                              {timelineEntry.actor} | {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </div>

            <div className="history-drawer-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setHistoryExpandedId(null)
                  setDocumentView('card')
                  navigate('/documents')
                  handleEditClick(historyPanelDocument, userRole)
                }}
                disabled={historyPanelHasReachedEditLimit}
                title={historyPanelHasReachedEditLimit ? 'Edit limit reached. Contact your administrator.' : undefined}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setHistoryExpandedId(null)
                  setDeleteConfirmId(historyPanelDocument.id)
                }}
                disabled={userRole === 'staff'}
                title={userRole === 'staff' ? 'Only admins can delete documents.' : undefined}
              >
                Delete
              </button>
            </div>
          </aside>
        </>
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
      <Route path="/" element={user ? authenticatedLayout : <Navigate to="/login" replace />}>
        <Route index element={dashboardPage} />
        <Route path="documents" element={documentsPage} />
        <Route path="export" element={exportPage} />
        <Route path="audit-log" element={auditLogPage} />
        <Route path="permissions" element={permissionsPage} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
