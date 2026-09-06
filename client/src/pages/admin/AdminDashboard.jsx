import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Award,
  CreditCard,
  Activity,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  UserX,
  TrendingUp,
  Dumbbell,
  Eye,
  EyeOff,
  Lock,
  Key,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  Target,
  Receipt,
  DollarSign,
  Wallet,
  Zap,
  Check,
  Scale,
  RefreshCw,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  dashboardApi,
  membersApi,
  trainersApi,
  membershipPlansApi,
  exercisesApi,
  trainingPlansApi,
  trainerExerciseAssignmentsApi,
  usersApi,
  attendanceApi,
  paymentsApi,
  progressApi,
} from '../../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members' | 'trainers' | 'exercises' | 'plans' | 'memberships' | 'attendance' | 'payments' | 'progress'

  // Data States
  const [statsData, setStatsData] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);

  // Attendance States
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalRecords: 0,
    todayCheckIns: 0,
    currentlyActive: 0,
    todayCompleted: 0,
    thisMonthRecords: 0,
  });
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [attendanceTrainerFilter, setAttendanceTrainerFilter] = useState('');
  const [attendanceMemberFilter, setAttendanceMemberFilter] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Payments & Billing States
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    thisMonthRevenue: 0,
    totalTransactions: 0,
    paidTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    refundedTransactions: 0,
    methodBreakdown: [],
  });
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStartDateFilter, setPaymentStartDateFilter] = useState('');
  const [paymentEndDateFilter, setPaymentEndDateFilter] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Manual Payment Form & Modal States
  const [manualPaymentModalOpen, setManualPaymentModalOpen] = useState(false);
  const [manualPaymentForm, setManualPaymentForm] = useState({
    memberId: '',
    planId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: '',
    notes: '',
    purpose: 'membership',
  });
  const [manualPaymentModalError, setManualPaymentModalError] = useState('');
  const [manualPaymentSubmitting, setManualPaymentSubmitting] = useState(false);

  // Admin Receipt Modal States
  const [adminReceiptModalOpen, setAdminReceiptModalOpen] = useState(false);
  const [selectedAdminReceipt, setSelectedAdminReceipt] = useState(null);

  // Edit Payment Notes Modal States
  const [editPaymentNotesModalOpen, setEditPaymentNotesModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentNotesForm, setPaymentNotesForm] = useState('');
  const [editPaymentNotesError, setEditPaymentNotesError] = useState('');
  const [paymentNotesSubmitting, setPaymentNotesSubmitting] = useState(false);

  // Attendance Form & Modal States
  const [createAttendanceModalOpen, setCreateAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    memberId: '',
    date: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'active',
    notes: '',
  });
  const [attendanceModalError, setAttendanceModalError] = useState('');

  const [editAttendanceModalOpen, setEditAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editAttendanceForm, setEditAttendanceForm] = useState({
    date: '',
    checkInTime: '',
    checkOutTime: '',
    status: 'active',
    notes: '',
  });
  const [editAttendanceModalError, setEditAttendanceModalError] = useState('');

  const [deleteAttendanceModalOpen, setDeleteAttendanceModalOpen] = useState(false);
  const [deleteAttendanceTarget, setDeleteAttendanceTarget] = useState(null);
  const [deleteAttendanceError, setDeleteAttendanceError] = useState('');
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);

  // Phase 9: Fitness Progress States
  const [progressLogs, setProgressLogs] = useState([]);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressPage, setProgressPage] = useState(1);
  const [progressPages, setProgressPages] = useState(1);
  const [progressSearch, setProgressSearch] = useState('');
  const [progressMemberFilter, setProgressMemberFilter] = useState('');
  const [progressStartDate, setProgressStartDate] = useState('');
  const [progressEndDate, setProgressEndDate] = useState('');
  const [progressLoading, setProgressLoading] = useState(false);
  const [adminProgressModalOpen, setAdminProgressModalOpen] = useState(false);
  const [adminEditingProgress, setAdminEditingProgress] = useState(null);
  const [adminProgressForm, setAdminProgressForm] = useState({
    memberId: '',
    weight: '',
    bodyFatPercentage: '',
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    notes: '',
    recordedAt: '',
  });
  const [adminProgressError, setAdminProgressError] = useState('');
  const [adminProgressSubmitting, setAdminProgressSubmitting] = useState(false);
  const [deleteProgressModalOpen, setDeleteProgressModalOpen] = useState(false);
  const [deleteProgressTarget, setDeleteProgressTarget] = useState(null);
  const [deleteProgressError, setDeleteProgressError] = useState('');

  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter States
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');
  const [trainerSearch, setTrainerSearch] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState('');
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('');

  // Detail Modal States
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
  const [memberDetailPlan, setMemberDetailPlan] = useState(null);
  const [memberDetailModalOpen, setMemberDetailModalOpen] = useState(false);
  const [loadingMemberPlan, setLoadingMemberPlan] = useState(false);

  const [selectedTrainerDetail, setSelectedTrainerDetail] = useState(null);
  const [trainerDetailModalOpen, setTrainerDetailModalOpen] = useState(false);

  // Form Modals
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'unspecified',
    dateOfBirth: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    membershipPlan: '',
    assignedTrainer: '',
    status: 'active',
    notes: '',
  });

  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    experience: '',
    certifications: '',
    bio: '',
    status: 'active',
  });

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    duration: 1,
    price: 29,
    features: '',
    status: 'active',
  });

  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    category: 'Strength',
    muscleGroup: 'Chest',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    defaultSets: 3,
    defaultReps: 10,
    defaultDuration: 0,
    defaultRestTime: 60,
    description: '',
    instructions: '',
    status: 'active',
  });

  // Assign Exercise to Trainer States
  const [assignExerciseModalOpen, setAssignExerciseModalOpen] = useState(false);
  const [selectedExerciseForAssign, setSelectedExerciseForAssign] = useState(null);
  const [assignTrainerId, setAssignTrainerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Modal Error States
  const [memberModalError, setMemberModalError] = useState('');
  const [trainerModalError, setTrainerModalError] = useState('');
  const [planModalError, setPlanModalError] = useState('');
  const [exerciseModalError, setExerciseModalError] = useState('');
  const [deleteModalError, setDeleteModalError] = useState('');

  // Account Status Confirmation Modal States
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null); // { id, name, email, role, currentStatus, targetStatus }
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }

  const [submitting, setSubmitting] = useState(false);

  // Password Visibility States
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [showTrainerPassword, setShowTrainerPassword] = useState(false);

  // Reset Password Modal States
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null); // { id, name, email, role }
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, membersRes, trainersRes, plansRes, exercisesRes, trainingPlansRes] =
        await Promise.all([
          dashboardApi.getAdminStats(),
          membersApi.getAll(),
          trainersApi.getAll(),
          membershipPlansApi.getAll(),
          exercisesApi.getAll(),
          trainingPlansApi.getAll(),
        ]);

      setStatsData(statsRes);
      setMembers(membersRes);
      setTrainers(trainersRes);
      setPlans(plansRes);
      setExercises(exercisesRes);
      setTrainingPlans(trainingPlansRes);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Attendance Records and Stats
  const loadAdminAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      const params = {};
      if (attendanceSearch) params.search = attendanceSearch;
      if (attendanceStatusFilter) params.status = attendanceStatusFilter;
      if (attendanceDateFilter) params.date = attendanceDateFilter;
      if (attendanceTrainerFilter) params.trainerId = attendanceTrainerFilter;
      if (attendanceMemberFilter) params.memberId = attendanceMemberFilter;

      const [recordsRes, statsRes] = await Promise.all([
        attendanceApi.getAll(params),
        attendanceApi.getStats(),
      ]);

      setAttendanceRecords(recordsRes?.records || []);
      if (statsRes) setAttendanceStats(statsRes);
    } catch (err) {
      console.warn('[Admin Attendance] Error:', err.message);
    } finally {
      setAttendanceLoading(false);
    }
  }, [
    attendanceSearch,
    attendanceStatusFilter,
    attendanceDateFilter,
    attendanceTrainerFilter,
    attendanceMemberFilter,
  ]);

  // Load Payments Records and Stats
  const loadAdminPayments = useCallback(async () => {
    try {
      setPaymentLoading(true);
      const params = {};
      if (paymentSearch) params.search = paymentSearch;
      if (paymentStatusFilter) params.status = paymentStatusFilter;
      if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
      if (paymentStartDateFilter) params.startDate = paymentStartDateFilter;
      if (paymentEndDateFilter) params.endDate = paymentEndDateFilter;

      const [paymentsRes, statsRes] = await Promise.all([
        paymentsApi.getAll(params),
        paymentsApi.getStats(),
      ]);

      setPaymentsList(paymentsRes?.payments || []);
      if (statsRes) setPaymentStats(statsRes);
    } catch (err) {
      console.warn('[Admin Payments] Error:', err.message);
    } finally {
      setPaymentLoading(false);
    }
  }, [
    paymentSearch,
    paymentStatusFilter,
    paymentMethodFilter,
    paymentStartDateFilter,
    paymentEndDateFilter,
  ]);

  // Load Admin Gym-Wide Progress Logs
  const loadAdminProgress = useCallback(async () => {
    try {
      setProgressLoading(true);
      const params = {
        page: progressPage,
        limit: 20,
      };
      if (progressSearch) params.search = progressSearch;
      if (progressMemberFilter) params.memberId = progressMemberFilter;
      if (progressStartDate) params.startDate = progressStartDate;
      if (progressEndDate) params.endDate = progressEndDate;

      const res = await progressApi.getAll(params);
      if (res) {
        setProgressLogs(res.records || []);
        setProgressTotal(res.total || 0);
        setProgressPages(res.pages || 1);
      }
    } catch (err) {
      console.warn('[Admin Progress] Error:', err.message);
    } finally {
      setProgressLoading(false);
    }
  }, [
    progressPage,
    progressSearch,
    progressMemberFilter,
    progressStartDate,
    progressEndDate,
  ]);

  useEffect(() => {
    loadDashboardData();
    loadAdminAttendance();
    loadAdminPayments();
    loadAdminProgress();
  }, [loadDashboardData, loadAdminAttendance, loadAdminPayments, loadAdminProgress]);

  const flashMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // --- Admin Progress Handlers ---
  const handleOpenAdminAddProgress = () => {
    setAdminEditingProgress(null);
    setAdminProgressError('');
    setAdminProgressForm({
      memberId: members[0]?._id || '',
      weight: '',
      bodyFatPercentage: '',
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: '',
      notes: '',
      recordedAt: new Date().toISOString().split('T')[0],
    });
    setAdminProgressModalOpen(true);
  };

  const handleOpenAdminEditProgress = (rec) => {
    setAdminEditingProgress(rec);
    setAdminProgressError('');
    setAdminProgressForm({
      memberId: rec.member?._id || rec.member,
      weight: rec.weight !== null && rec.weight !== undefined ? rec.weight : '',
      bodyFatPercentage: rec.bodyFatPercentage !== null && rec.bodyFatPercentage !== undefined ? rec.bodyFatPercentage : '',
      chest: rec.chest !== null && rec.chest !== undefined ? rec.chest : '',
      waist: rec.waist !== null && rec.waist !== undefined ? rec.waist : '',
      hips: rec.hips !== null && rec.hips !== undefined ? rec.hips : '',
      arms: rec.arms !== null && rec.arms !== undefined ? rec.arms : '',
      thighs: rec.thighs !== null && rec.thighs !== undefined ? rec.thighs : '',
      notes: rec.notes || '',
      recordedAt: rec.recordedAt ? rec.recordedAt.split('T')[0] : '',
    });
    setAdminProgressModalOpen(true);
  };

  const handleAdminSaveProgress = async (e) => {
    e.preventDefault();
    if (!adminProgressForm.memberId) {
      setAdminProgressError('Please select a member.');
      return;
    }

    try {
      setAdminProgressSubmitting(true);
      setAdminProgressError('');

      const payload = {
        memberId: adminProgressForm.memberId,
        weight: adminProgressForm.weight !== '' ? Number(adminProgressForm.weight) : undefined,
        bodyFatPercentage: adminProgressForm.bodyFatPercentage !== '' ? Number(adminProgressForm.bodyFatPercentage) : undefined,
        chest: adminProgressForm.chest !== '' ? Number(adminProgressForm.chest) : undefined,
        waist: adminProgressForm.waist !== '' ? Number(adminProgressForm.waist) : undefined,
        hips: adminProgressForm.hips !== '' ? Number(adminProgressForm.hips) : undefined,
        arms: adminProgressForm.arms !== '' ? Number(adminProgressForm.arms) : undefined,
        thighs: adminProgressForm.thighs !== '' ? Number(adminProgressForm.thighs) : undefined,
        notes: adminProgressForm.notes,
        recordedAt: adminProgressForm.recordedAt || undefined,
      };

      if (adminEditingProgress) {
        await progressApi.update(adminEditingProgress._id, payload);
        flashMessage('Fitness progress record updated successfully.');
      } else {
        await progressApi.create(payload);
        flashMessage('New fitness progress entry logged.');
      }

      setAdminProgressModalOpen(false);
      loadAdminProgress();
    } catch (err) {
      setAdminProgressError(err.message || 'Failed to save progress record.');
    } finally {
      setAdminProgressSubmitting(false);
    }
  };

  const handleOpenDeleteProgress = (rec) => {
    setDeleteProgressTarget(rec);
    setDeleteProgressError('');
    setDeleteProgressModalOpen(true);
  };

  const handleConfirmDeleteProgress = async () => {
    if (!deleteProgressTarget) return;
    try {
      setAdminProgressSubmitting(true);
      await progressApi.delete(deleteProgressTarget._id);
      flashMessage('Progress entry deleted.');
      setDeleteProgressModalOpen(false);
      setDeleteProgressTarget(null);
      loadAdminProgress();
    } catch (err) {
      setDeleteProgressError(err.message || 'Failed to delete record.');
    } finally {
      setAdminProgressSubmitting(false);
    }
  };

  // --- Payment Action Handlers ---
  const handleOpenManualPayment = () => {
    const defaultMember = members[0]?._id || '';
    const defaultPlan = plans[0] || null;
    const todayStr = new Date().toISOString().slice(0, 10);

    setManualPaymentForm({
      memberId: defaultMember,
      planId: defaultPlan?._id || '',
      amount: defaultPlan?.price ? String(defaultPlan.price) : '',
      paymentMethod: 'cash',
      paymentDate: todayStr,
      notes: '',
      purpose: 'membership',
    });
    setManualPaymentModalError('');
    setManualPaymentModalOpen(true);
  };

  const handleManualPlanChange = (selectedPlanId) => {
    const planObj = plans.find((p) => p._id === selectedPlanId);
    setManualPaymentForm((prev) => ({
      ...prev,
      planId: selectedPlanId,
      amount: planObj?.price !== undefined ? String(planObj.price) : prev.amount,
    }));
  };

  const handleSubmitManualPayment = async (e) => {
    e.preventDefault();
    if (!manualPaymentForm.memberId) {
      setManualPaymentModalError('Please select a valid member.');
      return;
    }
    const parsedAmount = Number(manualPaymentForm.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setManualPaymentModalError('Payment amount must be greater than 0.');
      return;
    }

    try {
      setManualPaymentSubmitting(true);
      setManualPaymentModalError('');

      await paymentsApi.recordManual({
        memberId: manualPaymentForm.memberId,
        planId: manualPaymentForm.planId || undefined,
        amount: parsedAmount,
        paymentMethod: manualPaymentForm.paymentMethod,
        paymentDate: manualPaymentForm.paymentDate || new Date().toISOString(),
        notes: manualPaymentForm.notes,
        purpose: manualPaymentForm.purpose,
      });

      flashMessage(`Manual payment of ₹${parsedAmount} recorded and membership fulfilled!`);
      setManualPaymentModalOpen(false);
      await Promise.all([loadAdminPayments(), loadDashboardData()]);
    } catch (err) {
      setManualPaymentModalError(err.message || 'Failed to record manual payment.');
    } finally {
      setManualPaymentSubmitting(false);
    }
  };

  const handleOpenEditPaymentNotes = (pay) => {
    setEditingPayment(pay);
    setPaymentNotesForm(pay.notes || '');
    setEditPaymentNotesError('');
    setEditPaymentNotesModalOpen(true);
  };

  const handleSubmitEditPaymentNotes = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      setPaymentNotesSubmitting(true);
      setEditPaymentNotesError('');

      await paymentsApi.updateNotes(editingPayment._id, paymentNotesForm);
      flashMessage('Payment administrative notes updated successfully.');
      setEditPaymentNotesModalOpen(false);
      setEditingPayment(null);
      await loadAdminPayments();
    } catch (err) {
      setEditPaymentNotesError(err.message || 'Failed to update payment notes.');
    } finally {
      setPaymentNotesSubmitting(false);
    }
  };

  // --- Attendance Action Handlers ---
  const handleOpenCreateAttendance = () => {
    const now = new Date();
    const nowTimeStr = now.toTimeString().slice(0, 5);
    setAttendanceForm({
      memberId: members[0]?._id || '',
      date: now.toISOString().slice(0, 10),
      checkInTime: nowTimeStr,
      checkOutTime: '',
      status: 'active',
      notes: '',
    });
    setAttendanceModalError('');
    setCreateAttendanceModalOpen(true);
  };

  const handleSubmitCreateAttendance = async (e) => {
    e.preventDefault();
    if (!attendanceForm.memberId) {
      setAttendanceModalError('Please select a member.');
      return;
    }
    try {
      setAttendanceSubmitting(true);
      setAttendanceModalError('');

      const dateObj = new Date(attendanceForm.date);
      let inTime = null;
      if (attendanceForm.checkInTime) {
        const [h, m] = attendanceForm.checkInTime.split(':');
        inTime = new Date(dateObj);
        inTime.setHours(Number(h), Number(m), 0, 0);
      }

      let outTime = null;
      if (attendanceForm.checkOutTime) {
        const [oh, om] = attendanceForm.checkOutTime.split(':');
        outTime = new Date(dateObj);
        outTime.setHours(Number(oh), Number(om), 0, 0);
      }

      await attendanceApi.create({
        memberId: attendanceForm.memberId,
        date: attendanceForm.date,
        checkInTime: inTime,
        checkOutTime: outTime,
        status: attendanceForm.status,
        notes: attendanceForm.notes,
      });

      flashMessage('Attendance record logged successfully.');
      setCreateAttendanceModalOpen(false);
      await loadAdminAttendance();
    } catch (err) {
      setAttendanceModalError(err.message || 'Failed to create attendance record.');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleOpenEditAttendance = (rec) => {
    setEditingAttendance(rec);
    const dateStr = rec.date ? new Date(rec.date).toISOString().slice(0, 10) : '';
    const inTimeStr = rec.checkInTime
      ? new Date(rec.checkInTime).toTimeString().slice(0, 5)
      : '';
    const outTimeStr = rec.checkOutTime
      ? new Date(rec.checkOutTime).toTimeString().slice(0, 5)
      : '';

    setEditAttendanceForm({
      date: dateStr,
      checkInTime: inTimeStr,
      checkOutTime: outTimeStr,
      status: rec.status || 'active',
      notes: rec.notes || '',
    });
    setEditAttendanceModalError('');
    setEditAttendanceModalOpen(true);
  };

  const handleSubmitEditAttendance = async (e) => {
    e.preventDefault();
    if (!editingAttendance) return;
    try {
      setAttendanceSubmitting(true);
      setEditAttendanceModalError('');

      const dateObj = new Date(editAttendanceForm.date);
      let inTime = undefined;
      if (editAttendanceForm.checkInTime) {
        const [h, m] = editAttendanceForm.checkInTime.split(':');
        inTime = new Date(dateObj);
        inTime.setHours(Number(h), Number(m), 0, 0);
      }

      let outTime = null;
      if (editAttendanceForm.checkOutTime) {
        const [oh, om] = editAttendanceForm.checkOutTime.split(':');
        outTime = new Date(dateObj);
        outTime.setHours(Number(oh), Number(om), 0, 0);
      }

      await attendanceApi.update(editingAttendance._id, {
        date: editAttendanceForm.date,
        checkInTime: inTime,
        checkOutTime: outTime,
        status: editAttendanceForm.status,
        notes: editAttendanceForm.notes,
      });

      flashMessage('Attendance record corrected and updated.');
      setEditAttendanceModalOpen(false);
      setEditingAttendance(null);
      await loadAdminAttendance();
    } catch (err) {
      setEditAttendanceModalError(err.message || 'Failed to update attendance record.');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleConfirmDeleteAttendance = async () => {
    if (!deleteAttendanceTarget) return;
    try {
      setAttendanceSubmitting(true);
      setDeleteAttendanceError('');
      await attendanceApi.delete(deleteAttendanceTarget._id);
      flashMessage('Attendance record deleted successfully.');
      setDeleteAttendanceModalOpen(false);
      setDeleteAttendanceTarget(null);
      await loadAdminAttendance();
    } catch (err) {
      setDeleteAttendanceError(err.message || 'Failed to delete attendance record.');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  // --- Account Status Modal Handlers ---
  const handleOpenStatusModal = (userObj, roleLabel) => {
    if (!userObj?._id) return;
    const currentStatus = userObj.status || 'active';
    const targetStatus = currentStatus === 'active' ? 'inactive' : 'active';

    if (userObj._id === user?.id && targetStatus === 'inactive') {
      flashMessage('You cannot deactivate your own administrator account.');
      return;
    }

    setStatusTarget({
      id: userObj._id,
      name: userObj.name || 'User',
      email: userObj.email || '',
      role: roleLabel || userObj.role || 'user',
      currentStatus,
      targetStatus,
    });
    setStatusError('');
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget?.id) return;
    try {
      setStatusSubmitting(true);
      setStatusError('');
      await usersApi.updateStatus(statusTarget.id, statusTarget.targetStatus);
      flashMessage(
        `Account for ${statusTarget.name} has been ${statusTarget.targetStatus === 'active' ? 'activated' : 'deactivated'}.`
      );
      setStatusModalOpen(false);
      setStatusTarget(null);
      await loadDashboardData();
    } catch (err) {
      setStatusError(err.message || 'Failed to update account status.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // --- Reset Password Handlers ---
  const handleOpenResetPassword = (userObj, roleLabel) => {
    if (!userObj?._id) return;
    setResetPasswordTarget({
      id: userObj._id,
      name: userObj.name || 'User',
      email: userObj.email || '',
      role: roleLabel || userObj.role || 'user',
    });
    setNewPasswordValue('');
    setShowResetPassword(false);
    setResetError('');
    setResetPasswordModalOpen(true);
  };

  const handleSubmitResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordTarget?.id) return;
    if (!newPasswordValue || newPasswordValue.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setResetSubmitting(true);
      setResetError('');
      await usersApi.resetPassword(resetPasswordTarget.id, newPasswordValue);
      flashMessage(`Password for ${resetPasswordTarget.name} has been reset successfully.`);
      setResetPasswordModalOpen(false);
      setResetPasswordTarget(null);
      setNewPasswordValue('');
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  // --- Member Detail Inspector ---
  const handleOpenMemberDetail = async (member) => {
    setSelectedMemberDetail(member);
    setMemberDetailModalOpen(true);
    setMemberDetailPlan(null);
    try {
      setLoadingMemberPlan(true);
      const planRes = await trainingPlansApi.getByMemberId(member._id);
      setMemberDetailPlan(planRes?.activePlan || (planRes?.plans && planRes.plans[0]) || null);
    } catch (err) {
      console.warn('Could not load member training plan:', err.message);
    } finally {
      setLoadingMemberPlan(false);
    }
  };

  // --- Trainer Detail Inspector ---
  const handleOpenTrainerDetail = async (trainer) => {
    setSelectedTrainerDetail(trainer);
    setTrainerDetailModalOpen(true);
  };

  // --- Member Handlers ---
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberModalError('');
    setMemberForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      gender: 'unspecified',
      dateOfBirth: '',
      address: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
      membershipPlan: plans[0]?._id || '',
      assignedTrainer: '',
      status: 'active',
      notes: '',
    });
    setMemberModalOpen(true);
  };

  const handleOpenEditMember = (m) => {
    setEditingMember(m);
    setMemberModalError('');
    setMemberForm({
      name: m.user?.name || '',
      email: m.user?.email || '',
      password: '',
      phone: m.phone || '',
      gender: m.gender || 'unspecified',
      dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split('T')[0] : '',
      address: m.address || '',
      emergencyName: m.emergencyContact?.name || '',
      emergencyPhone: m.emergencyContact?.phone || '',
      emergencyRelation: m.emergencyContact?.relation || '',
      membershipPlan: m.membershipPlan?._id || '',
      assignedTrainer: m.assignedTrainer?._id || '',
      status: m.status || 'active',
      notes: m.notes || '',
    });
    setMemberModalOpen(true);
  };

  const handleSubmitMember = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMemberModalError('');
      const payload = {
        name: memberForm.name,
        phone: memberForm.phone,
        gender: memberForm.gender,
        dateOfBirth: memberForm.dateOfBirth || null,
        address: memberForm.address,
        emergencyContact: {
          name: memberForm.emergencyName,
          phone: memberForm.emergencyPhone,
          relation: memberForm.emergencyRelation,
        },
        membershipPlan: memberForm.membershipPlan || null,
        assignedTrainer: memberForm.assignedTrainer || null,
        status: memberForm.status,
        notes: memberForm.notes,
      };

      if (editingMember) {
        await membersApi.update(editingMember._id, payload);
        flashMessage(`Member ${memberForm.name} updated successfully.`);
      } else {
        payload.email = memberForm.email;
        payload.password = memberForm.password;
        await membersApi.create(payload);
        flashMessage(`New member ${memberForm.name} created successfully.`);
      }

      setMemberModalOpen(false);
      await loadDashboardData();
    } catch (err) {
      setMemberModalError(err.message || 'Error saving member');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Trainer Handlers ---
  const handleOpenAddTrainer = () => {
    setEditingTrainer(null);
    setTrainerModalError('');
    setTrainerForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: 'Strength & Hypertrophy',
      experience: '2 Years',
      certifications: 'CSCS, NASM-CPT',
      bio: '',
      status: 'active',
    });
    setTrainerModalOpen(true);
  };

  const handleOpenEditTrainer = (t) => {
    setEditingTrainer(t);
    setTrainerModalError('');
    setTrainerForm({
      name: t.user?.name || '',
      email: t.user?.email || '',
      password: '',
      phone: t.phone || '',
      specialization: t.specialization || '',
      experience: t.experience || '',
      certifications: Array.isArray(t.certifications) ? t.certifications.join(', ') : '',
      bio: t.bio || '',
      status: t.status || 'active',
    });
    setTrainerModalOpen(true);
  };

  const handleSubmitTrainer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setTrainerModalError('');
      const payload = {
        name: trainerForm.name,
        phone: trainerForm.phone,
        specialization: trainerForm.specialization,
        experience: trainerForm.experience,
        certifications: trainerForm.certifications,
        bio: trainerForm.bio,
        status: trainerForm.status,
      };

      if (editingTrainer) {
        await trainersApi.update(editingTrainer._id, payload);
        flashMessage(`Trainer ${trainerForm.name} updated successfully.`);
      } else {
        payload.email = trainerForm.email;
        payload.password = trainerForm.password;
        await trainersApi.create(payload);
        flashMessage(`New trainer ${trainerForm.name} created successfully.`);
      }

      setTrainerModalOpen(false);
      await loadDashboardData();
    } catch (err) {
      setTrainerModalError(err.message || 'Error saving trainer');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Plan Handlers ---
  const handleOpenAddPlan = () => {
    setEditingPlan(null);
    setPlanModalError('');
    setPlanForm({
      name: '',
      description: '',
      duration: 1,
      price: 29,
      features: 'Full Gym Access, Locker Room, Shower Access',
      status: 'active',
    });
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (p) => {
    setEditingPlan(p);
    setPlanModalError('');
    setPlanForm({
      name: p.name,
      description: p.description || '',
      duration: p.duration || 1,
      price: p.price,
      features: Array.isArray(p.features) ? p.features.join(', ') : '',
      status: p.status || 'active',
    });
    setPlanModalOpen(true);
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setPlanModalError('');
      const payload = {
        name: planForm.name,
        description: planForm.description,
        duration: Number(planForm.duration),
        price: Number(planForm.price),
        features: planForm.features,
        status: planForm.status,
      };

      if (editingPlan) {
        await membershipPlansApi.update(editingPlan._id, payload);
        flashMessage(`Plan ${planForm.name} updated successfully.`);
      } else {
        await membershipPlansApi.create(payload);
        flashMessage(`New plan ${planForm.name} created successfully.`);
      }

      setPlanModalOpen(false);
      await loadDashboardData();
    } catch (err) {
      setPlanModalError(err.message || 'Error saving plan');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Exercise Handlers ---
  const handleOpenAddExercise = () => {
    setEditingExercise(null);
    setExerciseModalError('');
    setExerciseForm({
      name: '',
      category: 'Strength',
      muscleGroup: 'Chest',
      equipment: 'Barbell',
      difficulty: 'Beginner',
      defaultSets: 3,
      defaultReps: 10,
      defaultDuration: 0,
      defaultRestTime: 60,
      description: '',
      instructions: '',
      status: 'active',
    });
    setExerciseModalOpen(true);
  };

  const handleOpenEditExercise = (ex) => {
    setEditingExercise(ex);
    setExerciseModalError('');
    setExerciseForm({
      name: ex.name,
      category: ex.category || 'Strength',
      muscleGroup: ex.muscleGroup || 'Chest',
      equipment: ex.equipment || 'None',
      difficulty: ex.difficulty || 'Beginner',
      defaultSets: ex.defaultSets || 3,
      defaultReps: ex.defaultReps || 10,
      defaultDuration: ex.defaultDuration || 0,
      defaultRestTime: ex.defaultRestTime || 60,
      description: ex.description || '',
      instructions: Array.isArray(ex.instructions) ? ex.instructions.join('\n') : '',
      status: ex.status || 'active',
    });
    setExerciseModalOpen(true);
  };

  const handleSubmitExercise = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setExerciseModalError('');
      const payload = {
        name: exerciseForm.name,
        category: exerciseForm.category,
        muscleGroup: exerciseForm.muscleGroup,
        equipment: exerciseForm.equipment,
        difficulty: exerciseForm.difficulty,
        defaultSets: Number(exerciseForm.defaultSets),
        defaultReps: Number(exerciseForm.defaultReps),
        defaultDuration: Number(exerciseForm.defaultDuration),
        defaultRestTime: Number(exerciseForm.defaultRestTime),
        description: exerciseForm.description,
        instructions: exerciseForm.instructions
          ? exerciseForm.instructions
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        status: exerciseForm.status,
      };

      if (editingExercise) {
        await exercisesApi.update(editingExercise._id, payload);
        flashMessage(`Exercise "${exerciseForm.name}" updated successfully.`);
      } else {
        await exercisesApi.create(payload);
        flashMessage(`New exercise "${exerciseForm.name}" added to catalog.`);
      }

      setExerciseModalOpen(false);
      await loadDashboardData();
    } catch (err) {
      setExerciseModalError(err.message || 'Error saving exercise');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Assign Exercise to Trainer Handlers ---
  const handleOpenAssignExercise = (exercise) => {
    setSelectedExerciseForAssign(exercise);
    const activeTrainers = trainers.filter((t) => t.status === 'active');
    setAssignTrainerId(activeTrainers[0]?._id || '');
    setAssignNotes('');
    setAssignError('');
    setAssignExerciseModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setAssignExerciseModalOpen(false);
    setSelectedExerciseForAssign(null);
    setAssignTrainerId('');
    setAssignNotes('');
    setAssignError('');
  };

  const handleSubmitAssignExercise = async (e) => {
    e.preventDefault();
    if (!assignTrainerId) {
      setAssignError('Please select an active trainer to assign this exercise to.');
      return;
    }
    if (!selectedExerciseForAssign) return;

    try {
      setAssignSubmitting(true);
      setAssignError('');
      await trainerExerciseAssignmentsApi.create({
        trainerId: assignTrainerId,
        exerciseId: selectedExerciseForAssign._id,
        notes: assignNotes,
      });

      const assignedTrainerObj = trainers.find((t) => t._id === assignTrainerId);
      flashMessage(
        `Exercise "${selectedExerciseForAssign.name}" successfully assigned to Coach ${
          assignedTrainerObj?.user?.name || 'Trainer'
        }!`
      );
      handleCloseAssignModal();
    } catch (err) {
      setAssignError(err.message || 'Failed to assign exercise to trainer.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // --- Delete Handler ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      setDeleteModalError('');
      if (deleteTarget.type === 'member') {
        await membersApi.delete(deleteTarget.id);
        flashMessage(`Member ${deleteTarget.name} deleted.`);
      } else if (deleteTarget.type === 'trainer') {
        await trainersApi.delete(deleteTarget.id);
        flashMessage(`Trainer ${deleteTarget.name} deleted.`);
      } else if (deleteTarget.type === 'plan') {
        await membershipPlansApi.delete(deleteTarget.id);
        flashMessage(`Plan ${deleteTarget.name} deleted.`);
      } else if (deleteTarget.type === 'exercise') {
        await exercisesApi.delete(deleteTarget.id);
        flashMessage(`Exercise ${deleteTarget.name} deleted.`);
      } else if (deleteTarget.type === 'trainingPlan') {
        await trainingPlansApi.delete(deleteTarget.id);
        flashMessage(`Training plan ${deleteTarget.name} deleted.`);
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await loadDashboardData();
    } catch (err) {
      setDeleteModalError(err.message || 'Error deleting item');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered lists
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !memberSearch ||
      (m.user?.name && m.user.name.toLowerCase().includes(memberSearch.toLowerCase())) ||
      (m.user?.email && m.user.email.toLowerCase().includes(memberSearch.toLowerCase())) ||
      (m.phone && m.phone.includes(memberSearch));
    const matchesStatus = !memberStatusFilter || m.status === memberStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTrainers = trainers.filter((t) => {
    return (
      !trainerSearch ||
      (t.user?.name && t.user.name.toLowerCase().includes(trainerSearch.toLowerCase())) ||
      (t.specialization && t.specialization.toLowerCase().includes(trainerSearch.toLowerCase()))
    );
  });

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      !exerciseSearch ||
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.category.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesCat = !exerciseCategoryFilter || ex.category === exerciseCategoryFilter;
    const matchesMuscle = !exerciseMuscleFilter || ex.muscleGroup === exerciseMuscleFilter;
    return matchesSearch && matchesCat && matchesMuscle;
  });

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="dashboard-greeting">
            <h1>Admin Console</h1>
            <p>Full control over members, coaches, workouts, exercise catalog, and memberships.</p>
          </div>
          <div className="dashboard-badge-group">
            <Badge variant="warning" size="md" icon={Shield}>
              System Administrator
            </Badge>
          </div>
        </div>

        {/* Global Feedback */}
        {successMessage && (
          <div
            className="auth-error-alert"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              borderColor: 'rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              marginBottom: '1.5rem',
            }}
          >
            <CheckCircle2 size={18} className="status-check-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="auth-error-alert" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Top 4 Real Statistics Cards */}
        <div className="dashboard-stats-grid">
          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-orange">
              <Users size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Total Members</span>
              <span className="stat-meta-value">{statsData?.stats?.totalMembers ?? '...'}</span>
              <span className="stat-meta-sub">
                {statsData?.stats?.activeMembers ?? 0} active athletes
              </span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-cyan">
              <Award size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Certified Coaches</span>
              <span className="stat-meta-value">{statsData?.stats?.totalTrainers ?? '...'}</span>
              <span className="stat-meta-sub">
                {statsData?.stats?.activeTrainers ?? 0} active on floor
              </span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-green">
              <Dumbbell size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Exercise Catalog</span>
              <span className="stat-meta-value">{statsData?.stats?.totalExercises ?? exercises.length}</span>
              <span className="stat-meta-sub">
                {statsData?.stats?.activeTrainingPlans ?? trainingPlans.length} active workout plans
              </span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-purple">
              <CreditCard size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Active Subscriptions</span>
              <span className="stat-meta-value">{statsData?.stats?.activeMemberships ?? '...'}</span>
              <span className="stat-meta-sub">
                {statsData?.stats?.totalPlans ?? plans.length} plan packages
              </span>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} />
            <span>Overview</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={16} />
            <span>Members ({members.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'trainers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trainers')}
          >
            <Award size={16} />
            <span>Trainers ({trainers.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
            onClick={() => setActiveTab('exercises')}
          >
            <Dumbbell size={16} />
            <span>Exercise Library ({exercises.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <Layers size={16} />
            <span>Workout Plans ({trainingPlans.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'memberships' ? 'active' : ''}`}
            onClick={() => setActiveTab('memberships')}
          >
            <CreditCard size={16} />
            <span>Memberships ({plans.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Clock size={16} />
            <span>Attendance ({attendanceRecords.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <Wallet size={16} />
            <span>Payments & Billing ({paymentStats.totalTransactions})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <Scale size={16} />
            <span>Fitness Progress ({progressTotal})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="overview-tab-content">
            <div className="grid-2" style={{ marginBottom: '2rem' }}>
              {/* Recent Members */}
              <Card className="glass-panel" padding="normal">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <h3 style={{ fontSize: '1.2rem' }}>Recent Member Registrations</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('members')}>
                    View All
                  </Button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData?.recentMembers?.length > 0 ? (
                        statsData.recentMembers.map((m) => (
                          <tr key={m._id}>
                            <td>
                              <div className="user-cell">
                                <span className="user-cell-name">{m.user?.name || 'Unnamed'}</span>
                                <span className="user-cell-email">{m.user?.email}</span>
                              </div>
                            </td>
                            <td>{m.membershipPlan?.name || <span className="text-muted">None</span>}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                                <span className={`status-pill status-${m.user?.status || 'active'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                                  Acc: {m.user?.status || 'active'}
                                </span>
                                <span className={`status-pill status-${m.status}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                                  Gym: {m.status}
                                </span>
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn-icon-action"
                                title="View Member Profile & Workout"
                                onClick={() => handleOpenMemberDetail(m)}
                              >
                                <Eye size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No recent registrations
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Plan Distribution */}
              <Card className="glass-panel" padding="normal">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <h3 style={{ fontSize: '1.2rem' }}>Membership Plan Distribution</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('memberships')}>
                    Manage Plans
                  </Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {statsData?.planDistribution?.map((p) => (
                    <div
                      key={p.planId}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{p.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          ${p.price}/month
                        </span>
                      </div>
                      <Badge variant="primary" size="md">
                        {p.memberCount} Members Subscribed
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBERS MANAGEMENT */}
        {activeTab === 'members' && (
          <div className="members-tab-content">
            <div className="module-toolbar">
              <div className="search-filter-group">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    className="search-input"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAddMember}>
                Add New Member
              </Button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member Details</th>
                    <th>Phone / Gender</th>
                    <th>Subscribed Plan</th>
                    <th>Assigned Coach</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <div className="user-cell">
                            <span className="user-cell-name">{m.user?.name || 'Unnamed Member'}</span>
                            <span className="user-cell-email">{m.user?.email}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{m.phone || <span className="text-muted">—</span>}</span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                textTransform: 'capitalize',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {m.gender || 'unspecified'}
                            </span>
                          </div>
                        </td>
                        <td>
                          {m.membershipPlan ? (
                            <Badge variant="secondary" size="sm">
                              {m.membershipPlan.name} (${m.membershipPlan.price}/mo)
                            </Badge>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                              No Plan Assigned
                            </span>
                          )}
                        </td>
                        <td>
                          {m.assignedTrainer ? (
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {m.assignedTrainer.user?.name || 'Coach'}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Account:</span>
                              <span className={`status-pill status-${m.user?.status || 'active'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                                {m.user?.status || 'active'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Member:</span>
                              <span className={`status-pill status-${m.status}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                                {m.status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button
                              className="btn-icon-action"
                              title="View Full Profile & Routine"
                              onClick={() => handleOpenMemberDetail(m)}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="btn-icon-action"
                              title="Edit Member"
                              onClick={() => handleOpenEditMember(m)}
                            >
                              <Edit2 size={15} />
                            </button>
                            {m.user && (
                              <>
                                <button
                                  className={`btn-icon-action ${
                                    m.user?.status === 'active' ? 'btn-icon-warning' : 'btn-icon-success'
                                  }`}
                                  title={
                                    m.user?.status === 'active'
                                      ? 'Deactivate Member Account'
                                      : 'Activate Member Account'
                                  }
                                  onClick={() =>
                                    handleOpenStatusModal(m.user, 'Member')
                                  }
                                >
                                  {m.user?.status === 'active' ? (
                                    <UserX size={15} />
                                  ) : (
                                    <UserCheck size={15} />
                                  )}
                                </button>
                                <button
                                  className="btn-icon-action"
                                  title="Reset Member Password"
                                  onClick={() => handleOpenResetPassword(m.user, 'Member')}
                                >
                                  <Key size={15} />
                                </button>
                              </>
                            )}
                            <button
                              className="btn-icon-action btn-icon-delete"
                              title="Delete Member"
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'member',
                                  id: m._id,
                                  name: m.user?.name || 'this member',
                                });
                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state-box">
                          <div className="empty-state-icon">
                            <Users size={28} />
                          </div>
                          <span className="empty-state-title">No members match the filter criteria</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRAINERS ROSTER */}
        {activeTab === 'trainers' && (
          <div className="trainers-tab-content">
            <div className="module-toolbar">
              <div className="search-filter-group">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by trainer name or specialization..."
                    className="search-input"
                    value={trainerSearch}
                    onChange={(e) => setTrainerSearch(e.target.value)}
                  />
                </div>
              </div>

              <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAddTrainer}>
                Add New Trainer
              </Button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Coach Name</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Active Roster</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainers.length > 0 ? (
                    filteredTrainers.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <div className="user-cell">
                            <span className="user-cell-name">{t.user?.name || 'Unnamed Coach'}</span>
                            <span className="user-cell-email">{t.user?.email}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline" size="sm">
                            {t.specialization}
                          </Badge>
                        </td>
                        <td>{t.experience || '1 Year'}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {t.activeMembersCount ?? t.assignedMembersCount ?? 0} Members Coached
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Account:</span>
                              <span className={`status-pill status-${t.user?.status || 'active'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                                {t.user?.status || 'active'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Coach:</span>
                              <span className={`status-pill status-${t.status}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button
                              className="btn-icon-action"
                              title="View Coach Profile & Athlete Roster"
                              onClick={() => handleOpenTrainerDetail(t)}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              className="btn-icon-action"
                              title="Edit Trainer"
                              onClick={() => handleOpenEditTrainer(t)}
                            >
                              <Edit2 size={15} />
                            </button>
                            {t.user && (
                              <>
                                <button
                                  className={`btn-icon-action ${
                                    t.user?.status === 'active' ? 'btn-icon-warning' : 'btn-icon-success'
                                  }`}
                                  title={
                                    t.user?.status === 'active'
                                      ? 'Deactivate Coach Account'
                                      : 'Activate Coach Account'
                                  }
                                  onClick={() =>
                                    handleOpenStatusModal(t.user, 'Coach')
                                  }
                                >
                                  {t.user?.status === 'active' ? (
                                    <UserX size={15} />
                                  ) : (
                                    <UserCheck size={15} />
                                  )}
                                </button>
                                <button
                                  className="btn-icon-action"
                                  title="Reset Coach Password"
                                  onClick={() => handleOpenResetPassword(t.user, 'Coach')}
                                >
                                  <Key size={15} />
                                </button>
                              </>
                            )}
                            <button
                              className="btn-icon-action btn-icon-delete"
                              title="Delete Trainer"
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'trainer',
                                  id: t._id,
                                  name: t.user?.name || 'this trainer',
                                });
                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state-box">
                          <div className="empty-state-icon">
                            <Award size={28} />
                          </div>
                          <span className="empty-state-title">No trainers found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EXERCISE LIBRARY */}
        {activeTab === 'exercises' && (
          <div className="exercises-tab-content">
            <div className="module-toolbar">
              <div className="search-filter-group">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search exercises by name..."
                    className="search-input"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={exerciseCategoryFilter}
                  onChange={(e) => setExerciseCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Strength">Strength</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Core">Core</option>
                  <option value="Bodyweight">Bodyweight</option>
                  <option value="Olympic">Olympic</option>
                  <option value="Flexibility">Flexibility</option>
                </select>
                <select
                  className="filter-select"
                  value={exerciseMuscleFilter}
                  onChange={(e) => setExerciseMuscleFilter(e.target.value)}
                >
                  <option value="">All Muscles</option>
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Legs">Legs</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Arms">Arms</option>
                  <option value="Core">Core</option>
                  <option value="Full Body">Full Body</option>
                </select>
              </div>

              <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAddExercise}>
                Add Exercise
              </Button>
            </div>

            <div className="exercise-library-grid">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((ex) => (
                  <div
                    key={ex._id}
                    className={`exercise-catalog-card ${
                      ex.status === 'active' ? 'interactive-exercise-card' : 'disabled-card'
                    }`}
                    onClick={() => {
                      if (ex.status === 'active') {
                        handleOpenAssignExercise(ex);
                      }
                    }}
                    title={
                      ex.status === 'active'
                        ? 'Click card to assign exercise to coach'
                        : 'Inactive exercise cannot be assigned'
                    }
                  >
                    <div>
                      <div className="exercise-catalog-header">
                        <div>
                          <h4 className="exercise-catalog-name">{ex.name}</h4>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {ex.muscleGroup} &bull; {ex.category}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          {ex.status === 'inactive' && (
                            <span className="exercise-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                              Inactive
                            </span>
                          )}
                          <span
                            className={`exercise-tag difficulty-${ex.difficulty.toLowerCase()}`}
                          >
                            {ex.difficulty}
                          </span>
                        </div>
                      </div>

                      <p className="exercise-catalog-desc">
                        {ex.description || 'Movement description and muscle activation details.'}
                      </p>

                      <div className="exercise-catalog-tags">
                        <span className="exercise-tag">Equipment: {ex.equipment}</span>
                        <span className="exercise-tag">
                          Defaults: {ex.defaultSets} sets &times; {ex.defaultReps} reps
                        </span>
                        {ex.defaultDuration > 0 && (
                          <span className="exercise-tag">{ex.defaultDuration}s duration</span>
                        )}
                        <span className="exercise-tag">Rest: {ex.defaultRestTime}s</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.75rem',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ex.status === 'active' ? (
                        <button
                          type="button"
                          className="btn-assign-action"
                          onClick={() => handleOpenAssignExercise(ex)}
                          title="Assign Exercise to Trainer"
                        >
                          <Sparkles size={14} />
                          <span>Assign to Coach</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inactive</span>
                      )}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEditExercise(ex)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          className="btn-icon-delete"
                          onClick={() => {
                            setDeleteTarget({
                              type: 'exercise',
                              id: ex._id,
                              name: ex.name,
                            });
                            setDeleteModalOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-box" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-state-icon">
                    <Dumbbell size={28} />
                  </div>
                  <span className="empty-state-title">No exercises match filter</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: WORKOUT / TRAINING PLANS */}
        {activeTab === 'plans' && (
          <div className="plans-tab-content">
            <div className="module-toolbar">
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Assigned Workout Routines</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Active and archived workout splits created by certified gym coaches.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan Name & Goal</th>
                    <th>Athlete</th>
                    <th>Assigned Coach</th>
                    <th>Exercises Count</th>
                    <th>Date Range</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingPlans.length > 0 ? (
                    trainingPlans.map((tp) => (
                      <tr key={tp._id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.98rem' }}>
                              {tp.planName}
                            </span>
                            <Badge variant="outline" size="sm" style={{ width: 'fit-content', marginTop: '0.2rem' }}>
                              {tp.goal}
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{tp.member?.user?.name || 'Athlete'}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            {tp.trainer?.user?.name || 'Coach'}
                          </span>
                        </td>
                        <td>
                          <Badge variant="secondary" size="sm">
                            {tp.exercises?.length || 0} Movements
                          </Badge>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>
                            {tp.startDate ? new Date(tp.startDate).toLocaleDateString() : '—'} &rarr;{' '}
                            {tp.endDate ? new Date(tp.endDate).toLocaleDateString() : 'Ongoing'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${tp.status}`}>{tp.status}</span>
                        </td>
                        <td>
                          <button
                            className="btn-icon-action btn-icon-delete"
                            title="Delete Plan"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'trainingPlan',
                                id: tp._id,
                                name: tp.planName,
                              });
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state-box">
                          <div className="empty-state-icon">
                            <Layers size={28} />
                          </div>
                          <span className="empty-state-title">No training plans created yet</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: MEMBERSHIP PLANS */}
        {activeTab === 'memberships' && (
          <div className="memberships-tab-content">
            <div className="module-toolbar">
              <h3 style={{ fontSize: '1.25rem' }}>Configured Membership Packages</h3>
              <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAddPlan}>
                Create New Plan
              </Button>
            </div>

            <div className="grid-3">
              {plans.map((p) => (
                <Card
                  key={p._id}
                  className="glass-panel"
                  padding="normal"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <h3 style={{ fontSize: '1.4rem' }}>{p.name}</h3>
                      <span className={`status-pill status-${p.status}`}>{p.status}</span>
                    </div>
                    <p
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.88rem',
                        marginBottom: '1rem',
                        minHeight: '38px',
                      }}
                    >
                      {p.description || 'Standard membership tier.'}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.3rem',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '2.2rem',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 900,
                          color: '#ffffff',
                        }}
                      >
                        ${p.price}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        / {p.duration} month(s)
                      </span>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '1rem',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary)',
                          display: 'block',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Included Features:
                      </span>
                      <ul
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          fontSize: '0.88rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {p.features?.map((f, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '1rem',
                    }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      icon={Edit2}
                      onClick={() => handleOpenEditPlan(p)}
                    >
                      Edit Plan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => {
                        setDeleteTarget({ type: 'plan', id: p._id, name: p.name });
                        setDeleteModalOpen(true);
                      }}
                      className="btn-icon-delete"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ATTENDANCE & CHECK-IN MANAGEMENT */}
        {activeTab === 'attendance' && (
          <div className="attendance-tab-content">
            {/* Top 4 Attendance Statistics */}
            <div className="attendance-stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Today's Check-Ins</span>
                <span className="attendance-stat-value" style={{ color: '#00e5ff' }}>
                  {attendanceStats.todayCheckIns}
                </span>
                <span className="attendance-stat-sub">Athletes checked in today</span>
              </div>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Currently Active</span>
                <span className="attendance-stat-value" style={{ color: '#34d399' }}>
                  {attendanceStats.currentlyActive}
                </span>
                <span className="attendance-stat-sub">Active workouts on floor</span>
              </div>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">This Month Visits</span>
                <span className="attendance-stat-value" style={{ color: 'var(--primary)' }}>
                  {attendanceStats.thisMonthRecords}
                </span>
                <span className="attendance-stat-sub">Current calendar month</span>
              </div>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">All-Time Check-Ins</span>
                <span className="attendance-stat-value">
                  {attendanceStats.totalRecords}
                </span>
                <span className="attendance-stat-sub">Total historical records</span>
              </div>
            </div>

            {/* Attendance Management Toolbar */}
            <Card className="glass-panel" padding="normal">
              <div className="module-toolbar">
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={22} className="text-highlight" /> Gym Attendance & Presence Log
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Real-time member floor presence, historical attendance tracking, and administrative session management.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  icon={Plus}
                  onClick={handleOpenCreateAttendance}
                >
                  Log Attendance
                </Button>
              </div>

              {/* Filters Bar */}
              <div className="search-filter-group" style={{ margin: '1rem 0 1.5rem', flexWrap: 'wrap', gap: '0.65rem' }}>
                <div className="search-input-wrap" style={{ flex: '1 1 240px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by member name, email or notes..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={attendanceStatusFilter}
                  onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active On Floor</option>
                  <option value="completed">Completed Session</option>
                </select>

                <input
                  type="date"
                  className="filter-select"
                  style={{ color: attendanceDateFilter ? '#ffffff' : 'var(--text-muted)' }}
                  value={attendanceDateFilter}
                  onChange={(e) => setAttendanceDateFilter(e.target.value)}
                  title="Filter by Specific Date"
                />

                <select
                  className="filter-select"
                  value={attendanceTrainerFilter}
                  onChange={(e) => setAttendanceTrainerFilter(e.target.value)}
                >
                  <option value="">All Assigned Coaches</option>
                  {trainers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user?.name}
                    </option>
                  ))}
                </select>

                {(attendanceSearch || attendanceStatusFilter || attendanceDateFilter || attendanceTrainerFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAttendanceSearch('');
                      setAttendanceStatusFilter('');
                      setAttendanceDateFilter('');
                      setAttendanceTrainerFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Attendance Table */}
              {attendanceLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  Loading attendance records...
                </div>
              ) : attendanceRecords && attendanceRecords.length > 0 ? (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Coach</th>
                        <th>Date</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Logged By</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((rec) => (
                        <tr key={rec._id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ color: '#ffffff' }}>
                                {rec.member?.user?.name || 'Member'}
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {rec.member?.user?.email}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                              {rec.member?.assignedTrainer?.user?.name || 'Unassigned'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#ffffff' }}>
                              {rec.date ? new Date(rec.date).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td>{formatTime(rec.checkInTime)}</td>
                          <td>{formatTime(rec.checkOutTime)}</td>
                          <td>
                            <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                              {calculateDuration(rec.checkInTime, rec.checkOutTime)}
                            </span>
                          </td>
                          <td>
                            {rec.status === 'completed' ? (
                              <Badge variant="primary" size="sm">Completed</Badge>
                            ) : (
                              <span className="status-pill status-active">Active</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {rec.markedBy?.name || 'System'} ({rec.markedBy?.role || 'user'})
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '160px' }}>
                            {rec.notes || '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn-icon-action"
                                title="Edit & Correct Attendance"
                                onClick={() => handleOpenEditAttendance(rec)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-action delete"
                                title="Delete Attendance Record"
                                onClick={() => {
                                  setDeleteAttendanceTarget(rec);
                                  setDeleteAttendanceError('');
                                  setDeleteAttendanceModalOpen(true);
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-box">
                  <div className="empty-state-icon">
                    <Clock size={28} />
                  </div>
                  <span className="empty-state-title">No Attendance Records Found</span>
                  <p style={{ fontSize: '0.88rem' }}>
                    No member check-ins match your search criteria. Click &ldquo;Log Attendance&rdquo; to manually record a visit.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 8: PAYMENTS & BILLING */}
        {activeTab === 'payments' && (
          <div className="payments-tab-content">
            {/* Header / Actions */}
            <div className="section-header-row" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2>Payments & Membership Billing</h2>
                <p>Track online Razorpay transactions, record offline payments, and audit receipts.</p>
              </div>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={handleOpenManualPayment}
              >
                Record Manual Payment
              </Button>
            </div>

            {/* 5 Real Financial Statistics Cards */}
            <div className="attendance-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.5rem' }}>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Total Gross Revenue</span>
                <span className="attendance-stat-value" style={{ color: '#34d399' }}>
                  ₹{paymentStats.totalRevenue}
                </span>
                <span className="attendance-stat-sub">Lifetime completed payments</span>
              </div>

              <div className="attendance-stat-box">
                <span className="attendance-stat-label">This Month Revenue</span>
                <span className="attendance-stat-value" style={{ color: '#00e5ff' }}>
                  ₹{paymentStats.thisMonthRevenue}
                </span>
                <span className="attendance-stat-sub">Current calendar month</span>
              </div>

              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Today's Revenue</span>
                <span className="attendance-stat-value" style={{ color: 'var(--primary)' }}>
                  ₹{paymentStats.todayRevenue}
                </span>
                <span className="attendance-stat-sub">Collected today</span>
              </div>

              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Verified Paid</span>
                <span className="attendance-stat-value" style={{ color: '#a78bfa' }}>
                  {paymentStats.paidTransactions}
                </span>
                <span className="attendance-stat-sub">Successful transactions</span>
              </div>

              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Pending / Issues</span>
                <span className="attendance-stat-value" style={{ color: paymentStats.failedTransactions > 0 ? '#f87171' : 'var(--text-muted)' }}>
                  {paymentStats.pendingTransactions + paymentStats.failedTransactions}
                </span>
                <span className="attendance-stat-sub">
                  {paymentStats.pendingTransactions} pending &bull; {paymentStats.failedTransactions} failed
                </span>
              </div>
            </div>

            {/* Main Payments Card */}
            <Card className="glass-panel" padding="normal">
              {/* Filters Bar */}
              <div className="search-filter-group" style={{ margin: '0 0 1.5rem', flexWrap: 'wrap', gap: '0.65rem' }}>
                <div className="search-input-wrap" style={{ flex: '1 1 240px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by receipt #, member name, email or gateway ID..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid & Verified</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  className="filter-select"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                >
                  <option value="">All Payment Methods</option>
                  <option value="razorpay">Razorpay Online</option>
                  <option value="cash">Cash (Offline)</option>
                  <option value="upi">UPI (Offline / Direct)</option>
                  <option value="card">Card (POS / Terminal)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="date"
                  className="filter-select"
                  style={{ color: paymentStartDateFilter ? '#ffffff' : 'var(--text-muted)' }}
                  value={paymentStartDateFilter}
                  onChange={(e) => setPaymentStartDateFilter(e.target.value)}
                  title="Filter from Start Date"
                />

                <input
                  type="date"
                  className="filter-select"
                  style={{ color: paymentEndDateFilter ? '#ffffff' : 'var(--text-muted)' }}
                  value={paymentEndDateFilter}
                  onChange={(e) => setPaymentEndDateFilter(e.target.value)}
                  title="Filter to End Date"
                />

                {(paymentSearch || paymentStatusFilter || paymentMethodFilter || paymentStartDateFilter || paymentEndDateFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPaymentSearch('');
                      setPaymentStatusFilter('');
                      setPaymentMethodFilter('');
                      setPaymentStartDateFilter('');
                      setPaymentEndDateFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Payments Table */}
              {paymentLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  Loading payment and billing records...
                </div>
              ) : paymentsList && paymentsList.length > 0 ? (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Receipt #</th>
                        <th>Member</th>
                        <th>Plan / Purpose</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                        <th>Recorded By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsList.map((pay) => (
                        <tr key={pay._id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ffffff' }}>
                              {pay.receiptNumber}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ color: '#ffffff' }}>
                                {pay.member?.user?.name || 'Athlete'}
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {pay.member?.user?.email}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>
                              {pay.membershipPlan?.name || (pay.purpose === 'renewal' ? 'Renewal' : 'Membership')}
                            </span>
                            {pay.membershipPlan?.duration && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                                {pay.membershipPlan.duration} mo duration
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                              ₹{pay.amount}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                color:
                                  pay.paymentMethod === 'razorpay'
                                    ? '#00e5ff'
                                    : pay.paymentMethod === 'cash'
                                    ? '#34d399'
                                    : 'var(--primary)',
                              }}
                            >
                              {pay.paymentMethod === 'razorpay' ? 'Razorpay' : pay.paymentMethod}
                            </span>
                          </td>
                          <td>
                            {pay.status === 'paid' ? (
                              <Badge variant="primary" size="sm">Paid</Badge>
                            ) : pay.status === 'pending' ? (
                              <Badge variant="warning" size="sm">Pending</Badge>
                            ) : (
                              <Badge variant="danger" size="sm">Failed</Badge>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                              {pay.paymentDate
                                ? new Date(pay.paymentDate).toLocaleDateString()
                                : new Date(pay.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {pay.recordedBy?.name || (pay.paymentMethod === 'razorpay' ? 'Online Gateway' : 'System')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn-icon-action"
                                title="View Payment Receipt"
                                onClick={() => {
                                  setSelectedAdminReceipt(pay);
                                  setAdminReceiptModalOpen(true);
                                }}
                              >
                                <Receipt size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon-action"
                                title="Edit Administrative Notes"
                                onClick={() => handleOpenEditPaymentNotes(pay)}
                              >
                                <Edit2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-box">
                  <div className="empty-state-icon">
                    <CreditCard size={28} />
                  </div>
                  <span className="empty-state-title">No Payment Records Found</span>
                  <p style={{ fontSize: '0.88rem' }}>
                    No transactions match your current search/filter settings. Click &ldquo;Record Manual Payment&rdquo; to log an offline transaction.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 9: FITNESS PROGRESS */}
        {activeTab === 'progress' && (
          <div className="progress-tab-content">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>
                  Gym-Wide Fitness & Body Composition Records
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Monitor weight changes, body fat percentages, and physical measurements across all gym members.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenAdminAddProgress}
              >
                <Plus size={16} />
                <span>Log Progress Entry</span>
              </Button>
            </div>

            {/* Main Progress Card */}
            <Card className="glass-panel" padding="normal">
              {/* Filters Bar */}
              <div className="search-filter-group" style={{ margin: '0 0 1.5rem', flexWrap: 'wrap', gap: '0.65rem' }}>
                <div className="search-input-wrap" style={{ flex: '1 1 240px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by member name, email or notes..."
                    value={progressSearch}
                    onChange={(e) => {
                      setProgressSearch(e.target.value);
                      setProgressPage(1);
                    }}
                  />
                </div>

                <select
                  className="filter-select"
                  value={progressMemberFilter}
                  onChange={(e) => {
                    setProgressMemberFilter(e.target.value);
                    setProgressPage(1);
                  }}
                >
                  <option value="">All Athletes ({members.length})</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.user?.name || 'Athlete'} ({m.user?.email})
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  className="filter-select"
                  style={{ color: progressStartDate ? '#ffffff' : 'var(--text-muted)' }}
                  value={progressStartDate}
                  onChange={(e) => {
                    setProgressStartDate(e.target.value);
                    setProgressPage(1);
                  }}
                  title="Filter from Start Date"
                />

                <input
                  type="date"
                  className="filter-select"
                  style={{ color: progressEndDate ? '#ffffff' : 'var(--text-muted)' }}
                  value={progressEndDate}
                  onChange={(e) => {
                    setProgressEndDate(e.target.value);
                    setProgressPage(1);
                  }}
                  title="Filter to End Date"
                />

                {(progressSearch || progressMemberFilter || progressStartDate || progressEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProgressSearch('');
                      setProgressMemberFilter('');
                      setProgressStartDate('');
                      setProgressEndDate('');
                      setProgressPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Progress Table */}
              {progressLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  Loading gym-wide fitness progress records...
                </div>
              ) : progressLogs && progressLogs.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Athlete</th>
                          <th>Recorded Date</th>
                          <th>Weight</th>
                          <th>Body Fat</th>
                          <th>Measurements (Chest / Waist / Hips)</th>
                          <th>Arms / Thighs</th>
                          <th>Logged By</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progressLogs.map((log) => (
                          <tr key={log._id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ color: '#ffffff' }}>
                                  {log.member?.user?.name || 'Athlete'}
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {log.member?.user?.email}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                {log.recordedAt ? new Date(log.recordedAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </td>
                            <td>
                              {log.weight !== null && log.weight !== undefined ? (
                                <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                                  {log.weight} kg
                                </strong>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td>
                              {log.bodyFatPercentage !== null && log.bodyFatPercentage !== undefined ? (
                                <span style={{ color: '#00e5ff', fontWeight: 600 }}>
                                  {log.bodyFatPercentage}%
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {[
                                  log.chest ? `C: ${log.chest}cm` : null,
                                  log.waist ? `W: ${log.waist}cm` : null,
                                  log.hips ? `H: ${log.hips}cm` : null,
                                ].filter(Boolean).join(' • ') || '—'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {[
                                  log.arms ? `Arms: ${log.arms}cm` : null,
                                  log.thighs ? `Thighs: ${log.thighs}cm` : null,
                                ].filter(Boolean).join(' • ') || '—'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {log.recordedBy?.name || 'Self'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-icon-action"
                                  title="Edit Progress Entry"
                                  onClick={() => handleOpenAdminEditProgress(log)}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-action danger"
                                  title="Delete Progress Entry"
                                  onClick={() => handleOpenDeleteProgress(log)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {progressPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1.5rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.88rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>
                        Showing Page {progressPage} of {progressPages} ({progressTotal} total entries)
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={progressPage <= 1}
                          onClick={() => setProgressPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={progressPage >= progressPages}
                          onClick={() => setProgressPage((p) => Math.min(progressPages, p + 1))}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state-box">
                  <div className="empty-state-icon">
                    <Scale size={28} />
                  </div>
                  <span className="empty-state-title">No Fitness Progress Records</span>
                  <p style={{ fontSize: '0.88rem' }}>
                    No fitness metrics match your current search/filter settings. Click &ldquo;Log Progress Entry&rdquo; to record body composition data.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* MODAL: MEMBER DETAIL INSPECTOR */}
        <Modal
          isOpen={memberDetailModalOpen}
          onClose={() => setMemberDetailModalOpen(false)}
          title={`Member Profile: ${selectedMemberDetail?.user?.name || 'Athlete'}`}
          subtitle="Complete athlete overview, membership subscription, and active workout routine."
          size="lg"
        >
          {selectedMemberDetail && (
            <div className="detail-view-container">
              {/* Personal & Subscription Overview */}
              <div className="detail-grid">
                <div className="detail-section">
                  <span className="detail-section-title">
                    <UserCheck size={16} /> Personal Info
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedMemberDetail.user?.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{selectedMemberDetail.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address</span>
                      <span className="detail-value">{selectedMemberDetail.address || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Emergency Contact</span>
                      <span className="detail-value">
                        {selectedMemberDetail.emergencyContact?.name
                          ? `${selectedMemberDetail.emergencyContact.name} (${selectedMemberDetail.emergencyContact.phone})`
                          : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <span className="detail-section-title">
                    <CreditCard size={16} /> Membership & Coach
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="detail-item">
                      <span className="detail-label">Membership Tier</span>
                      <span className="detail-value">
                        {selectedMemberDetail.membershipPlan ? (
                          <Badge variant="primary" size="sm">
                            {selectedMemberDetail.membershipPlan.name} ($
                            {selectedMemberDetail.membershipPlan.price}/mo)
                          </Badge>
                        ) : (
                          'No plan assigned'
                        )}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Assigned Coach</span>
                      <span className="detail-value">
                        {selectedMemberDetail.assignedTrainer ? (
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                            {selectedMemberDetail.assignedTrainer.user?.name || 'Coach'}
                          </span>
                        ) : (
                          'Unassigned'
                        )}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className="detail-value">
                        <span className={`status-pill status-${selectedMemberDetail.status}`}>
                          {selectedMemberDetail.status}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Training Routine */}
              <div className="detail-section">
                <span className="detail-section-title">
                  <Dumbbell size={16} /> Active Training Plan & Routine
                </span>

                {loadingMemberPlan ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading workout routine...</p>
                ) : memberDetailPlan ? (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                          {memberDetailPlan.planName}
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {memberDetailPlan.description || 'Targeted workout program.'}
                        </p>
                      </div>
                      <Badge variant="secondary" size="md">
                        {memberDetailPlan.goal}
                      </Badge>
                    </div>

                    {memberDetailPlan.notes && (
                      <p
                        style={{
                          fontSize: '0.85rem',
                          background: 'rgba(255, 77, 0, 0.08)',
                          borderLeft: '3px solid var(--primary)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                          marginBottom: '1rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <strong>Coach Notes:</strong> {memberDetailPlan.notes}
                      </p>
                    )}

                    <div className="routine-exercises-list">
                      {memberDetailPlan.exercises?.map((item, idx) => (
                        <div key={idx} className="routine-exercise-card">
                          <div className="routine-exercise-header">
                            <span className="routine-exercise-title">
                              {idx + 1}. {item.exercise?.name || 'Exercise Movement'}
                            </span>
                            <div className="routine-exercise-badges">
                              <Badge variant="outline" size="sm">
                                {item.exercise?.muscleGroup}
                              </Badge>
                              <Badge variant="primary" size="sm">
                                {item.sets} Sets &times; {item.reps} Reps
                              </Badge>
                            </div>
                          </div>

                          <div className="routine-exercise-meta">
                            {item.targetWeight > 0 && (
                              <span className="routine-exercise-meta-item">
                                Target: {item.targetWeight} kg
                              </span>
                            )}
                            {item.duration > 0 && (
                              <span className="routine-exercise-meta-item">
                                Duration: {item.duration}s
                              </span>
                            )}
                            <span className="routine-exercise-meta-item">
                              ⏱️ Rest: {item.restTime}s
                            </span>
                            {item.exercise?.equipment && (
                              <span className="routine-exercise-meta-item">
                                {item.exercise.equipment}
                              </span>
                            )}
                          </div>

                          {item.instructions && (
                            <p className="routine-exercise-notes">
                              &ldquo;{item.instructions}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No active workout routine currently assigned to this athlete.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  size="md"
                  icon={Edit2}
                  onClick={() => {
                    setMemberDetailModalOpen(false);
                    handleOpenEditMember(selectedMemberDetail);
                  }}
                >
                  Edit Member Record
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setMemberDetailModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: TRAINER DETAIL INSPECTOR */}
        <Modal
          isOpen={trainerDetailModalOpen}
          onClose={() => setTrainerDetailModalOpen(false)}
          title={`Coach Profile: ${selectedTrainerDetail?.user?.name || 'Trainer'}`}
          subtitle="Coach credentials, bio, and assigned athlete roster."
          size="md"
        >
          {selectedTrainerDetail && (
            <div className="detail-view-container">
              <div className="detail-section">
                <span className="detail-section-title">
                  <Award size={16} /> Coach Credentials
                </span>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedTrainerDetail.user?.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedTrainerDetail.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Specialization</span>
                    <span className="detail-value">{selectedTrainerDetail.specialization}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Experience</span>
                    <span className="detail-value">{selectedTrainerDetail.experience}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <span className="detail-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                    Certifications
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {selectedTrainerDetail.certifications?.map((c, i) => (
                      <Badge key={i} variant="outline" size="sm">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <span className="detail-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                    Biography
                  </span>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {selectedTrainerDetail.bio || 'Experienced personal trainer on the IronForge floor.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  size="md"
                  icon={Edit2}
                  onClick={() => {
                    setTrainerDetailModalOpen(false);
                    handleOpenEditTrainer(selectedTrainerDetail);
                  }}
                >
                  Edit Coach Profile
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setTrainerDetailModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL 1: ADD / EDIT MEMBER */}
        <Modal
          isOpen={memberModalOpen}
          onClose={() => setMemberModalOpen(false)}
          title={editingMember ? `Edit Member: ${editingMember.user?.name}` : 'Register New Member'}
          subtitle="Manage member details, assign coach and configure membership subscription."
          size="lg"
        >
          <form onSubmit={handleSubmitMember}>
            {memberModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{memberModalError}</span>
              </div>
            )}
            <div className="modal-form-grid">
              <div className="form-field">
                <label className="field-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  placeholder="e.g. Michael Scott"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                />
              </div>

              {!editingMember && (
                <>
                  <div className="form-field">
                    <label className="field-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      className="field-input"
                      placeholder="e.g. member@example.com"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Initial Password * (Min 6 chars)</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showMemberPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        className="field-input"
                        placeholder="Enter strong password"
                        value={memberForm.password}
                        onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowMemberPassword(!showMemberPassword)}
                        title={showMemberPassword ? 'Hide password' : 'Show password'}
                      >
                        {showMemberPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="form-field">
                <label className="field-label">Phone Number</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="+1 (555) 000-0000"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Gender</label>
                <select
                  className="field-select"
                  value={memberForm.gender}
                  onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                >
                  <option value="unspecified">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Date of Birth</label>
                <input
                  type="date"
                  className="field-input"
                  value={memberForm.dateOfBirth}
                  onChange={(e) => setMemberForm({ ...memberForm, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Membership Plan Tier</label>
                <select
                  className="field-select"
                  value={memberForm.membershipPlan}
                  onChange={(e) => setMemberForm({ ...memberForm, membershipPlan: e.target.value })}
                >
                  <option value="">No Plan Assigned</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (${p.price}/mo - {p.duration} mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Assign Personal Coach</label>
                <select
                  className="field-select"
                  value={memberForm.assignedTrainer}
                  onChange={(e) => setMemberForm({ ...memberForm, assignedTrainer: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user?.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Member Status</label>
                <select
                  className="field-select"
                  value={memberForm.status}
                  onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="modal-form-col-full form-field">
                <label className="field-label">Home Address</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Street address, City, State"
                  value={memberForm.address}
                  onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                />
              </div>

              <div className="modal-form-col-full form-field">
                <label className="field-label">Emergency Contact Info (Name / Phone / Relation)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Contact Name"
                    value={memberForm.emergencyName}
                    onChange={(e) => setMemberForm({ ...memberForm, emergencyName: e.target.value })}
                  />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Contact Phone"
                    value={memberForm.emergencyPhone}
                    onChange={(e) => setMemberForm({ ...memberForm, emergencyPhone: e.target.value })}
                  />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Relation"
                    value={memberForm.emergencyRelation}
                    onChange={(e) => setMemberForm({ ...memberForm, emergencyRelation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions-row">
              <Button variant="ghost" size="md" onClick={() => setMemberModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Saving...' : editingMember ? 'Save Changes' : 'Create Member'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: ADD / EDIT TRAINER */}
        <Modal
          isOpen={trainerModalOpen}
          onClose={() => setTrainerModalOpen(false)}
          title={editingTrainer ? `Edit Coach: ${editingTrainer.user?.name}` : 'Add New Coach'}
          subtitle="Configure coach specialties, certifications, experience, and profile details."
          size="md"
        >
          <form onSubmit={handleSubmitTrainer}>
            {trainerModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{trainerModalError}</span>
              </div>
            )}
            <div className="modal-form-grid">
              <div className="form-field modal-form-col-full">
                <label className="field-label">Coach Name *</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  placeholder="e.g. Marcus Vance"
                  value={trainerForm.name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                />
              </div>

              {!editingTrainer && (
                <>
                  <div className="form-field">
                    <label className="field-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      className="field-input"
                      placeholder="e.g. coach@ironforge.test"
                      value={trainerForm.email}
                      onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Password * (Min 6 chars)</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showTrainerPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        className="field-input"
                        placeholder="Password"
                        value={trainerForm.password}
                        onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowTrainerPassword(!showTrainerPassword)}
                        title={showTrainerPassword ? 'Hide password' : 'Show password'}
                      >
                        {showTrainerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="form-field">
                <label className="field-label">Specialization</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Strength & Conditioning"
                  value={trainerForm.specialization}
                  onChange={(e) => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Experience</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. 5+ Years"
                  value={trainerForm.experience}
                  onChange={(e) => setTrainerForm({ ...trainerForm, experience: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Certifications (Comma separated)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. CSCS, NASM Master Trainer, FMS Level 2"
                  value={trainerForm.certifications}
                  onChange={(e) => setTrainerForm({ ...trainerForm, certifications: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Coach Bio</label>
                <textarea
                  className="field-textarea"
                  placeholder="Short professional summary..."
                  value={trainerForm.bio}
                  onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Status</label>
                <select
                  className="field-select"
                  value={trainerForm.status}
                  onChange={(e) => setTrainerForm({ ...trainerForm, status: e.target.value })}
                >
                  <option value="active">Active Coach</option>
                  <option value="inactive">Inactive / On Leave</option>
                </select>
              </div>
            </div>

            <div className="modal-actions-row">
              <Button variant="ghost" size="md" onClick={() => setTrainerModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Saving...' : editingTrainer ? 'Save Coach' : 'Create Coach'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 3: ADD / EDIT EXERCISE */}
        <Modal
          isOpen={exerciseModalOpen}
          onClose={() => setExerciseModalOpen(false)}
          title={editingExercise ? `Edit Exercise: ${editingExercise.name}` : 'Add Exercise to Catalog'}
          subtitle="Configure movement category, target muscle group, equipment, and default sets/reps."
          size="lg"
        >
          <form onSubmit={handleSubmitExercise}>
            {exerciseModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{exerciseModalError}</span>
              </div>
            )}
            <div className="modal-form-grid">
              <div className="form-field modal-form-col-full">
                <label className="field-label">Exercise Name *</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  placeholder="e.g. Barbell Incline Bench Press"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Category *</label>
                <select
                  className="field-select"
                  value={exerciseForm.category}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value })}
                >
                  <option value="Strength">Strength</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Core">Core</option>
                  <option value="Bodyweight">Bodyweight</option>
                  <option value="Olympic">Olympic</option>
                  <option value="Flexibility">Flexibility</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Target Muscle Group *</label>
                <select
                  className="field-select"
                  value={exerciseForm.muscleGroup}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroup: e.target.value })}
                >
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Legs">Legs</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Arms">Arms</option>
                  <option value="Core">Core</option>
                  <option value="Full Body">Full Body</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Equipment Needed</label>
                <select
                  className="field-select"
                  value={exerciseForm.equipment}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
                >
                  <option value="Barbell">Barbell</option>
                  <option value="Dumbbell">Dumbbell</option>
                  <option value="Machine">Machine</option>
                  <option value="Cable">Cable</option>
                  <option value="Bodyweight">Bodyweight</option>
                  <option value="Kettlebell">Kettlebell</option>
                  <option value="Bands">Bands</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Difficulty Level</label>
                <select
                  className="field-select"
                  value={exerciseForm.difficulty}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Default Sets</label>
                <input
                  type="number"
                  min="1"
                  className="field-input"
                  value={exerciseForm.defaultSets}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, defaultSets: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Default Reps</label>
                <input
                  type="number"
                  min="0"
                  className="field-input"
                  value={exerciseForm.defaultReps}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, defaultReps: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Default Rest (seconds)</label>
                <input
                  type="number"
                  min="0"
                  className="field-input"
                  value={exerciseForm.defaultRestTime}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, defaultRestTime: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Exercise Description</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Primary muscle focus and biomechanics summary..."
                  value={exerciseForm.description}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Execution Instructions (1 step per line)</label>
                <textarea
                  className="field-textarea"
                  placeholder="Step 1: Set up bench&#10;Step 2: Grip bar&#10;Step 3: Lower and press"
                  value={exerciseForm.instructions}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <Button variant="ghost" size="md" onClick={() => setExerciseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Saving...' : editingExercise ? 'Save Exercise' : 'Add Exercise'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 4: ADD / EDIT MEMBERSHIP PLAN */}
        <Modal
          isOpen={planModalOpen}
          onClose={() => setPlanModalOpen(false)}
          title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Membership Plan'}
          subtitle="Configure pricing, billing duration, and feature access."
          size="md"
        >
          <form onSubmit={handleSubmitPlan}>
            {planModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{planModalError}</span>
              </div>
            )}
            <div className="modal-form-grid">
              <div className="form-field modal-form-col-full">
                <label className="field-label">Plan Name *</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  placeholder="e.g. Standard Tier"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Monthly Price ($) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="field-input"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Duration (Months) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="field-input"
                  value={planForm.duration}
                  onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Features Included (Comma separated) *</label>
                <textarea
                  className="field-textarea"
                  required
                  placeholder="e.g. 24/7 Floor Access, Sauna Suite, 1 PT Session per Month"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Plan Description</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Short marketing tagline..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <Button variant="ghost" size="md" onClick={() => setPlanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Saving...' : editingPlan ? 'Save Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 5: CONFIRM DELETE */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {deleteModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{deleteModalError}</span>
              </div>
            )}
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '1.5rem',
              }}
            >
              Are you sure you want to delete{' '}
              <strong style={{ color: '#ffffff' }}>{deleteTarget?.name}</strong>? This action will
              permanently remove the record.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="ghost" size="md" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={submitting}
                onClick={handleConfirmDelete}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Record'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* MODAL 6: ASSIGN EXERCISE TO TRAINER */}
        <Modal
          isOpen={assignExerciseModalOpen}
          onClose={handleCloseAssignModal}
          title={selectedExerciseForAssign ? `Assign Exercise: ${selectedExerciseForAssign.name}` : 'Assign Exercise'}
          subtitle="Assign this exercise to an active gym trainer's coaching arsenal."
          size="md"
        >
          {selectedExerciseForAssign && (
            <form onSubmit={handleSubmitAssignExercise}>
              {/* Exercise Preview Banner */}
              <div className="assignment-preview-box">
                <div className="assignment-preview-header">
                  <div className="assignment-preview-title">
                    🏋️ {selectedExerciseForAssign.name}
                  </div>
                  <Badge variant="outline" size="sm">
                    {selectedExerciseForAssign.difficulty}
                  </Badge>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <Badge variant="primary" size="sm">
                    {selectedExerciseForAssign.muscleGroup}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {selectedExerciseForAssign.category}
                  </Badge>
                  <span className="exercise-tag">
                    Equipment: {selectedExerciseForAssign.equipment}
                  </span>
                  <span className="exercise-tag">
                    Defaults: {selectedExerciseForAssign.defaultSets} sets &times; {selectedExerciseForAssign.defaultReps} reps
                  </span>
                </div>
                {selectedExerciseForAssign.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    {selectedExerciseForAssign.description}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {assignError && (
                <div className="assignment-error-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{assignError}</span>
                </div>
              )}

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-field">
                  <label className="field-label">Assign To Trainer *</label>
                  <select
                    className="field-select"
                    required
                    value={assignTrainerId}
                    onChange={(e) => {
                      setAssignTrainerId(e.target.value);
                      setAssignError('');
                    }}
                  >
                    <option value="">-- Select Active Trainer --</option>
                    {trainers
                      .filter((t) => t.status === 'active')
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.user?.name || 'Coach'} ({t.specialization || 'Personal Trainer'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Selected Trainer Preview */}
                {assignTrainerId && (() => {
                  const currentTrainer = trainers.find((t) => t._id === assignTrainerId);
                  if (!currentTrainer) return null;
                  return (
                    <div className="assignment-trainer-preview">
                      <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                        Coach: {currentTrainer.user?.name}
                      </div>
                      <div style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {currentTrainer.specialization} &bull; {currentTrainer.experience} Experience
                      </div>
                      {currentTrainer.certifications && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          Certifications: {currentTrainer.certifications}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="form-field">
                  <label className="field-label">Coaching Directives / Notes (Optional)</label>
                  <textarea
                    className="field-textarea"
                    rows={3}
                    placeholder="e.g. Focus on progressive overload protocols for this movement..."
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions-row">
                <Button variant="ghost" size="md" onClick={handleCloseAssignModal} disabled={assignSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={assignSubmitting || !assignTrainerId}
                  icon={Sparkles}
                >
                  {assignSubmitting ? 'Assigning Exercise...' : 'Assign Exercise to Coach'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* MODAL 7: RESET USER PASSWORD */}
        <Modal
          isOpen={resetPasswordModalOpen}
          onClose={() => {
            setResetPasswordModalOpen(false);
            setResetPasswordTarget(null);
          }}
          title={`Reset Password: ${resetPasswordTarget?.name || 'User Account'}`}
          subtitle={`Set a new secure password for ${resetPasswordTarget?.email} (${resetPasswordTarget?.role}).`}
          size="sm"
        >
          <form onSubmit={handleSubmitResetPassword}>
            {resetError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{resetError}</span>
              </div>
            )}

            <div className="form-field" style={{ marginBottom: '1.5rem' }}>
              <label className="field-label">New Password * (Min 6 characters)</label>
              <div className="password-input-wrapper">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="field-input"
                  placeholder="Enter new strong password"
                  value={newPasswordValue}
                  onChange={(e) => {
                    setNewPasswordValue(e.target.value);
                    setResetError('');
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  title={showResetPassword ? 'Hide password' : 'Show password'}
                >
                  {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => {
                  setResetPasswordModalOpen(false);
                  setResetPasswordTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={resetSubmitting}>
                {resetSubmitting ? 'Updating...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 8: ACCOUNT ACTIVATION / DEACTIVATION CONFIRMATION */}
        <Modal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setStatusTarget(null);
          }}
          title={
            statusTarget?.targetStatus === 'active'
              ? `Activate Account: ${statusTarget?.name}`
              : `Deactivate Account: ${statusTarget?.name}`
          }
          subtitle={`Confirm account status update for ${statusTarget?.email} (${statusTarget?.role}).`}
          size="sm"
        >
          <div>
            {statusError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{statusError}</span>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {statusTarget?.targetStatus === 'inactive' ? (
                <>
                  <p style={{ marginBottom: '0.75rem' }}>
                    Are you sure you want to deactivate the account for{' '}
                    <strong style={{ color: '#ffffff' }}>{statusTarget?.name}</strong>?
                  </p>
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      color: '#fbbf24',
                      fontSize: '0.85rem',
                    }}
                  >
                    <strong>Note:</strong> Deactivating will prevent this user from logging in. All historical workout records, memberships, and assigned data will remain intact.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: '0.75rem' }}>
                    Are you sure you want to reactivate the account for{' '}
                    <strong style={{ color: '#ffffff' }}>{statusTarget?.name}</strong>?
                  </p>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      color: '#34d399',
                      fontSize: '0.85rem',
                    }}
                  >
                    <strong>Note:</strong> Reactivating will allow this user to log in and access their dashboard immediately.
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusTarget(null);
                }}
                disabled={statusSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={statusSubmitting}
                onClick={handleConfirmStatusChange}
                style={
                  statusTarget?.targetStatus === 'inactive'
                    ? { background: '#f59e0b', borderColor: '#f59e0b' }
                    : { background: '#10b981', borderColor: '#10b981' }
                }
              >
                {statusSubmitting
                  ? 'Processing...'
                  : statusTarget?.targetStatus === 'inactive'
                  ? 'Deactivate Account'
                  : 'Activate Account'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* MODAL 9: LOG / CREATE ATTENDANCE */}
        <Modal
          isOpen={createAttendanceModalOpen}
          onClose={() => setCreateAttendanceModalOpen(false)}
          title="Log Gym Attendance"
          subtitle="Record member check-in timestamp and attendance status."
          size="md"
        >
          <form onSubmit={handleSubmitCreateAttendance}>
            {attendanceModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{attendanceModalError}</span>
              </div>
            )}

            <div className="modal-form-grid">
              <div className="form-field modal-form-col-full">
                <label className="field-label">Select Member *</label>
                <select
                  className="field-select"
                  required
                  value={attendanceForm.memberId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, memberId: e.target.value })}
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.user?.name} ({m.user?.email}) - {m.membershipPlan?.name || 'No Plan'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Attendance Date *</label>
                <input
                  type="date"
                  required
                  className="field-input"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Attendance Status *</label>
                <select
                  className="field-select"
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                >
                  <option value="active">Active On Floor</option>
                  <option value="completed">Completed Session</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Check-In Time</label>
                <input
                  type="time"
                  className="field-input"
                  value={attendanceForm.checkInTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkInTime: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Check-Out Time (Optional)</label>
                <input
                  type="time"
                  className="field-input"
                  value={attendanceForm.checkOutTime}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOutTime: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Session Notes / Activity (Optional)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Legs & Core strength training, guest pass entry, etc."
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setCreateAttendanceModalOpen(false)}
                disabled={attendanceSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={attendanceSubmitting}>
                {attendanceSubmitting ? 'Logging...' : 'Save Attendance Record'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 10: EDIT / CORRECT ATTENDANCE */}
        <Modal
          isOpen={editAttendanceModalOpen}
          onClose={() => {
            setEditAttendanceModalOpen(false);
            setEditingAttendance(null);
          }}
          title={`Correct Attendance: ${editingAttendance?.member?.user?.name || 'Member'}`}
          subtitle="Adjust check-in/out timestamps, status, or session notes."
          size="md"
        >
          <form onSubmit={handleSubmitEditAttendance}>
            {editAttendanceModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{editAttendanceModalError}</span>
              </div>
            )}

            <div className="modal-form-grid">
              <div className="form-field">
                <label className="field-label">Attendance Date *</label>
                <input
                  type="date"
                  required
                  className="field-input"
                  value={editAttendanceForm.date}
                  onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, date: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Attendance Status *</label>
                <select
                  className="field-select"
                  value={editAttendanceForm.status}
                  onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, status: e.target.value })}
                >
                  <option value="active">Active On Floor</option>
                  <option value="completed">Completed Session</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Check-In Time</label>
                <input
                  type="time"
                  className="field-input"
                  value={editAttendanceForm.checkInTime}
                  onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, checkInTime: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Check-Out Time</label>
                <input
                  type="time"
                  className="field-input"
                  value={editAttendanceForm.checkOutTime}
                  onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, checkOutTime: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Session Notes</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Corrected manual check-out time..."
                  value={editAttendanceForm.notes}
                  onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => {
                  setEditAttendanceModalOpen(false);
                  setEditingAttendance(null);
                }}
                disabled={attendanceSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={attendanceSubmitting}>
                {attendanceSubmitting ? 'Saving Changes...' : 'Update Record'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 11: DELETE ATTENDANCE CONFIRMATION */}
        <Modal
          isOpen={deleteAttendanceModalOpen}
          onClose={() => {
            setDeleteAttendanceModalOpen(false);
            setDeleteAttendanceTarget(null);
          }}
          title="Delete Attendance Record"
          size="sm"
        >
          <div>
            {deleteAttendanceError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{deleteAttendanceError}</span>
              </div>
            )}

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Are you sure you want to delete the attendance record for{' '}
                <strong style={{ color: '#ffffff' }}>
                  {deleteAttendanceTarget?.member?.user?.name || 'this member'}
                </strong>{' '}
                on{' '}
                <strong style={{ color: '#ffffff' }}>
                  {deleteAttendanceTarget?.date ? new Date(deleteAttendanceTarget.date).toLocaleDateString() : ''}
                </strong>?
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Button
                  variant="ghost"
                  size="md"
                  type="button"
                  onClick={() => {
                    setDeleteAttendanceModalOpen(false);
                    setDeleteAttendanceTarget(null);
                  }}
                  disabled={attendanceSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  disabled={attendanceSubmitting}
                  onClick={handleConfirmDeleteAttendance}
                  style={{ background: '#ef4444', borderColor: '#ef4444' }}
                >
                  {attendanceSubmitting ? 'Deleting...' : 'Yes, Delete Record'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* MODAL 12: RECORD MANUAL OFFLINE PAYMENT */}
        <Modal
          isOpen={manualPaymentModalOpen}
          onClose={() => setManualPaymentModalOpen(false)}
          title="Record Manual / Offline Payment"
          subtitle="Log cash, direct UPI, or terminal card payments and immediately fulfill member subscription."
          size="lg"
        >
          <form onSubmit={handleSubmitManualPayment}>
            {manualPaymentModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{manualPaymentModalError}</span>
              </div>
            )}

            <div className="modal-form-grid">
              <div className="form-field modal-form-col-full">
                <label className="field-label">Select Member *</label>
                <select
                  className="field-select"
                  required
                  value={manualPaymentForm.memberId}
                  onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, memberId: e.target.value })}
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.user?.name} ({m.user?.email}) - Current: {m.membershipPlan?.name || 'No Plan'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Membership Package Tier</label>
                <select
                  className="field-select"
                  value={manualPaymentForm.planId}
                  onChange={(e) => handleManualPlanChange(e.target.value)}
                >
                  <option value="">-- No Package / Custom Item --</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (₹{p.price} / {p.duration} mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Payment Amount (INR ₹) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="field-input"
                  placeholder="e.g. 29.00"
                  value={manualPaymentForm.amount}
                  onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, amount: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Offline Payment Method *</label>
                <select
                  className="field-select"
                  value={manualPaymentForm.paymentMethod}
                  onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash (Front Desk)</option>
                  <option value="upi">UPI (Direct QR / PhonePe / GPay)</option>
                  <option value="card">Card (POS Swiped)</option>
                  <option value="bank_transfer">Bank Wire / IMPS</option>
                  <option value="other">Other Manual Settlement</option>
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Payment Date *</label>
                <input
                  type="date"
                  required
                  className="field-input"
                  value={manualPaymentForm.paymentDate}
                  onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, paymentDate: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Payment Purpose</label>
                <select
                  className="field-select"
                  value={manualPaymentForm.purpose}
                  onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, purpose: e.target.value })}
                >
                  <option value="membership">New Membership Subscription</option>
                  <option value="renewal">Membership Renewal / Extension</option>
                  <option value="other">Other Gym Dues</option>
                </select>
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Administrative Notes / Reference # (Optional)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Received by desk manager on duty, transaction reference number..."
                  value={manualPaymentForm.notes}
                  onChange={(e) => setManualPaymentForm({ ...manualPaymentForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setManualPaymentModalOpen(false)}
                disabled={manualPaymentSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={manualPaymentSubmitting}>
                {manualPaymentSubmitting ? 'Recording...' : 'Record Payment & Fulfill Plan'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 13: ADMIN PAYMENT RECEIPT INSPECTOR */}
        <Modal
          isOpen={adminReceiptModalOpen}
          onClose={() => {
            setAdminReceiptModalOpen(false);
            setSelectedAdminReceipt(null);
          }}
          title="Payment Audit Receipt"
          subtitle="Cryptographically verified transaction record and ledger reference."
          size="md"
        >
          {selectedAdminReceipt && (
            <div className="receipt-view-container">
              <div className="receipt-header">
                <div>
                  <div className="receipt-brand-logo">
                    IRON<span>FORGE</span> GYM
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Admin Accounting Ledger
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge
                    variant={selectedAdminReceipt.status === 'paid' ? 'primary' : 'warning'}
                    size="md"
                  >
                    {selectedAdminReceipt.status.toUpperCase()}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Ref: {selectedAdminReceipt.receiptNumber}
                  </span>
                </div>
              </div>

              <div className="receipt-meta-grid">
                <div className="receipt-meta-item">
                  <label>Member Account</label>
                  <span>{selectedAdminReceipt.member?.user?.name || 'Athlete'}</span>
                </div>
                <div className="receipt-meta-item">
                  <label>Member Email</label>
                  <span>{selectedAdminReceipt.member?.user?.email || 'N/A'}</span>
                </div>
                <div className="receipt-meta-item">
                  <label>Transaction Date</label>
                  <span>
                    {selectedAdminReceipt.paymentDate
                      ? new Date(selectedAdminReceipt.paymentDate).toLocaleString()
                      : new Date(selectedAdminReceipt.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="receipt-meta-item">
                  <label>Payment Channel</label>
                  <span style={{ textTransform: 'capitalize' }}>
                    {selectedAdminReceipt.paymentMethod === 'razorpay' ? 'Razorpay Standard' : selectedAdminReceipt.paymentMethod}
                  </span>
                </div>
              </div>

              <table className="receipt-summary-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Duration</th>
                    <th style={{ textAlign: 'right' }}>Gross Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>
                      {selectedAdminReceipt.membershipPlan?.name || (selectedAdminReceipt.purpose === 'renewal' ? 'Membership Renewal' : 'Gym Membership')}
                    </td>
                    <td>
                      {selectedAdminReceipt.membershipPlan?.duration ? `${selectedAdminReceipt.membershipPlan.duration} Months` : 'Custom Term'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                      ₹{selectedAdminReceipt.amount}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="receipt-total-box">
                <span>Total Collected:</span>
                <span style={{ color: '#34d399', fontSize: '1.4rem' }}>
                  ₹{selectedAdminReceipt.amount} INR
                </span>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div><strong>Recorded By:</strong> {selectedAdminReceipt.recordedBy?.name || 'Gateway Callback'}</div>
                {selectedAdminReceipt.razorpayOrderId && (
                  <div><strong>Razorpay Order ID:</strong> {selectedAdminReceipt.razorpayOrderId}</div>
                )}
                {selectedAdminReceipt.razorpayPaymentId && (
                  <div><strong>Razorpay Payment ID:</strong> {selectedAdminReceipt.razorpayPaymentId}</div>
                )}
                {selectedAdminReceipt.notes && (
                  <div style={{ marginTop: '0.35rem' }}><strong>Notes:</strong> {selectedAdminReceipt.notes}</div>
                )}
              </div>

              <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setAdminReceiptModalOpen(false);
                    setSelectedAdminReceipt(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL 14: EDIT PAYMENT NOTES */}
        <Modal
          isOpen={editPaymentNotesModalOpen}
          onClose={() => {
            setEditPaymentNotesModalOpen(false);
            setEditingPayment(null);
          }}
          title={`Edit Notes: Receipt ${editingPayment?.receiptNumber || ''}`}
          subtitle="Update administrative comments or accounting references."
          size="md"
        >
          <form onSubmit={handleSubmitEditPaymentNotes}>
            {editPaymentNotesError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{editPaymentNotesError}</span>
              </div>
            )}

            <div className="form-field">
              <label className="field-label">Accounting & Admin Notes</label>
              <textarea
                rows={4}
                className="field-input"
                placeholder="Add internal ledger or desk notes..."
                value={paymentNotesForm}
                onChange={(e) => setPaymentNotesForm(e.target.value)}
              />
            </div>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => {
                  setEditPaymentNotesModalOpen(false);
                  setEditingPayment(null);
                }}
                disabled={paymentNotesSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={paymentNotesSubmitting}>
                {paymentNotesSubmitting ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 15: ADMIN LOG / EDIT FITNESS PROGRESS */}
        <Modal
          isOpen={adminProgressModalOpen}
          onClose={() => setAdminProgressModalOpen(false)}
          title={adminEditingProgress ? 'Edit Fitness Progress Record' : 'Log Fitness Progress Record'}
          subtitle={
            adminEditingProgress
              ? 'Update body composition measurements and metrics for this athlete.'
              : 'Record new body composition measurements, weight, and fitness milestones.'
          }
          size="lg"
        >
          <form onSubmit={handleAdminSaveProgress}>
            {adminProgressError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{adminProgressError}</span>
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-field">
                <label className="field-label">Target Athlete *</label>
                <select
                  className="field-input"
                  value={adminProgressForm.memberId}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, memberId: e.target.value }))
                  }
                  required
                  disabled={!!adminEditingProgress}
                >
                  <option value="" disabled>Select athlete</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.user?.name || 'Athlete'} ({m.user?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Date Recorded *</label>
                <input
                  type="date"
                  className="field-input"
                  value={adminProgressForm.recordedAt}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, recordedAt: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label className="field-label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="500"
                  className="field-input"
                  placeholder="e.g. 75.5"
                  value={adminProgressForm.weight}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, weight: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Body Fat (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="75"
                  className="field-input"
                  placeholder="e.g. 15.2"
                  value={adminProgressForm.bodyFatPercentage}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({
                      ...prev,
                      bodyFatPercentage: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Chest Circumference (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 102"
                  value={adminProgressForm.chest}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, chest: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Waist Circumference (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 82"
                  value={adminProgressForm.waist}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, waist: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Hips Circumference (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 96"
                  value={adminProgressForm.hips}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, hips: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Arms Circumference (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 36.5"
                  value={adminProgressForm.arms}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, arms: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Thighs Circumference (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 58"
                  value={adminProgressForm.thighs}
                  onChange={(e) =>
                    setAdminProgressForm((prev) => ({ ...prev, thighs: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-field" style={{ marginTop: '0.5rem' }}>
              <label className="field-label">Progress & Training Notes</label>
              <textarea
                rows={3}
                className="field-input"
                placeholder="Add observations, PR milestones, physical conditioning notes..."
                value={adminProgressForm.notes}
                onChange={(e) =>
                  setAdminProgressForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={() => setAdminProgressModalOpen(false)}
                disabled={adminProgressSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={adminProgressSubmitting}>
                {adminProgressSubmitting
                  ? 'Saving...'
                  : adminEditingProgress
                  ? 'Update Progress'
                  : 'Save Progress Entry'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 16: CONFIRM DELETE FITNESS PROGRESS */}
        <Modal
          isOpen={deleteProgressModalOpen}
          onClose={() => setDeleteProgressModalOpen(false)}
          title="Delete Fitness Progress Record"
          subtitle="Are you sure you want to permanently delete this progress record?"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {deleteProgressError && (
              <div className="assignment-error-banner">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{deleteProgressError}</span>
              </div>
            )}

            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              This will remove the measurement recorded on{' '}
              <strong style={{ color: '#ffffff' }}>
                {deleteProgressTarget?.recordedAt
                  ? new Date(deleteProgressTarget.recordedAt).toLocaleDateString()
                  : 'N/A'}
              </strong>{' '}
              for{' '}
              <strong style={{ color: '#ffffff' }}>
                {deleteProgressTarget?.member?.user?.name || 'Athlete'}
              </strong>
              . This action cannot be undone.
            </p>

            <div className="modal-actions-row">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setDeleteProgressModalOpen(false)}
                disabled={adminProgressSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDeleteProgress}
                disabled={adminProgressSubmitting}
              >
                {adminProgressSubmitting ? 'Deleting...' : 'Delete Record'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
