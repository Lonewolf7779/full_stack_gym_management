import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  CreditCard,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Edit2,
  Sparkles,
  Shield,
  Dumbbell,
  Layers,
  Flame,
  Target,
  Activity,
  LogIn,
  LogOut,
  TrendingUp,
  CheckSquare,
  Timer,
  Receipt,
  Check,
  Zap,
  DollarSign,
  TrendingDown,
  Plus,
  Trash2,
  LineChart,
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
  trainingPlansApi,
  attendanceApi,
  membershipPlansApi,
  paymentsApi,
  progressApi,
} from '../../services/api';
import './MemberDashboard.css';
import '../admin/AdminDashboard.css';

export default function MemberDashboard() {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [assignedExercises, setAssignedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Attendance States
  const [todayStatus, setTodayStatus] = useState({
    isCheckedIn: false,
    isCompleted: false,
    attendance: null,
  });
  const [todayLoading, setTodayLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    thisMonthDays: 0,
    currentMonthPercentage: 0,
    completedSessions: 0,
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Payments & Membership Billing States
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsSummary, setPaymentsSummary] = useState({
    totalSpent: 0,
    totalPaidTransactions: 0,
  });
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Fitness Progress & Body Composition States
  const [progressRecords, setProgressRecords] = useState([]);
  const [progressStats, setProgressStats] = useState({
    totalRecords: 0,
    currentWeight: null,
    startingWeight: null,
    weightChange: null,
    currentBodyFat: null,
    startingBodyFat: null,
    bodyFatChange: null,
    latestChest: null,
    latestWaist: null,
    latestHips: null,
    latestArms: null,
    latestThighs: null,
    lastRecordedDate: null,
  });
  const [trendPoints, setTrendPoints] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [editingProgressId, setEditingProgressId] = useState(null);
  const [progressForm, setProgressForm] = useState({
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
  const [progressError, setProgressError] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);

  // Edit Profile Modal
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    gender: 'unspecified',
    dateOfBirth: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadProgressHistory = useCallback(async () => {
    try {
      setLoadingProgress(true);
      const res = await progressApi.getMyProgress();
      if (res) {
        setProgressRecords(res.records || []);
        if (res.stats) setProgressStats(res.stats);
        if (res.trendPoints) setTrendPoints(res.trendPoints);
      }
    } catch (err) {
      console.warn('[Progress] Error fetching progress history:', err.message);
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  const loadMemberData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardApi.getMemberData();
      setDashboardData(data);
      setActivePlan(data.activeTrainingPlan || null);
      setAssignedExercises(data.assignedExercises || []);

      if (data.member) {
        setProfileForm({
          name: data.member.user?.name || '',
          phone: data.member.phone || '',
          gender: data.member.gender || 'unspecified',
          dateOfBirth: data.member.dateOfBirth ? data.member.dateOfBirth.split('T')[0] : '',
          address: data.member.address || '',
          emergencyName: data.member.emergencyContact?.name || '',
          emergencyPhone: data.member.emergencyContact?.phone || '',
          emergencyRelation: data.member.emergencyContact?.relation || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load member dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTodayStatus = useCallback(async () => {
    try {
      setTodayLoading(true);
      const res = await attendanceApi.getTodayStatus();
      setTodayStatus(res || { isCheckedIn: false, isCompleted: false, attendance: null });
    } catch (err) {
      console.warn('[Attendance] Error fetching today status:', err.message);
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const loadAttendanceHistory = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const res = await attendanceApi.getMyAttendance();
      if (res) {
        setAttendanceRecords(res.records || []);
        if (res.stats) setAttendanceStats(res.stats);
      }
    } catch (err) {
      console.warn('[Attendance] Error fetching history:', err.message);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const loadPaymentHistory = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const res = await paymentsApi.getMyPayments();
      if (res) {
        setPaymentsList(res.payments || []);
        if (res.summary) setPaymentsSummary(res.summary);
      }
    } catch (err) {
      console.warn('[Payments] Error fetching payment history:', err.message);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const loadAvailablePlans = useCallback(async () => {
    try {
      const res = await membershipPlansApi.getAll();
      const activeOnly = (res || []).filter((p) => p.status === 'active');
      setAvailablePlans(activeOnly);
      if (activeOnly.length > 0 && !selectedPlanForPurchase) {
        setSelectedPlanForPurchase(activeOnly[0]);
      }
    } catch (err) {
      console.warn('[Plans] Error fetching membership plans:', err.message);
    }
  }, [selectedPlanForPurchase]);

  useEffect(() => {
    loadMemberData();
    loadTodayStatus();
    loadAttendanceHistory();
    loadPaymentHistory();
    loadAvailablePlans();
    loadProgressHistory();
  }, [loadMemberData, loadTodayStatus, loadAttendanceHistory, loadPaymentHistory, loadAvailablePlans, loadProgressHistory]);

  const handleOpenAddProgress = () => {
    setEditingProgressId(null);
    setProgressError('');
    setProgressForm({
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
    setProgressModalOpen(true);
  };

  const handleOpenEditProgress = (record) => {
    setEditingProgressId(record._id);
    setProgressError('');
    setProgressForm({
      weight: record.weight !== null && record.weight !== undefined ? record.weight : '',
      bodyFatPercentage: record.bodyFatPercentage !== null && record.bodyFatPercentage !== undefined ? record.bodyFatPercentage : '',
      chest: record.chest !== null && record.chest !== undefined ? record.chest : '',
      waist: record.waist !== null && record.waist !== undefined ? record.waist : '',
      hips: record.hips !== null && record.hips !== undefined ? record.hips : '',
      arms: record.arms !== null && record.arms !== undefined ? record.arms : '',
      thighs: record.thighs !== null && record.thighs !== undefined ? record.thighs : '',
      notes: record.notes || '',
      recordedAt: record.recordedAt ? record.recordedAt.split('T')[0] : '',
    });
    setProgressModalOpen(true);
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    setProgressError('');
    setSavingProgress(true);

    try {
      const payload = {
        weight: progressForm.weight !== '' ? Number(progressForm.weight) : undefined,
        bodyFatPercentage: progressForm.bodyFatPercentage !== '' ? Number(progressForm.bodyFatPercentage) : undefined,
        chest: progressForm.chest !== '' ? Number(progressForm.chest) : undefined,
        waist: progressForm.waist !== '' ? Number(progressForm.waist) : undefined,
        hips: progressForm.hips !== '' ? Number(progressForm.hips) : undefined,
        arms: progressForm.arms !== '' ? Number(progressForm.arms) : undefined,
        thighs: progressForm.thighs !== '' ? Number(progressForm.thighs) : undefined,
        notes: progressForm.notes,
        recordedAt: progressForm.recordedAt || undefined,
      };

      if (editingProgressId) {
        await progressApi.update(editingProgressId, payload);
        setSuccessMessage('Fitness progress record updated successfully.');
      } else {
        await progressApi.create(payload);
        setSuccessMessage('New fitness progress recorded successfully.');
      }

      setProgressModalOpen(false);
      loadProgressHistory();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setProgressError(err.message || 'Failed to save fitness progress.');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleDeleteProgress = async (id) => {
    try {
      await progressApi.delete(id);
      setSuccessMessage('Fitness record deleted.');
      loadProgressHistory();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete record.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Load Razorpay Checkout Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Online Payment via Razorpay Standard Checkout
  const handleInitiatePayment = async (planToBuy) => {
    const targetPlan = planToBuy || selectedPlanForPurchase;
    if (!targetPlan) {
      setError('Please select a membership plan to continue.');
      return;
    }

    try {
      setPaymentProcessing(true);
      setError('');

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Could not initialize Razorpay checkout script. Please check connection.');
        setPaymentProcessing(false);
        return;
      }

      // 1. Create order on backend (authoritative pricing)
      const orderData = await paymentsApi.createOrder({ planId: targetPlan._id });

      // 2. Open official Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'IronForge Gym',
        description: `Membership - ${orderData.plan?.name || targetPlan.name}`,
        order_id: orderData.orderId,
        prefill: {
          name: dashboardData?.member?.user?.name || user?.name || '',
          email: dashboardData?.member?.user?.email || user?.email || '',
          contact: dashboardData?.member?.phone || '',
        },
        notes: {
          memberId: dashboardData?.member?._id,
          planId: targetPlan._id,
        },
        theme: {
          color: '#ff4d00',
        },
        handler: async function (response) {
          try {
            // 3. Server-side signature verification & fulfillment
            await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            flashMessage('Payment confirmed & verified! Your membership is active.');
            setRenewModalOpen(false);
            await Promise.all([loadMemberData(), loadPaymentHistory()]);
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment signature verification failed.');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failResp) {
        setError(`Payment could not be completed: ${failResp.error?.description || 'Transaction failed'}`);
        setPaymentProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Failed to initiate payment.');
      setPaymentProcessing(false);
    }
  };

  const flashMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      setError('');
      const res = await attendanceApi.checkIn();
      flashMessage(res.message || 'Checked in successfully. Have a great workout!');
      await Promise.all([loadTodayStatus(), loadAttendanceHistory()]);
    } catch (err) {
      setError(err.message || 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckOutLoading(true);
      setError('');
      const res = await attendanceApi.checkOut();
      flashMessage(res.message || 'Checked out successfully. Session recorded!');
      await Promise.all([loadTodayStatus(), loadAttendanceHistory()]);
    } catch (err) {
      setError(err.message || 'Check-out failed');
    } finally {
      setCheckOutLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (inStr, outStr) => {
    if (!inStr) return 'N/A';
    const start = new Date(inStr);
    const end = outStr ? new Date(outStr) : new Date();
    const diffMs = Math.max(0, end - start);
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!dashboardData?.member?._id) return;
    try {
      setSubmitting(true);
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        gender: profileForm.gender,
        dateOfBirth: profileForm.dateOfBirth || null,
        address: profileForm.address,
        emergencyContact: {
          name: profileForm.emergencyName,
          phone: profileForm.emergencyPhone,
          relation: profileForm.emergencyRelation,
        },
      };

      await membersApi.update(dashboardData.member._id, payload);
      flashMessage('Your personal profile has been updated successfully.');
      setEditProfileModalOpen(false);
      await loadMemberData();
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  const member = dashboardData?.member;
  const membership = dashboardData?.membership;
  const trainer = dashboardData?.trainer;

  // Calculate training plan summary metrics
  const totalExercises = activePlan?.exercises?.length || 0;
  const totalSets = activePlan?.exercises?.reduce((acc, curr) => acc + (curr.sets || 0), 0) || 0;

  const renderWeightTrendChart = () => {
    const validPoints = (trendPoints || []).filter(
      (p) => p.weight !== null && p.weight !== undefined && Number.isFinite(p.weight)
    );

    if (validPoints.length < 2) {
      return (
        <div className="trend-empty-placeholder">
          <LineChart size={28} className="text-muted" />
          <p>Log at least 2 weight entries to render your interactive trend line chart.</p>
        </div>
      );
    }

    const weights = validPoints.map((p) => p.weight);
    const minW = Math.floor(Math.min(...weights) - 2);
    const maxW = Math.ceil(Math.max(...weights) + 2);
    const range = maxW - minW || 1;

    const width = 640;
    const height = 180;
    const padLeft = 45;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 35;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const points = validPoints.map((p, i) => {
      const x = padLeft + i * (plotW / (validPoints.length - 1));
      const y = padTop + plotH - ((p.weight - minW) / range) * plotH;
      return { ...p, x, y };
    });

    const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPathStr =
      `M ${points[0].x} ${padTop + plotH} ` +
      points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
      ` L ${points[points.length - 1].x} ${padTop + plotH} Z`;

    return (
      <div className="progress-trend-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="progress-trend-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6a26" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ff6a26" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1={padLeft} y1={padTop + plotH / 2} x2={width - padRight} y2={padTop + plotH / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1={padLeft} y1={padTop + plotH} x2={width - padRight} y2={padTop + plotH} stroke="rgba(255,255,255,0.12)" />

          {/* Y Axis Labels */}
          <text x={padLeft - 8} y={padTop + 4} textAnchor="end" fill="var(--text-muted)" fontSize="11">{maxW}kg</text>
          <text x={padLeft - 8} y={padTop + plotH / 2 + 4} textAnchor="end" fill="var(--text-muted)" fontSize="11">{((maxW + minW) / 2).toFixed(1)}kg</text>
          <text x={padLeft - 8} y={padTop + plotH + 4} textAnchor="end" fill="var(--text-muted)" fontSize="11">{minW}kg</text>

          {/* Area fill */}
          <path d={areaPathStr} fill="url(#weightAreaGrad)" />

          {/* Trend Polyline */}
          <polyline fill="none" stroke="#ff6a26" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={polylineStr} />

          {/* Data points */}
          {points.map((pt, idx) => (
            <g key={idx} className="chart-node-group">
              <circle cx={pt.x} cy={pt.y} r="5" fill="#ff6a26" stroke="#0b0f19" strokeWidth="2" />
              <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                {pt.weight}kg
              </text>
              <text x={pt.x} y={padTop + plotH + 20} textAnchor="middle" fill="var(--text-muted)" fontSize="10">
                {new Date(pt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Success Alert */}
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

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Member Welcome Card */}
        <Card className="member-welcome-card glass-panel" padding="none">
          <div className="member-welcome-left">
            <div className="member-avatar-large">
              <UserCheck size={36} />
            </div>
            <div className="member-welcome-info">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                <Badge variant="primary" size="md">
                  ATHLETE PORTAL
                </Badge>
                <span className={`status-pill status-${member?.status || 'active'}`}>
                  {member?.status || 'active'}
                </span>
              </div>
              <h1>Welcome, {member?.user?.name || user?.name}!</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Member ID:{' '}
                <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {member?._id}
                </span>
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={() => setEditProfileModalOpen(true)}
          >
            Edit Profile
          </Button>
        </Card>

        {/* TODAY'S ATTENDANCE CHECK-IN / CHECK-OUT WIDGET */}
        <Card className="attendance-widget-card glass-panel" padding="none">
          <div className="attendance-widget-inner">
            <div className="attendance-widget-left">
              <div
                className={`attendance-widget-icon ${
                  todayStatus.isCompleted
                    ? 'completed'
                    : todayStatus.isCheckedIn
                    ? 'active'
                    : 'idle'
                }`}
              >
                {todayStatus.isCompleted ? (
                  <CheckCircle2 size={30} />
                ) : todayStatus.isCheckedIn ? (
                  <Activity size={30} />
                ) : (
                  <Clock size={30} />
                )}
              </div>
              <div className="attendance-widget-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                    Daily Check-In Pass
                  </span>
                  {todayStatus.isCompleted ? (
                    <Badge variant="primary" size="sm">Session Completed</Badge>
                  ) : todayStatus.isCheckedIn ? (
                    <span className="status-pill status-active">Currently Checked In</span>
                  ) : (
                    <Badge variant="outline" size="sm">Not Checked In</Badge>
                  )}
                </div>
                <h3>
                  {todayStatus.isCompleted
                    ? "Great job! You've completed today's gym session."
                    : todayStatus.isCheckedIn
                    ? 'Your workout session is active on the gym floor.'
                    : 'Ready to crush today’s workout? Check in to IronForge.'}
                </h3>
                <div className="attendance-widget-meta">
                  {todayStatus.isCheckedIn && (
                    <>
                      <span className="attendance-meta-chip">
                        <LogIn size={13} className="text-highlight" />
                        Check-in: <strong>{formatTime(todayStatus.attendance?.checkInTime)}</strong>
                      </span>
                      {todayStatus.isCompleted ? (
                        <>
                          <span className="attendance-meta-chip">
                            <LogOut size={13} className="text-highlight" />
                            Check-out: <strong>{formatTime(todayStatus.attendance?.checkOutTime)}</strong>
                          </span>
                          <span className="attendance-meta-chip">
                            <Timer size={13} className="text-highlight" />
                            Duration: <strong>{calculateDuration(todayStatus.attendance?.checkInTime, todayStatus.attendance?.checkOutTime)}</strong>
                          </span>
                        </>
                      ) : (
                        <span className="attendance-meta-chip">
                          <Timer size={13} className="text-highlight" />
                          Elapsed: <strong>{calculateDuration(todayStatus.attendance?.checkInTime, null)}</strong>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              {!todayStatus.isCheckedIn ? (
                <Button
                  variant="primary"
                  size="md"
                  icon={LogIn}
                  onClick={handleCheckIn}
                  disabled={checkInLoading || todayLoading}
                >
                  {checkInLoading ? 'Checking In...' : 'Check In Now'}
                </Button>
              ) : !todayStatus.isCompleted ? (
                <Button
                  variant="secondary"
                  size="md"
                  icon={LogOut}
                  onClick={handleCheckOut}
                  disabled={checkOutLoading || todayLoading}
                >
                  {checkOutLoading ? 'Checking Out...' : 'Check Out Session'}
                </Button>
              ) : (
                <Badge variant="primary" size="md" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} style={{ marginRight: '0.35rem' }} /> Session Recorded
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Main 2-Column Dashboard Grid */}
        <div className="member-dashboard-grid">
          {/* LEFT: MY MEMBERSHIP PACKAGE */}
          <Card className="glass-panel" padding="normal">
            <div className="card-title-header">
              <h3>
                <CreditCard size={20} className="text-highlight" /> My Membership Tier
              </h3>
              {membership?.plan ? (
                <Badge variant="primary" size="sm">
                  {membership.plan.name}
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  No Plan
                </Badge>
              )}
            </div>

            {membership?.plan ? (
              <div>
                <div className="membership-plan-headline">
                  <div>
                    <h2 className="membership-plan-name">{membership.plan.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {membership.plan.description || 'Full-access gym membership tier.'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '1.8rem',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        color: '#ffffff',
                      }}
                    >
                      ₹{membership.plan.price}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {' '}
                      / {membership.plan.duration} mo
                    </span>
                  </div>
                </div>

                {/* Expiry Countdown Box */}
                <div className="days-counter-box">
                  <div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        display: 'block',
                      }}
                    >
                      Access Remaining
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Valid until{' '}
                      {membership.endDate
                        ? new Date(membership.endDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`days-count-num ${
                        membership.isExpiringSoon ? 'expiring-soon' : ''
                      }`}
                    >
                      {membership.daysRemaining}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                      Days Left
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={Zap}
                    onClick={() => setRenewModalOpen(true)}
                    style={{ width: '100%' }}
                  >
                    Renew / Upgrade Membership Tier
                  </Button>
                </div>

                {/* Plan Features */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Included Amenities & Benefits:
                  </h4>
                  <ul
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.92rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {membership.plan.features?.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="empty-state-box">
                <div className="empty-state-icon">
                  <CreditCard size={28} />
                </div>
                <span className="empty-state-title">No Active Membership Plan</span>
                <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
                  Choose an official IronForge membership package to unlock full gym floor access.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  icon={Zap}
                  onClick={() => setRenewModalOpen(true)}
                >
                  Choose Membership Plan
                </Button>
              </div>
            )}
          </Card>

          {/* RIGHT: MY COACH & PROFILE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {/* MY ASSIGNED TRAINER */}
            <Card className="glass-panel" padding="normal">
              <div className="card-title-header">
                <h3>
                  <Award size={20} className="text-highlight" /> My Assigned Coach
                </h3>
              </div>

              {trainer ? (
                <div className="trainer-assigned-box">
                  <div className="trainer-card-header-row">
                    <div className="trainer-avatar-sm">
                      <Award size={24} />
                    </div>
                    <div>
                      <h4>{trainer.user?.name}</h4>
                      <Badge variant="outline" size="sm">
                        {trainer.specialization}
                      </Badge>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                    }}
                  >
                    {trainer.bio ||
                      'Your assigned coach for personalized workout guidance and routine optimization.'}
                  </p>

                  <div
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Phone size={14} className="text-highlight" />
                      <span>{trainer.phone || 'Available on gym floor'}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Mail size={14} className="text-highlight" />
                      <span>{trainer.user?.email}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state-box" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-state-icon">
                    <Award size={24} />
                  </div>
                  <span className="empty-state-title" style={{ fontSize: '1rem' }}>
                    No Personal Coach Assigned
                  </span>
                  <p style={{ fontSize: '0.82rem' }}>
                    You are currently on independent gym access. Request coach assignment from
                    administration.
                  </p>
                </div>
              )}
            </Card>

            {/* MY PERSONAL PROFILE OVERVIEW */}
            <Card className="glass-panel" padding="normal">
              <div className="card-title-header">
                <h3>
                  <UserCheck size={20} className="text-highlight" /> Personal Details
                </h3>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.4rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                  <span style={{ fontWeight: 600 }}>{member?.user?.email}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.4rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                  <span>{member?.phone || 'Not provided'}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.4rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Gender:</span>
                  <span style={{ textTransform: 'capitalize' }}>
                    {member?.gender || 'Unspecified'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.4rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
                  <span>
                    {member?.emergencyContact?.name
                      ? `${member.emergencyContact.name} (${
                          member.emergencyContact.relation || 'Emergency'
                        })`
                      : 'None'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* SECTION: MY TRAINING PLAN & WORKOUT ROUTINE */}
        <div className="member-workout-section">
          <div className="card-title-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Dumbbell size={26} className="text-highlight" /> My Training Plan & Routine
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Personalized workout regimen assigned by your IronForge personal coach.
              </p>
            </div>
            {activePlan && (
              <Badge variant="secondary" size="md">
                Active Routine
              </Badge>
            )}
          </div>

          {activePlan ? (
            <div>
              {/* Routine Hero Banner */}
              <div className="workout-routine-hero">
                <div className="workout-routine-hero-left">
                  <div className="workout-icon-badge">
                    <Flame size={30} />
                  </div>
                  <div>
                    <h3 className="workout-routine-title">{activePlan.planName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Badge variant="outline" size="sm">
                        Focus: {activePlan.goal}
                      </Badge>
                      <span className="workout-routine-dates">
                        Coach: <strong>{activePlan.trainer?.user?.name || 'Personal Coach'}</strong>
                      </span>
                      <span className="workout-routine-dates">
                        Valid:{' '}
                        {activePlan.startDate
                          ? new Date(activePlan.startDate).toLocaleDateString()
                          : 'Ongoing'}{' '}
                        &rarr;{' '}
                        {activePlan.endDate
                          ? new Date(activePlan.endDate).toLocaleDateString()
                          : 'Ongoing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="workout-metrics-bar">
                <div className="workout-metric-item">
                  <span className="workout-metric-label">Total Exercises</span>
                  <span className="workout-metric-val">{totalExercises} Movements</span>
                </div>
                <div className="workout-metric-item">
                  <span className="workout-metric-label">Total Volume Sets</span>
                  <span className="workout-metric-val">{totalSets} Working Sets</span>
                </div>
                <div className="workout-metric-item">
                  <span className="workout-metric-label">Primary Objective</span>
                  <span className="workout-metric-val" style={{ color: 'var(--primary)' }}>
                    {activePlan.goal}
                  </span>
                </div>
              </div>

              {/* Coach Notes */}
              {activePlan.notes && (
                <div
                  style={{
                    background: 'rgba(255, 77, 0, 0.08)',
                    border: '1px solid rgba(255, 77, 0, 0.25)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--primary)',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Coach's Form & Nutrition Instructions:
                  </span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5' }}>
                    {activePlan.notes}
                  </p>
                </div>
              )}

              {/* Exercises Cards Grid */}
              <div className="member-exercise-cards-grid">
                {activePlan.exercises?.map((item, idx) => (
                  <div key={idx} className="member-exercise-card">
                    <div>
                      <div className="member-exercise-card-header">
                        <div>
                          <h4 className="member-exercise-card-title">
                            {idx + 1}. {item.exercise?.name || 'Exercise Movement'}
                          </h4>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.exercise?.muscleGroup} &bull; {item.exercise?.category}
                          </span>
                        </div>
                        <Badge variant="outline" size="sm">
                          {item.exercise?.equipment || 'Bodyweight'}
                        </Badge>
                      </div>

                      <div className="member-exercise-target-grid" style={{ margin: '1rem 0' }}>
                        <div>
                          <span className="member-target-box-label">Sets</span>
                          <span className="member-target-box-val">{item.sets}</span>
                        </div>
                        <div>
                          <span className="member-target-box-label">Reps</span>
                          <span className="member-target-box-val">{item.reps}</span>
                        </div>
                        <div>
                          <span className="member-target-box-label">Rest</span>
                          <span className="member-target-box-val" style={{ fontSize: '0.95rem' }}>
                            {item.restTime}s
                          </span>
                        </div>
                      </div>

                      {item.targetWeight > 0 && (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Target Working Load:</span>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>
                            {item.targetWeight} kg / lbs
                          </span>
                        </div>
                      )}

                      {item.duration > 0 && (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Target Duration:</span>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>
                            {item.duration} seconds
                          </span>
                        </div>
                      )}

                      {item.instructions && (
                        <p className="member-exercise-instructions">
                          &ldquo;{item.instructions}&rdquo;
                        </p>
                      )}
                    </div>

                    {item.exercise?.instructions?.length > 0 && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '0.75rem',
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <strong>Movement Cue:</strong> {item.exercise.instructions[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* SECTION: DIRECT MOVEMENTS PRESCRIBED BY COACH */}
          {assignedExercises && assignedExercises.length > 0 && (
            <div style={{ marginTop: activePlan ? '2rem' : '0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.5rem',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <Sparkles size={18} className="text-highlight" /> Direct Movements Prescribed by Coach
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Individual target exercises assigned directly to you by your personal trainer.
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  {assignedExercises.length} Prescribed
                </Badge>
              </div>

              <div className="member-exercise-cards-grid">
                {assignedExercises.map((item, idx) => (
                  <div key={item._id || idx} className="member-exercise-card" style={{ borderLeft: '3px solid var(--primary)' }}>
                    <div>
                      <div className="member-exercise-card-header">
                        <div>
                          <h4 className="member-exercise-card-title">
                            {item.exercise?.name || 'Assigned Movement'}
                          </h4>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.exercise?.muscleGroup} &bull; {item.exercise?.category}
                          </span>
                        </div>
                        <Badge variant="outline" size="sm">
                          {item.exercise?.equipment || 'Bodyweight'}
                        </Badge>
                      </div>

                      <div className="member-exercise-target-grid" style={{ margin: '1rem 0' }}>
                        <div>
                          <span className="member-target-box-label">Sets</span>
                          <span className="member-target-box-val">{item.sets}</span>
                        </div>
                        <div>
                          <span className="member-target-box-label">Reps</span>
                          <span className="member-target-box-val">{item.reps}</span>
                        </div>
                        <div>
                          <span className="member-target-box-label">Rest</span>
                          <span className="member-target-box-val" style={{ fontSize: '0.95rem' }}>
                            {item.restTime}s
                          </span>
                        </div>
                      </div>

                      {item.targetWeight > 0 && (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Target Working Load:</span>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>
                            {item.targetWeight} kg / lbs
                          </span>
                        </div>
                      )}

                      {item.duration > 0 && (
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.75rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Target Duration:</span>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>
                            {item.duration} seconds
                          </span>
                        </div>
                      )}

                      {item.instructions && (
                        <div
                          style={{
                            background: 'rgba(255, 77, 0, 0.06)',
                            border: '1px solid rgba(255, 77, 0, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.6rem 0.8rem',
                            marginBottom: '0.75rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.2rem', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                            Coach Directive:
                          </strong>
                          &ldquo;{item.instructions}&rdquo;
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '0.6rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        <span>Prescribed by: {item.trainer?.user?.name || 'Coach'}</span>
                        <span>{item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State when neither plan nor assigned exercises exist */}
          {!activePlan && (!assignedExercises || assignedExercises.length === 0) && (
            <Card className="glass-panel" padding="normal">
              <div className="empty-state-box">
                <div className="empty-state-icon">
                  <Dumbbell size={32} />
                </div>
                <span className="empty-state-title">No Workout Plan or Movements Assigned Yet</span>
                <p style={{ maxWidth: '480px', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Your assigned coach will evaluate your fitness assessment and assign custom
                  workout routines or specific movement targets with prescribed sets and repetitions shortly.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* SECTION: MY ATTENDANCE RECORD & VISIT STATS */}
        <div className="attendance-history-section">
          <div className="card-title-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={26} className="text-highlight" /> My Attendance & Gym Visits
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Track your consistency, check-in history, and gym workout sessions.
              </p>
            </div>
            <Badge variant="primary" size="md">
              {attendanceStats.thisMonthDays} Visits This Month
            </Badge>
          </div>

          {/* 4 Attendance Metrics */}
          <div className="attendance-stats-grid">
            <div className="attendance-stat-box">
              <span className="attendance-stat-label">Month Attendance Rate</span>
              <span className="attendance-stat-value" style={{ color: '#34d399' }}>
                {attendanceStats.currentMonthPercentage}%
              </span>
              <span className="attendance-stat-sub">Based on days passed this month</span>
            </div>

            <div className="attendance-stat-box">
              <span className="attendance-stat-label">This Month Visits</span>
              <span className="attendance-stat-value" style={{ color: '#00e5ff' }}>
                {attendanceStats.thisMonthDays} Days
              </span>
              <span className="attendance-stat-sub">Current calendar month</span>
            </div>

            <div className="attendance-stat-box">
              <span className="attendance-stat-label">Completed Sessions</span>
              <span className="attendance-stat-value" style={{ color: 'var(--primary)' }}>
                {attendanceStats.completedSessions}
              </span>
              <span className="attendance-stat-sub">Checked out successfully</span>
            </div>

            <div className="attendance-stat-box">
              <span className="attendance-stat-label">Lifetime Total Visits</span>
              <span className="attendance-stat-value">
                {attendanceStats.totalDays} Days
              </span>
              <span className="attendance-stat-sub">All-time gym check-ins</span>
            </div>
          </div>

          {/* Attendance History Table */}
          <Card className="glass-panel" padding="none">
            {attendanceRecords && attendanceRecords.length > 0 ? (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-In Time</th>
                      <th>Check-Out Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((rec) => (
                      <tr key={rec._id}>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>
                          {rec.date ? new Date(rec.date).toLocaleDateString() : 'N/A'}
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
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {rec.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box" style={{ padding: '2.5rem 1rem' }}>
                <div className="empty-state-icon">
                  <Clock size={28} />
                </div>
                <span className="empty-state-title">No Attendance Records Found</span>
                <p style={{ fontSize: '0.88rem' }}>
                  Use the Daily Check-In button above when you arrive at IronForge to start tracking your visits!
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* SECTION: FITNESS PROGRESS & BODY COMPOSITION TRACKING */}
        <div className="member-progress-section" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="card-title-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={26} className="text-highlight" /> Fitness Progress & Body Composition
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Track your weight evolution, body composition reduction, and circumference milestones.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={loadProgressHistory}
                disabled={loadingProgress}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddProgress}
              >
                Log Metrics
              </Button>
            </div>
          </div>

          {/* 4 Summary Stats Metric Cards */}
          <div className="progress-stats-grid">
            <div className="progress-stat-box">
              <span className="progress-stat-label">Current Weight</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="progress-stat-value" style={{ color: '#ffffff' }}>
                  {progressStats.currentWeight !== null ? `${progressStats.currentWeight} kg` : '—'}
                </span>
                {progressStats.weightChange !== null && (
                  <span
                    className={`stat-delta-badge ${progressStats.weightChange <= 0 ? 'loss' : 'gain'}`}
                    title="Weight change since first logged record"
                  >
                    {progressStats.weightChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {progressStats.weightChange > 0 ? `+${progressStats.weightChange}` : progressStats.weightChange} kg
                  </span>
                )}
              </div>
              <span className="progress-stat-sub">
                {progressStats.startingWeight !== null ? `Baseline: ${progressStats.startingWeight} kg` : 'No weight recorded yet'}
              </span>
            </div>

            <div className="progress-stat-box">
              <span className="progress-stat-label">Body Fat Percentage</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="progress-stat-value" style={{ color: '#00e5ff' }}>
                  {progressStats.currentBodyFat !== null ? `${progressStats.currentBodyFat}%` : '—'}
                </span>
                {progressStats.bodyFatChange !== null && (
                  <span
                    className={`stat-delta-badge ${progressStats.bodyFatChange <= 0 ? 'loss' : 'gain'}`}
                    title="Body fat change since baseline"
                  >
                    {progressStats.bodyFatChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {progressStats.bodyFatChange > 0 ? `+${progressStats.bodyFatChange}` : progressStats.bodyFatChange}%
                  </span>
                )}
              </div>
              <span className="progress-stat-sub">
                {progressStats.startingBodyFat !== null ? `Baseline: ${progressStats.startingBodyFat}%` : 'No body fat recorded'}
              </span>
            </div>

            <div className="progress-stat-box">
              <span className="progress-stat-label">Total Progress Entries</span>
              <span className="progress-stat-value" style={{ color: 'var(--primary)' }}>
                {progressStats.totalRecords} Logs
              </span>
              <span className="progress-stat-sub">
                {progressStats.lastRecordedDate
                  ? `Last: ${new Date(progressStats.lastRecordedDate).toLocaleDateString()}`
                  : 'Start tracking today'}
              </span>
            </div>

            <div className="progress-stat-box">
              <span className="progress-stat-label">Latest Circumferences</span>
              <div className="latest-circumferences-pills">
                <span>Chest: <strong>{progressStats.latestChest ? `${progressStats.latestChest}cm` : '—'}</strong></span>
                <span>Waist: <strong>{progressStats.latestWaist ? `${progressStats.latestWaist}cm` : '—'}</strong></span>
                <span>Arms: <strong>{progressStats.latestArms ? `${progressStats.latestArms}cm` : '—'}</strong></span>
                <span>Thighs: <strong>{progressStats.latestThighs ? `${progressStats.latestThighs}cm` : '—'}</strong></span>
              </div>
            </div>
          </div>

          {/* SVG Trend Chart Card */}
          <Card className="glass-panel" padding="normal" style={{ marginBottom: '1.25rem' }}>
            <div className="card-title-header" style={{ marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LineChart size={18} className="text-highlight" /> Weight Evolution Trendline
              </h3>
            </div>
            {renderWeightTrendChart()}
          </Card>

          {/* Progress Logs Table */}
          <Card className="glass-panel" padding="none">
            {progressRecords && progressRecords.length > 0 ? (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight</th>
                      <th>Body Fat</th>
                      <th>Measurements (Chest / Waist / Hips / Arms / Thighs)</th>
                      <th>Notes</th>
                      <th>Recorded By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressRecords.map((rec) => (
                      <tr key={rec._id}>
                        <td style={{ fontWeight: 600, color: '#ffffff' }}>
                          {rec.recordedAt ? new Date(rec.recordedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ fontWeight: 800, color: '#ffffff' }}>
                          {rec.weight !== null && rec.weight !== undefined ? `${rec.weight} kg` : '—'}
                        </td>
                        <td style={{ color: '#00e5ff', fontWeight: 700 }}>
                          {rec.bodyFatPercentage !== null && rec.bodyFatPercentage !== undefined ? `${rec.bodyFatPercentage}%` : '—'}
                        </td>
                        <td>
                          <span className="measurement-chips">
                            {rec.chest && <span>C: {rec.chest}cm</span>}
                            {rec.waist && <span>W: {rec.waist}cm</span>}
                            {rec.hips && <span>H: {rec.hips}cm</span>}
                            {rec.arms && <span>A: {rec.arms}cm</span>}
                            {rec.thighs && <span>T: {rec.thighs}cm</span>}
                            {!rec.chest && !rec.waist && !rec.hips && !rec.arms && !rec.thighs && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '200px' }}>
                          {rec.notes || '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {rec.recordedBy?.name || 'Self'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Edit2}
                              onClick={() => handleOpenEditProgress(rec)}
                              title="Edit record"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDeleteProgress(rec._id)}
                              title="Delete record"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box" style={{ padding: '2.5rem 1rem' }}>
                <div className="empty-state-icon">
                  <Scale size={28} />
                </div>
                <span className="empty-state-title">No Fitness Progress Records Yet</span>
                <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
                  Log your body weight and circumference metrics to visualize your transformation journey.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  icon={Plus}
                  onClick={handleOpenAddProgress}
                >
                  Log First Measurement
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* SECTION: MY BILLING & PAYMENT INVOICES */}
        <div className="member-billing-section">
          <div className="card-title-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={26} className="text-highlight" /> Membership Billing & Payments
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Review verified transaction receipts, subscription dues, and online invoice history.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Zap}
              onClick={() => setRenewModalOpen(true)}
            >
              Renew / Upgrade Tier
            </Button>
          </div>

          {/* 3 Billing Summary Metric Cards */}
          <div className="billing-stats-grid">
            <div className="billing-stat-box">
              <span className="billing-stat-label">Total Subscriptions Paid</span>
              <span className="billing-stat-value" style={{ color: '#34d399' }}>
                ₹{paymentsSummary.totalSpent || 0}
              </span>
              <span className="billing-stat-sub">Lifetime payments completed</span>
            </div>

            <div className="billing-stat-box">
              <span className="billing-stat-label">Invoices Issued</span>
              <span className="billing-stat-value" style={{ color: '#00e5ff' }}>
                {paymentsSummary.totalPaidTransactions || paymentsList.length} Records
              </span>
              <span className="billing-stat-sub">Paid & processed invoices</span>
            </div>

            <div className="billing-stat-box">
              <span className="billing-stat-label">Current Membership Tier</span>
              <span className="billing-stat-value" style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>
                {membership?.plan?.name || 'No Active Tier'}
              </span>
              <span className="billing-stat-sub">
                {membership?.plan ? `${membership.daysRemaining} days remaining` : 'Select a package to activate'}
              </span>
            </div>
          </div>

          {/* Payment History Invoices Table */}
          <Card className="glass-panel" padding="none">
            {paymentsList && paymentsList.length > 0 ? (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Plan / Item</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsList.map((pay) => (
                      <tr key={pay._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ffffff' }}>
                          {pay.receiptNumber}
                        </td>
                        <td>
                          {pay.paymentDate
                            ? new Date(pay.paymentDate).toLocaleDateString()
                            : new Date(pay.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {pay.membershipPlan?.name || (pay.purpose === 'renewal' ? 'Membership Renewal' : 'Gym Membership')}
                        </td>
                        <td style={{ fontWeight: 800, color: '#ffffff' }}>
                          ₹{pay.amount}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Receipt}
                            onClick={() => {
                              setSelectedReceipt(pay);
                              setReceiptModalOpen(true);
                            }}
                          >
                            Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box" style={{ padding: '2.5rem 1rem' }}>
                <div className="empty-state-icon">
                  <CreditCard size={28} />
                </div>
                <span className="empty-state-title">No Payment Invoices Yet</span>
                <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
                  Upgrade or renew your membership using online Razorpay checkout to view verified payment records here.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  icon={Zap}
                  onClick={() => setRenewModalOpen(true)}
                >
                  Purchase Membership Plan
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* EDIT PROFILE MODAL */}
        <Modal
          isOpen={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          title="Edit Personal Information"
          subtitle="Keep your contact and emergency information up to date."
          size="md"
        >
          <form onSubmit={handleUpdateProfile}>
            <div className="modal-form-grid">
              <div className="form-field modal-form-col-full">
                <label className="field-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Phone Number</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="+1 (555) 000-0000"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Gender</label>
                <select
                  className="field-select"
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                >
                  <option value="unspecified">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Date of Birth</label>
                <input
                  type="date"
                  className="field-input"
                  value={profileForm.dateOfBirth}
                  onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Home Address</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Street address, City"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Emergency Contact (Name / Phone / Relation)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Name"
                    value={profileForm.emergencyName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, emergencyName: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Phone"
                    value={profileForm.emergencyPhone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, emergencyPhone: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Relation"
                    value={profileForm.emergencyRelation}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, emergencyRelation: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions-row">
              <Button variant="ghost" size="md" onClick={() => setEditProfileModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Saving...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* RENEW / UPGRADE MEMBERSHIP MODAL (RAZORPAY INTEGRATION) */}
        <Modal
          isOpen={renewModalOpen}
          onClose={() => setRenewModalOpen(false)}
          title="Select Membership Plan & Checkout"
          subtitle="Choose your preferred tier. Payment is securely processed via Razorpay Sandbox."
          size="lg"
        >
          <div>
            <div className="plan-selector-grid">
              {availablePlans.map((p) => {
                const isSelected = selectedPlanForPurchase?._id === p._id;
                return (
                  <div
                    key={p._id}
                    className={`plan-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPlanForPurchase(p)}
                  >
                    <div>
                      <div className="plan-select-card-header">
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                          {p.name}
                        </h4>
                        {isSelected && (
                          <Badge variant="primary" size="sm">
                            <Check size={13} style={{ marginRight: '0.2rem' }} /> Selected
                          </Badge>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.4rem 0' }}>
                        {p.description || 'Full gym floor and amenity tier access.'}
                      </p>
                    </div>

                    <div>
                      <div style={{ margin: '0.75rem 0' }}>
                        <span className="plan-select-card-price">₹{p.price}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {' '}
                          / {p.duration} {p.duration === 1 ? 'month' : 'months'}
                        </span>
                      </div>

                      <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {p.features?.slice(0, 3).map((feat, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedPlanForPurchase && (
              <div
                style={{
                  background: 'rgba(255, 77, 0, 0.08)',
                  border: '1px solid rgba(255, 77, 0, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', display: 'block' }}>
                    Authoritative Order Summary
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                    {selectedPlanForPurchase.name} ({selectedPlanForPurchase.duration} Months Subscription)
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#ffffff' }}>
                    ₹{selectedPlanForPurchase.price}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                    Standard Gateway Fee Included
                  </span>
                </div>
              </div>
            )}

            <div className="modal-actions-row" style={{ marginTop: '1.5rem' }}>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setRenewModalOpen(false)}
                disabled={paymentProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Zap}
                onClick={() => handleInitiatePayment(selectedPlanForPurchase)}
                disabled={paymentProcessing || !selectedPlanForPurchase}
              >
                {paymentProcessing ? 'Connecting to Razorpay...' : `Pay ₹${selectedPlanForPurchase?.price || 0} via Razorpay`}
              </Button>
            </div>
          </div>
        </Modal>

        {/* PAYMENT RECEIPT MODAL */}
        <Modal
          isOpen={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedReceipt(null);
          }}
          title="Official Payment Receipt"
          subtitle="Verified transaction receipt from IronForge Gym Management System."
          size="md"
        >
          {selectedReceipt && (
            <div className="receipt-view-container">
              <div className="receipt-header">
                <div>
                  <div className="receipt-brand-logo">
                    IRON<span>FORGE</span> GYM
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Membership & Billing Division
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge
                    variant={selectedReceipt.status === 'paid' ? 'primary' : 'warning'}
                    size="md"
                  >
                    {selectedReceipt.status.toUpperCase()}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    Ref: {selectedReceipt.receiptNumber}
                  </span>
                </div>
              </div>

              <div className="receipt-meta-grid">
                <div className="receipt-meta-item">
                  <label>Billed Athlete</label>
                  <span>{dashboardData?.member?.user?.name || user?.name}</span>
                </div>
                <div className="receipt-meta-item">
                  <label>Email Address</label>
                  <span>{dashboardData?.member?.user?.email || user?.email}</span>
                </div>
                <div className="receipt-meta-item">
                  <label>Payment Date</label>
                  <span>
                    {selectedReceipt.paymentDate
                      ? new Date(selectedReceipt.paymentDate).toLocaleString()
                      : new Date(selectedReceipt.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="receipt-meta-item">
                  <label>Payment Method</label>
                  <span style={{ textTransform: 'capitalize' }}>
                    {selectedReceipt.paymentMethod === 'razorpay' ? 'Razorpay Online' : selectedReceipt.paymentMethod}
                  </span>
                </div>
              </div>

              <table className="receipt-summary-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Term</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>
                      {selectedReceipt.membershipPlan?.name || 'Membership Subscription Tier'}
                    </td>
                    <td>
                      {selectedReceipt.membershipPlan?.duration ? `${selectedReceipt.membershipPlan.duration} Months` : 'Standard'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                      ₹{selectedReceipt.amount}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="receipt-total-box">
                <span>Total Amount Paid:</span>
                <span style={{ color: '#34d399', fontSize: '1.4rem' }}>
                  ₹{selectedReceipt.amount} INR
                </span>
              </div>

              {selectedReceipt.razorpayPaymentId && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div><strong>Razorpay Order ID:</strong> {selectedReceipt.razorpayOrderId || 'N/A'}</div>
                  <div><strong>Gateway Payment ID:</strong> {selectedReceipt.razorpayPaymentId}</div>
                </div>
              )}

              <div className="receipt-footer-note">
                Thank you for training with IronForge! This is a computer-generated transaction receipt.
              </div>

              <div className="modal-actions-row" style={{ marginTop: '1.25rem' }}>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setReceiptModalOpen(false);
                    setSelectedReceipt(null);
                  }}
                >
                  Close Receipt
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* LOG / EDIT FITNESS PROGRESS MODAL */}
        <Modal
          isOpen={progressModalOpen}
          onClose={() => setProgressModalOpen(false)}
          title={editingProgressId ? 'Edit Fitness Measurements' : 'Log Fitness Progress'}
          subtitle="Record body weight, body fat %, and circumference metrics."
          size="md"
        >
          <form onSubmit={handleSaveProgress}>
            {progressError && (
              <div
                className="auth-error-alert"
                style={{ marginBottom: '1rem' }}
              >
                <AlertCircle size={16} className="error-icon" />
                <span>{progressError}</span>
              </div>
            )}

            <div className="modal-form-grid">
              <div className="form-field">
                <label className="field-label">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="500"
                  className="field-input"
                  placeholder="e.g. 78.5"
                  value={progressForm.weight}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, weight: e.target.value })
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
                  placeholder="e.g. 18.2"
                  value={progressForm.bodyFatPercentage}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, bodyFatPercentage: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Chest Circumference (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 102"
                  value={progressForm.chest}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, chest: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Waist Circumference (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 84"
                  value={progressForm.waist}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, waist: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Hips Circumference (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 96"
                  value={progressForm.hips}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, hips: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Arms / Biceps (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="100"
                  className="field-input"
                  placeholder="e.g. 36.5"
                  value={progressForm.arms}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, arms: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Thighs Circumference (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="15"
                  max="150"
                  className="field-input"
                  placeholder="e.g. 58"
                  value={progressForm.thighs}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, thighs: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Recorded Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={progressForm.recordedAt}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, recordedAt: e.target.value })
                  }
                />
              </div>

              <div className="form-field modal-form-col-full">
                <label className="field-label">Notes & Observations</label>
                <textarea
                  className="field-textarea"
                  rows={3}
                  placeholder="e.g. Completed 4-week cut, energy levels high, PRs maintained."
                  value={progressForm.notes}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="modal-actions-row">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setProgressModalOpen(false)}
                disabled={savingProgress}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={savingProgress}
              >
                {savingProgress
                  ? 'Saving Metrics...'
                  : editingProgressId
                  ? 'Update Record'
                  : 'Save Progress Record'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

