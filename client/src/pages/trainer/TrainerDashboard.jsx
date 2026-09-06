import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  Users,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  Activity,
  HeartPulse,
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  Flame,
  Check,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  Timer,
  TrendingUp,
  TrendingDown,
  Scale,
  LineChart,
  RefreshCw,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  dashboardApi,
  trainingPlansApi,
  exercisesApi,
  memberExerciseAssignmentsApi,
  attendanceApi,
  progressApi,
} from '../../services/api';
import './TrainerDashboard.css';
import '../admin/AdminDashboard.css';

export default function TrainerDashboard() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'plans' | 'exercises' | 'attendance'

  const [dashboardData, setDashboardData] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Attendance States
  const [trainerAttendance, setTrainerAttendance] = useState([]);
  const [trainerAttendanceStats, setTrainerAttendanceStats] = useState({
    totalRecords: 0,
    todayCheckIns: 0,
    currentlyActive: 0,
    rosterCount: 0,
  });
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('');
  const [attendanceMemberFilter, setAttendanceMemberFilter] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Searches & Filters
  const [memberSearch, setMemberSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('');

  // Member Detail Inspector Modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemberPlan, setSelectedMemberPlan] = useState(null);
  const [selectedMemberProgress, setSelectedMemberProgress] = useState([]);
  const [selectedMemberProgressStats, setSelectedMemberProgressStats] = useState(null);
  const [selectedMemberTrendPoints, setSelectedMemberTrendPoints] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalTab, setDetailModalTab] = useState('profile'); // 'profile' | 'routine' | 'progress'
  const [loadingMemberPlan, setLoadingMemberPlan] = useState(false);
  const [loadingMemberProgress, setLoadingMemberProgress] = useState(false);

  // Trainer Progress Logging State
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [editingProgressId, setEditingProgressId] = useState(null);
  const [targetProgressMember, setTargetProgressMember] = useState(null);
  const [progressForm, setProgressForm] = useState({
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
  const [progressError, setProgressError] = useState('');
  const [progressSubmitting, setProgressSubmitting] = useState(false);

  // Plan Builder Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    memberId: '',
    planName: '',
    goal: 'Hypertrophy',
    startDate: '',
    endDate: '',
    notes: '',
    description: '',
    status: 'active',
    exercises: [],
  });

  // Assign Exercise to Athlete Modal States
  const [assignExerciseModalOpen, setAssignExerciseModalOpen] = useState(false);
  const [selectedExerciseForAssign, setSelectedExerciseForAssign] = useState(null);
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignSets, setAssignSets] = useState(3);
  const [assignReps, setAssignReps] = useState(10);
  const [assignDuration, setAssignDuration] = useState(0);
  const [assignRestTime, setAssignRestTime] = useState(60);
  const [assignTargetWeight, setAssignTargetWeight] = useState(0);
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetPlan, setDeleteTargetPlan] = useState(null);
  const [planModalError, setPlanModalError] = useState('');
  const [deletePlanModalError, setDeletePlanModalError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const loadTrainerAttendance = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      const params = {};
      if (attendanceStatusFilter) params.status = attendanceStatusFilter;
      if (attendanceMemberFilter) params.memberId = attendanceMemberFilter;
      if (attendanceSearch) params.search = attendanceSearch;
      const res = await attendanceApi.getTrainerAttendance(params);
      if (res) {
        setTrainerAttendance(res.records || []);
        if (res.stats) setTrainerAttendanceStats(res.stats);
      }
    } catch (err) {
      console.warn('[Trainer Attendance] Error:', err.message);
    } finally {
      setAttendanceLoading(false);
    }
  }, [attendanceStatusFilter, attendanceMemberFilter, attendanceSearch]);

  const loadTrainerData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [data, exercisesRes, plansRes] = await Promise.all([
        dashboardApi.getTrainerData(),
        exercisesApi.getAll(),
        trainingPlansApi.getAll(),
      ]);

      setDashboardData(data);
      setAssignedMembers(data.assignedMembers || []);
      setExerciseLibrary(exercisesRes || []);
      setTrainingPlans(plansRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load trainer dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrainerData();
    loadTrainerAttendance();
  }, [loadTrainerData, loadTrainerAttendance]);

  const flashMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Member Inspector
  const handleOpenDetail = async (member, initialTab = 'profile') => {
    setSelectedMember(member);
    setDetailModalTab(initialTab);
    setDetailModalOpen(true);
    setSelectedMemberPlan(null);
    setSelectedMemberProgress([]);
    setSelectedMemberProgressStats(null);
    setSelectedMemberTrendPoints([]);
    try {
      setLoadingMemberPlan(true);
      setLoadingMemberProgress(true);
      const [planRes, progressRes] = await Promise.all([
        trainingPlansApi.getByMemberId(member._id).catch(() => null),
        progressApi.getMemberProgress(member._id).catch(() => null),
      ]);

      setSelectedMemberPlan(planRes?.activePlan || (planRes?.plans && planRes.plans[0]) || null);
      if (progressRes) {
        setSelectedMemberProgress(progressRes.records || []);
        setSelectedMemberProgressStats(progressRes.stats || null);
        setSelectedMemberTrendPoints(progressRes.trendPoints || []);
      }
    } catch (err) {
      console.warn('Failed to load member details:', err);
    } finally {
      setLoadingMemberPlan(false);
      setLoadingMemberProgress(false);
    }
  };

  const handleOpenRecordProgress = (member, record = null) => {
    setTargetProgressMember(member);
    setEditingProgressId(record ? record._id : null);
    setProgressError('');
    if (record) {
      setProgressForm({
        memberId: member._id,
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
    } else {
      setProgressForm({
        memberId: member._id,
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
    }
    setProgressModalOpen(true);
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    setProgressError('');
    setProgressSubmitting(true);

    try {
      const payload = {
        memberId: progressForm.memberId,
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
        flashMessage('Athlete progress record updated.');
      } else {
        await progressApi.create(payload);
        flashMessage('Athlete progress metrics logged successfully.');
      }

      setProgressModalOpen(false);

      // Refresh inspector progress if open
      if (selectedMember && selectedMember._id === progressForm.memberId) {
        const res = await progressApi.getMemberProgress(progressForm.memberId);
        if (res) {
          setSelectedMemberProgress(res.records || []);
          setSelectedMemberProgressStats(res.stats || null);
          setSelectedMemberTrendPoints(res.trendPoints || []);
        }
      }
    } catch (err) {
      setProgressError(err.message || 'Failed to save progress metrics.');
    } finally {
      setProgressSubmitting(false);
    }
  };

  const handleDeleteMemberProgress = async (recordId, memberId) => {
    try {
      await progressApi.delete(recordId);
      flashMessage('Progress entry removed.');
      if (selectedMember && selectedMember._id === memberId) {
        const res = await progressApi.getMemberProgress(memberId);
        if (res) {
          setSelectedMemberProgress(res.records || []);
          setSelectedMemberProgressStats(res.stats || null);
          setSelectedMemberTrendPoints(res.trendPoints || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete record.');
    }
  };

  // --- Plan Builder Handlers ---
  const handleOpenCreatePlan = (preselectedMemberId = '') => {
    setEditingPlan(null);
    const defaultMember = preselectedMemberId || assignedMembers[0]?._id || '';

    // Start with 2 default exercises if available
    const initialExercises = exerciseLibrary.slice(0, 3).map((ex, idx) => ({
      exercise: ex._id,
      sets: ex.defaultSets || 3,
      reps: ex.defaultReps || 10,
      duration: ex.defaultDuration || 0,
      restTime: ex.defaultRestTime || 60,
      targetWeight: 0,
      instructions: '',
      order: idx + 1,
    }));

    setPlanForm({
      memberId: defaultMember,
      planName: 'Custom Strength & Conditioning Split',
      goal: 'Hypertrophy',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Focus on progressive overload and strict repetition tempo.',
      description: 'Personalized training split customized for member goals.',
      status: 'active',
      exercises: initialExercises,
    });
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (tp) => {
    setEditingPlan(tp);
    setPlanForm({
      memberId: tp.member?._id || tp.member,
      planName: tp.planName,
      goal: tp.goal || 'General Fitness',
      startDate: tp.startDate ? tp.startDate.split('T')[0] : '',
      endDate: tp.endDate ? tp.endDate.split('T')[0] : '',
      notes: tp.notes || '',
      description: tp.description || '',
      status: tp.status || 'active',
      exercises: tp.exercises?.map((item, idx) => ({
        exercise: item.exercise?._id || item.exercise,
        sets: item.sets || 3,
        reps: item.reps || 10,
        duration: item.duration || 0,
        restTime: item.restTime || 60,
        targetWeight: item.targetWeight || 0,
        instructions: item.instructions || '',
        order: item.order || idx + 1,
      })) || [],
    });
    setPlanModalOpen(true);
  };

  const handleAddExerciseRow = () => {
    const firstEx = exerciseLibrary[0];
    if (!firstEx) return;
    setPlanForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exercise: firstEx._id,
          sets: firstEx.defaultSets || 3,
          reps: firstEx.defaultReps || 10,
          duration: firstEx.defaultDuration || 0,
          restTime: firstEx.defaultRestTime || 60,
          targetWeight: 0,
          instructions: '',
          order: prev.exercises.length + 1,
        },
      ],
    }));
  };

  const handleRemoveExerciseRow = (index) => {
    setPlanForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const handleExerciseChange = (index, field, value) => {
    setPlanForm((prev) => {
      const updated = [...prev.exercises];
      if (field === 'exercise') {
        const found = exerciseLibrary.find((e) => e._id === value);
        updated[index] = {
          ...updated[index],
          exercise: value,
          sets: found?.defaultSets || 3,
          reps: found?.defaultReps || 10,
          duration: found?.defaultDuration || 0,
          restTime: found?.defaultRestTime || 60,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return { ...prev, exercises: updated };
    });
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!planForm.memberId) {
      setPlanModalError('Please select an athlete from your roster.');
      return;
    }
    if (planForm.exercises.length === 0) {
      setPlanModalError('Please add at least 1 exercise to the training plan.');
      return;
    }

    try {
      setSubmitting(true);
      setPlanModalError('');
      const payload = {
        memberId: planForm.memberId,
        planName: planForm.planName,
        goal: planForm.goal,
        startDate: planForm.startDate || new Date(),
        endDate: planForm.endDate || null,
        notes: planForm.notes,
        description: planForm.description,
        status: planForm.status,
        exercises: planForm.exercises,
      };

      if (editingPlan) {
        await trainingPlansApi.update(editingPlan._id, payload);
        flashMessage(`Training plan "${planForm.planName}" updated successfully.`);
      } else {
        await trainingPlansApi.create(payload);
        flashMessage(`New training plan "${planForm.planName}" assigned to athlete.`);
      }

      setPlanModalOpen(false);
      await loadTrainerData();
    } catch (err) {
      setPlanModalError(err.message || 'Error saving training plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeletePlan = async () => {
    if (!deleteTargetPlan) return;
    try {
      setSubmitting(true);
      setDeletePlanModalError('');
      await trainingPlansApi.delete(deleteTargetPlan._id);
      flashMessage(`Plan "${deleteTargetPlan.planName}" deleted.`);
      setDeleteModalOpen(false);
      setDeleteTargetPlan(null);
      await loadTrainerData();
    } catch (err) {
      setDeletePlanModalError(err.message || 'Error deleting plan');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Assign Exercise to Member Handlers ---
  const handleOpenAssignExercise = (exercise) => {
    setSelectedExerciseForAssign(exercise);
    setAssignMemberId(assignedMembers[0]?._id || '');
    setAssignSets(exercise.defaultSets !== undefined ? exercise.defaultSets : 3);
    setAssignReps(exercise.defaultReps !== undefined ? exercise.defaultReps : 10);
    setAssignDuration(exercise.defaultDuration !== undefined ? exercise.defaultDuration : 0);
    setAssignRestTime(exercise.defaultRestTime !== undefined ? exercise.defaultRestTime : 60);
    setAssignTargetWeight(0);
    setAssignInstructions('');
    setAssignError('');
    setAssignExerciseModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setAssignExerciseModalOpen(false);
    setSelectedExerciseForAssign(null);
    setAssignMemberId('');
    setAssignError('');
    setAssignInstructions('');
  };

  const handleSubmitAssignExercise = async (e) => {
    e.preventDefault();
    if (!assignMemberId) {
      setAssignError('Please select an athlete from your roster to assign this exercise.');
      return;
    }
    if (!selectedExerciseForAssign) return;

    try {
      setAssignSubmitting(true);
      setAssignError('');

      await memberExerciseAssignmentsApi.create({
        memberId: assignMemberId,
        exerciseId: selectedExerciseForAssign._id,
        sets: Number(assignSets),
        reps: Number(assignReps),
        duration: Number(assignDuration),
        restTime: Number(assignRestTime),
        targetWeight: Number(assignTargetWeight),
        instructions: assignInstructions,
      });

      const memberObj = assignedMembers.find((m) => m._id === assignMemberId);
      flashMessage(
        `Exercise "${selectedExerciseForAssign.name}" successfully assigned to ${
          memberObj?.user?.name || 'Athlete'
        }!`
      );
      handleCloseAssignModal();
    } catch (err) {
      setAssignError(err.message || 'Failed to assign exercise to athlete.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Filtered Roster & Plans
  const filteredMembers = assignedMembers.filter((m) => {
    if (!memberSearch) return true;
    const name = m.user?.name || '';
    const email = m.user?.email || '';
    const plan = m.membershipPlan?.name || '';
    return (
      name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      plan.toLowerCase().includes(memberSearch.toLowerCase())
    );
  });

  const filteredPlans = trainingPlans.filter((tp) => {
    if (!planSearch) return true;
    const name = tp.planName || '';
    const athlete = tp.member?.user?.name || '';
    const goal = tp.goal || '';
    return (
      name.toLowerCase().includes(planSearch.toLowerCase()) ||
      athlete.toLowerCase().includes(planSearch.toLowerCase()) ||
      goal.toLowerCase().includes(planSearch.toLowerCase())
    );
  });

  const filteredExercises = exerciseLibrary.filter((ex) => {
    const matchesSearch =
      !exerciseSearch ||
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.category.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesMuscle = !exerciseMuscleFilter || ex.muscleGroup === exerciseMuscleFilter;
    return matchesSearch && matchesMuscle;
  });

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

  return (
    <div className="dashboard-page">
      <div className="container">
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

        {/* Trainer Profile Card Header */}
        <Card className="trainer-header-card glass-panel" padding="normal">
          <div className="trainer-profile-hero">
            <div className="trainer-hero-left">
              <div className="trainer-avatar-large">
                <Award size={36} />
              </div>
              <div className="trainer-hero-info">
                <div className="trainer-hero-badges">
                  <Badge variant="secondary" size="md">
                    COACH PORTAL
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {dashboardData?.trainer?.experience || 'Certified Coach'}
                  </Badge>
                </div>
                <h1>{dashboardData?.trainer?.user?.name || user?.name}</h1>
                <p className="trainer-hero-bio">
                  {dashboardData?.trainer?.specialization} &bull;{' '}
                  {dashboardData?.trainer?.bio ||
                    'Dedicated to member transformations and athletic performance.'}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => handleOpenCreatePlan()}
              disabled={assignedMembers.length === 0}
            >
              Build Workout Plan
            </Button>
          </div>
        </Card>

        {/* Top 3 Stat Cards */}
        <div className="dashboard-stats-grid">
          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-cyan">
              <Users size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Coached Athletes</span>
              <span className="stat-meta-value">{dashboardData?.stats?.totalAssigned ?? 0}</span>
              <span className="stat-meta-sub">
                {dashboardData?.stats?.activeAssigned ?? 0} currently active
              </span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-orange">
              <Dumbbell size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Active Workout Plans</span>
              <span className="stat-meta-value">{trainingPlans.length}</span>
              <span className="stat-meta-sub">Routines assigned by you</span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-green">
              <Layers size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Exercise Catalog</span>
              <span className="stat-meta-value">{exerciseLibrary.length}</span>
              <span className="stat-meta-sub">Available movements</span>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            <Users size={16} />
            <span>My Athletes Roster ({assignedMembers.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <Dumbbell size={16} />
            <span>Assigned Training Plans ({trainingPlans.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
            onClick={() => setActiveTab('exercises')}
          >
            <Layers size={16} />
            <span>Exercise Library ({exerciseLibrary.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Clock size={16} />
            <span>Roster Attendance ({trainerAttendance.length})</span>
          </button>
        </div>

        {/* TAB 1: ATHLETES ROSTER */}
        {activeTab === 'roster' && (
          <Card className="glass-panel" padding="normal">
            <div className="module-toolbar">
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>
                  Assigned Athletes Roster
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Athletes assigned to your personal training supervision.
                </p>
              </div>

              <div className="search-filter-group" style={{ maxWidth: '380px' }}>
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search your athletes..."
                    className="search-input"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Athlete Name</th>
                    <th>Contact</th>
                    <th>Subscribed Plan</th>
                    <th>Expiry Date</th>
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
                            <span className="user-cell-name">{m.user?.name || 'Athlete'}</span>
                            <span className="user-cell-email">{m.user?.email}</span>
                          </div>
                        </td>
                        <td>{m.phone || <span className="text-muted">—</span>}</td>
                        <td>
                          {m.membershipPlan ? (
                            <Badge variant="secondary" size="sm">
                              {m.membershipPlan.name}
                            </Badge>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                              No Plan
                            </span>
                          )}
                        </td>
                        <td>
                          {m.membershipEndDate ? (
                            new Date(m.membershipEndDate).toLocaleDateString()
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill status-${m.status}`}>{m.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Eye}
                              onClick={() => handleOpenDetail(m, 'profile')}
                            >
                              Details
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Scale}
                              onClick={() => handleOpenDetail(m, 'progress')}
                            >
                              Progress
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Plus}
                              onClick={() => handleOpenCreatePlan(m._id)}
                            >
                              Plan
                            </Button>
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
                          <span className="empty-state-title">
                            No athletes currently assigned to you
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: TRAINING PLANS */}
        {activeTab === 'plans' && (
          <div className="trainer-plans-content">
            <div className="module-toolbar">
              <div className="search-filter-group">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search plans by name, goal, or athlete..."
                    className="search-input"
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => handleOpenCreatePlan()}
                disabled={assignedMembers.length === 0}
              >
                Create Workout Plan
              </Button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan Name & Goal</th>
                    <th>Athlete</th>
                    <th>Movements</th>
                    <th>Date Range</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((tp) => (
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
                          <Badge variant="secondary" size="sm">
                            {tp.exercises?.length || 0} Exercises
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
                          <div className="action-buttons-cell">
                            <button
                              className="btn-icon-action"
                              title="Edit Workout Plan"
                              onClick={() => handleOpenEditPlan(tp)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn-icon-action btn-icon-delete"
                              title="Delete Plan"
                              onClick={() => {
                                setDeleteTargetPlan(tp);
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
                            <Dumbbell size={28} />
                          </div>
                          <span className="empty-state-title">No training plans created yet</span>
                          <p style={{ fontSize: '0.88rem' }}>
                            Click &ldquo;Create Workout Plan&rdquo; to design a customized routine for an athlete.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EXERCISE LIBRARY */}
        {activeTab === 'exercises' && (
          <div className="trainer-exercises-content">
            <div className="module-toolbar">
              <div className="search-filter-group">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search exercise catalog..."
                    className="search-input"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={exerciseMuscleFilter}
                  onChange={(e) => setExerciseMuscleFilter(e.target.value)}
                >
                  <option value="">All Muscle Groups</option>
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Legs">Legs</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Arms">Arms</option>
                  <option value="Core">Core</option>
                  <option value="Full Body">Full Body</option>
                </select>
              </div>
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
                        ? 'Click card to assign exercise to an athlete'
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
                        <span className={`exercise-tag difficulty-${ex.difficulty.toLowerCase()}`}>
                          {ex.difficulty}
                        </span>
                      </div>

                      <p className="exercise-catalog-desc">{ex.description}</p>

                      <div className="exercise-catalog-tags">
                        <span className="exercise-tag">Equipment: {ex.equipment}</span>
                        <span className="exercise-tag">
                          Defaults: {ex.defaultSets} sets &times; {ex.defaultReps} reps
                        </span>
                        <span className="exercise-tag">Rest: {ex.defaultRestTime}s</span>
                      </div>

                      {ex.instructions?.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--text-muted)',
                              display: 'block',
                              marginBottom: '0.35rem',
                            }}
                          >
                            Execution Cues:
                          </span>
                          <ul
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.25rem',
                            }}
                          >
                            {ex.instructions.map((step, sIdx) => (
                              <li key={sIdx}>&bull; {step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '0.75rem',
                        marginTop: '0.75rem',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ex.status === 'active' ? (
                        <button
                          type="button"
                          className="btn-assign-action"
                          onClick={() => handleOpenAssignExercise(ex)}
                          title="Assign Exercise to Member"
                        >
                          <Sparkles size={14} />
                          <span>Assign to Athlete</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Inactive</span>
                      )}
                      <Badge variant="outline" size="sm">
                        {ex.category}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-box" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-state-icon">
                    <Layers size={28} />
                  </div>
                  <span className="empty-state-title">No exercises match filter</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ROSTER ATTENDANCE */}
        {activeTab === 'attendance' && (
          <Card className="glass-panel" padding="normal">
            <div className="module-toolbar">
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={22} className="text-highlight" /> Athlete Check-In & Attendance History
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Live attendance presence and training logs for athletes on your roster.
                </p>
              </div>

              <div className="search-filter-group" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search athlete by name or email..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={attendanceMemberFilter}
                  onChange={(e) => setAttendanceMemberFilter(e.target.value)}
                >
                  <option value="">All Roster Athletes</option>
                  {assignedMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.user?.name}
                    </option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={attendanceStatusFilter}
                  onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Now</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Attendance Metrics */}
            <div className="attendance-stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Today's Check-Ins</span>
                <span className="attendance-stat-value" style={{ color: '#00e5ff' }}>
                  {trainerAttendanceStats.todayCheckIns}
                </span>
                <span className="attendance-stat-sub">Athletes checked in today</span>
              </div>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Currently Active</span>
                <span className="attendance-stat-value" style={{ color: '#34d399' }}>
                  {trainerAttendanceStats.currentlyActive}
                </span>
                <span className="attendance-stat-sub">On gym floor now</span>
              </div>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Total Coached Athletes</span>
                <span className="attendance-stat-value">
                  {assignedMembers.length}
                </span>
                <span className="attendance-stat-sub">Active coaching roster</span>
              </div>
              <div className="attendance-stat-box">
                <span className="attendance-stat-label">Total Check-In Logs</span>
                <span className="attendance-stat-value" style={{ color: 'var(--primary)' }}>
                  {trainerAttendance.length}
                </span>
                <span className="attendance-stat-sub">Historical visits recorded</span>
              </div>
            </div>

            {/* Attendance Table */}
            {attendanceLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                Loading roster attendance records...
              </div>
            ) : trainerAttendance && trainerAttendance.length > 0 ? (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Athlete</th>
                      <th>Date</th>
                      <th>Check-In Time</th>
                      <th>Check-Out Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainerAttendance.map((rec) => (
                      <tr key={rec._id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#ffffff' }}>{rec.member?.user?.name || 'Athlete'}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {rec.member?.user?.email}
                            </span>
                          </div>
                        </td>
                        <td>{rec.date ? new Date(rec.date).toLocaleDateString() : 'N/A'}</td>
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
              <div className="empty-state-box">
                <div className="empty-state-icon">
                  <Clock size={28} />
                </div>
                <span className="empty-state-title">No Attendance Records Found</span>
                <p style={{ fontSize: '0.88rem' }}>
                  No attendance logs match the current search or filter criteria for your roster athletes.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* MODAL: MEMBER DETAIL INSPECTOR */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Athlete Details: ${selectedMember?.user?.name}`}
          subtitle="Profile information and current assigned workout routine."
          size="lg"
        >
          {selectedMember && (
            <div className="detail-view-container">
              {/* Modal Sub-Tabs */}
              <div className="detail-modal-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn-subtab ${detailModalTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setDetailModalTab('profile')}
                  style={{
                    background: detailModalTab === 'profile' ? 'rgba(255, 106, 38, 0.15)' : 'none',
                    color: detailModalTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)',
                    border: '1px solid ' + (detailModalTab === 'profile' ? 'rgba(255, 106, 38, 0.4)' : 'transparent'),
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem 0.85rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Athlete Profile
                </button>
                <button
                  type="button"
                  className={`btn-subtab ${detailModalTab === 'routine' ? 'active' : ''}`}
                  onClick={() => setDetailModalTab('routine')}
                  style={{
                    background: detailModalTab === 'routine' ? 'rgba(255, 106, 38, 0.15)' : 'none',
                    color: detailModalTab === 'routine' ? 'var(--primary)' : 'var(--text-secondary)',
                    border: '1px solid ' + (detailModalTab === 'routine' ? 'rgba(255, 106, 38, 0.4)' : 'transparent'),
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem 0.85rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Workout Routine {selectedMemberPlan && '✓'}
                </button>
                <button
                  type="button"
                  className={`btn-subtab ${detailModalTab === 'progress' ? 'active' : ''}`}
                  onClick={() => setDetailModalTab('progress')}
                  style={{
                    background: detailModalTab === 'progress' ? 'rgba(255, 106, 38, 0.15)' : 'none',
                    color: detailModalTab === 'progress' ? 'var(--primary)' : 'var(--text-secondary)',
                    border: '1px solid ' + (detailModalTab === 'progress' ? 'rgba(255, 106, 38, 0.4)' : 'transparent'),
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem 0.85rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Fitness Progress ({selectedMemberProgress.length})
                </button>
              </div>

              {/* TAB 1: PROFILE */}
              {detailModalTab === 'profile' && (
                <div className="detail-grid">
                  <div className="detail-section">
                    <span className="detail-section-title">
                      <Users size={16} /> Athlete Info
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div className="detail-item">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{selectedMember.user?.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{selectedMember.phone || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Gender</span>
                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                          {selectedMember.gender || 'Unspecified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <span className="detail-section-title">
                      <HeartPulse size={16} /> Emergency & Plan
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div className="detail-item">
                        <span className="detail-label">Emergency Contact</span>
                        <span className="detail-value">
                          {selectedMember.emergencyContact?.name
                            ? `${selectedMember.emergencyContact.name} (${selectedMember.emergencyContact.phone})`
                            : 'None'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Membership Package</span>
                        <span className="detail-value">
                          {selectedMember.membershipPlan ? (
                            <Badge variant="secondary" size="sm">
                              {selectedMember.membershipPlan.name}
                            </Badge>
                          ) : (
                            'No plan'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TRAINING ROUTINE */}
              {detailModalTab === 'routine' && (
                <div className="detail-section">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span className="detail-section-title" style={{ marginBottom: 0 }}>
                      <Dumbbell size={16} /> Active Training Routine
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleOpenCreatePlan(selectedMember._id);
                      }}
                    >
                      Assign New Plan
                    </Button>
                  </div>

                  {loadingMemberPlan ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading workout plan...</p>
                  ) : selectedMemberPlan ? (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <h4 style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                          {selectedMemberPlan.planName}
                        </h4>
                        <Badge variant="outline" size="sm">
                          {selectedMemberPlan.goal}
                        </Badge>
                      </div>

                      {selectedMemberPlan.notes && (
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
                          <strong>Notes:</strong> {selectedMemberPlan.notes}
                        </p>
                      )}

                      <div className="routine-exercises-list">
                        {selectedMemberPlan.exercises?.map((item, idx) => (
                          <div key={idx} className="routine-exercise-card">
                            <div className="routine-exercise-header">
                              <span className="routine-exercise-title">
                                {idx + 1}. {item.exercise?.name || 'Exercise'}
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
                      No active workout routine assigned to this athlete yet. Click &ldquo;Assign New
                      Plan&rdquo; above to build one.
                    </p>
                  )}
                </div>
              )}

              {/* TAB 3: FITNESS PROGRESS */}
              {detailModalTab === 'progress' && (
                <div className="detail-section">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span className="detail-section-title" style={{ marginBottom: 0 }}>
                      <Activity size={16} /> Athlete Fitness Progress
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={() => handleOpenRecordProgress(selectedMember)}
                    >
                      Log Metrics for Athlete
                    </Button>
                  </div>

                  {loadingMemberProgress ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading progress records...</p>
                  ) : selectedMemberProgressStats ? (
                    <div>
                      {/* Summary Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                            Current Weight
                          </span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                            {selectedMemberProgressStats.currentWeight !== null ? `${selectedMemberProgressStats.currentWeight} kg` : '—'}
                          </span>
                          {selectedMemberProgressStats.weightChange !== null && (
                            <span style={{ fontSize: '0.75rem', color: selectedMemberProgressStats.weightChange <= 0 ? '#10b981' : 'var(--primary)', display: 'block' }}>
                              {selectedMemberProgressStats.weightChange > 0 ? `+${selectedMemberProgressStats.weightChange}` : selectedMemberProgressStats.weightChange} kg change
                            </span>
                          )}
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                            Body Fat %
                          </span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00e5ff' }}>
                            {selectedMemberProgressStats.currentBodyFat !== null ? `${selectedMemberProgressStats.currentBodyFat}%` : '—'}
                          </span>
                          {selectedMemberProgressStats.bodyFatChange !== null && (
                            <span style={{ fontSize: '0.75rem', color: selectedMemberProgressStats.bodyFatChange <= 0 ? '#10b981' : 'var(--primary)', display: 'block' }}>
                              {selectedMemberProgressStats.bodyFatChange > 0 ? `+${selectedMemberProgressStats.bodyFatChange}` : selectedMemberProgressStats.bodyFatChange}% change
                            </span>
                          )}
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                            Logged Records
                          </span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {selectedMemberProgressStats.totalRecords}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            {selectedMemberProgressStats.lastRecordedDate ? new Date(selectedMemberProgressStats.lastRecordedDate).toLocaleDateString() : 'None'}
                          </span>
                        </div>
                      </div>

                      {/* History Table */}
                      {selectedMemberProgress.length > 0 ? (
                        <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                          <table className="data-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Weight</th>
                                <th>Body Fat</th>
                                <th>Chest / Waist / Hips / Arms / Thighs</th>
                                <th>Notes</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedMemberProgress.map((p) => (
                                <tr key={p._id}>
                                  <td style={{ fontWeight: 600 }}>
                                    {p.recordedAt ? new Date(p.recordedAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td style={{ fontWeight: 800, color: '#ffffff' }}>
                                    {p.weight !== null ? `${p.weight} kg` : '—'}
                                  </td>
                                  <td style={{ color: '#00e5ff' }}>
                                    {p.bodyFatPercentage !== null ? `${p.bodyFatPercentage}%` : '—'}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', fontSize: '0.78rem' }}>
                                      {p.chest && <span>C:{p.chest}</span>}
                                      {p.waist && <span>W:{p.waist}</span>}
                                      {p.hips && <span>H:{p.hips}</span>}
                                      {p.arms && <span>A:{p.arms}</span>}
                                      {p.thighs && <span>T:{p.thighs}</span>}
                                    </div>
                                  </td>
                                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {p.notes || '—'}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Edit2}
                                        onClick={() => handleOpenRecordProgress(selectedMember, p)}
                                        title="Edit entry"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Trash2}
                                        onClick={() => handleDeleteMemberProgress(p._id, selectedMember._id)}
                                        title="Delete entry"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          No progress records logged for this athlete yet.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No progress entries yet. Click &ldquo;Log Metrics for Athlete&rdquo; to record baseline metrics.
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="secondary" size="md" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: WORKOUT PLAN BUILDER */}
        <Modal
          isOpen={planModalOpen}
          onClose={() => setPlanModalOpen(false)}
          title={editingPlan ? `Edit Workout Routine: ${editingPlan.planName}` : 'Build Athlete Workout Routine'}
          subtitle="Select athlete, goal, and construct customized exercise splits with sets and reps."
          size="lg"
        >
          <form onSubmit={handleSubmitPlan}>
            {planModalError && (
              <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{planModalError}</span>
              </div>
            )}
            <div className="modal-form-grid">
              <div className="form-field">
                <label className="field-label">Select Athlete *</label>
                <select
                  required
                  className="field-select"
                  value={planForm.memberId}
                  onChange={(e) => setPlanForm({ ...planForm, memberId: e.target.value })}
                  disabled={editingPlan !== null}
                >
                  <option value="">-- Choose Athlete --</option>
                  {assignedMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.user?.name} ({m.membershipPlan?.name || 'No Plan'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="field-label">Primary Training Goal *</label>
                <select
                  className="field-select"
                  value={planForm.goal}
                  onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                >
                  <option value="Hypertrophy">Hypertrophy (Muscle Gain)</option>
                  <option value="Strength">Strength & Power</option>
                  <option value="Fat Loss">Fat Loss & Conditioning</option>
                  <option value="Endurance">Endurance & Stamina</option>
                  <option value="Rehabilitation">Rehabilitation & Mobility</option>
                  <option value="General Fitness">General Fitness</option>
                </select>
              </div>

              <div className="modal-form-col-full form-field">
                <label className="field-label">Plan Title / Routine Name *</label>
                <input
                  type="text"
                  required
                  className="field-input"
                  placeholder="e.g. 8-Week Hypertrophy Upper/Lower Foundation"
                  value={planForm.planName}
                  onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Start Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={planForm.startDate}
                  onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label">Target Completion Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={planForm.endDate}
                  onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                />
              </div>

              <div className="modal-form-col-full form-field">
                <label className="field-label">Coaching Notes & Instructions for Athlete</label>
                <textarea
                  className="field-textarea"
                  placeholder="Weekly split schedule, rest days, progressive overload guidelines..."
                  value={planForm.notes}
                  onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Dynamic Exercise Rows Builder */}
            <div className="plan-builder-section">
              <div className="plan-builder-header">
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Workout Exercises</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Add movements from the exercise library with customized sets, reps, and targets.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddExerciseRow}
                >
                  Add Movement
                </Button>
              </div>

              <div className="plan-exercise-list">
                {planForm.exercises.map((item, idx) => (
                  <div key={idx} className="plan-exercise-item">
                    <div className="plan-exercise-top-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexGrow: 1 }}>
                        <span className="plan-exercise-index">#{idx + 1}</span>
                        <select
                          className="field-select"
                          style={{ flexGrow: 1 }}
                          value={item.exercise}
                          onChange={(e) => handleExerciseChange(idx, 'exercise', e.target.value)}
                        >
                          {exerciseLibrary.map((ex) => (
                            <option key={ex._id} value={ex._id}>
                              {ex.name} ({ex.muscleGroup} - {ex.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        className="btn-remove-exercise"
                        onClick={() => handleRemoveExerciseRow(idx)}
                        title="Remove Movement"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>

                    <div className="plan-exercise-inputs-grid">
                      <div>
                        <span className="plan-exercise-label">Sets</span>
                        <input
                          type="number"
                          min="1"
                          className="plan-exercise-input"
                          value={item.sets}
                          onChange={(e) => handleExerciseChange(idx, 'sets', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <span className="plan-exercise-label">Reps</span>
                        <input
                          type="number"
                          min="0"
                          className="plan-exercise-input"
                          value={item.reps}
                          onChange={(e) => handleExerciseChange(idx, 'reps', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <span className="plan-exercise-label">Target (kg)</span>
                        <input
                          type="number"
                          min="0"
                          className="plan-exercise-input"
                          value={item.targetWeight}
                          onChange={(e) =>
                            handleExerciseChange(idx, 'targetWeight', Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <span className="plan-exercise-label">Rest (sec)</span>
                        <input
                          type="number"
                          min="0"
                          className="plan-exercise-input"
                          value={item.restTime}
                          onChange={(e) =>
                            handleExerciseChange(idx, 'restTime', Number(e.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        className="plan-exercise-input"
                        placeholder="Specific form cues or instructions for this exercise (e.g. 3-sec eccentric)"
                        value={item.instructions}
                        onChange={(e) => handleExerciseChange(idx, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions-row">
              <Button variant="ghost" size="md" onClick={() => setPlanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Saving Routine...' : editingPlan ? 'Save Changes' : 'Assign Workout Routine'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* MODAL: DELETE PLAN CONFIRM */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Workout Plan"
          size="sm"
        >
          {deletePlanModalError && (
            <div className="assignment-error-banner" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{deletePlanModalError}</span>
            </div>
          )}
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '1.5rem',
              }}
            >
              Are you sure you want to delete{' '}
              <strong style={{ color: '#ffffff' }}>{deleteTargetPlan?.planName}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="ghost" size="md" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={submitting}
                onClick={handleConfirmDeletePlan}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                {submitting ? 'Deleting...' : 'Delete Plan'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* MODAL: ASSIGN EXERCISE TO ATHLETE */}
        <Modal
          isOpen={assignExerciseModalOpen}
          onClose={handleCloseAssignModal}
          title={
            selectedExerciseForAssign
              ? `Prescribe Movement: ${selectedExerciseForAssign.name}`
              : 'Prescribe Exercise'
          }
          subtitle="Assign this exercise with custom sets, reps, and targets to an athlete on your roster."
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
                  <label className="field-label">Select Coached Athlete *</label>
                  {assignedMembers.length > 0 ? (
                    <select
                      className="field-select"
                      required
                      value={assignMemberId}
                      onChange={(e) => {
                        setAssignMemberId(e.target.value);
                        setAssignError('');
                      }}
                    >
                      <option value="">-- Choose Athlete --</option>
                      {assignedMembers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.user?.name || 'Athlete'} ({m.membershipPlan?.name || 'Active Member'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        color: '#fca5a5',
                      }}
                    >
                      You currently have no athletes assigned to your coaching roster.
                    </div>
                  )}
                </div>

                {/* Prescription Parameters Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  <div className="form-field">
                    <label className="field-label">Working Sets *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="field-input"
                      value={assignSets}
                      onChange={(e) => setAssignSets(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Target Reps *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="field-input"
                      value={assignReps}
                      onChange={(e) => setAssignReps(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Target Weight (kg/lbs)</label>
                    <input
                      type="number"
                      min="0"
                      className="field-input"
                      placeholder="0"
                      value={assignTargetWeight}
                      onChange={(e) => setAssignTargetWeight(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Rest (sec)</label>
                    <input
                      type="number"
                      min="0"
                      className="field-input"
                      value={assignRestTime}
                      onChange={(e) => setAssignRestTime(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">Duration (sec)</label>
                    <input
                      type="number"
                      min="0"
                      className="field-input"
                      placeholder="0"
                      value={assignDuration}
                      onChange={(e) => setAssignDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">Coach Form Cues & Guidance</label>
                  <textarea
                    className="field-textarea"
                    rows={3}
                    placeholder="e.g. Keep chest high, explosive ascent with a 2-second hold at the peak..."
                    value={assignInstructions}
                    onChange={(e) => setAssignInstructions(e.target.value)}
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
                  disabled={assignSubmitting || !assignMemberId || assignedMembers.length === 0}
                  icon={Sparkles}
                >
                  {assignSubmitting ? 'Prescribing...' : 'Prescribe to Athlete'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* MODAL: LOG / EDIT ATHLETE FITNESS PROGRESS */}
        <Modal
          isOpen={progressModalOpen}
          onClose={() => setProgressModalOpen(false)}
          title={
            editingProgressId
              ? `Edit Fitness Metrics: ${targetProgressMember?.user?.name || 'Athlete'}`
              : `Log Fitness Progress: ${targetProgressMember?.user?.name || 'Athlete'}`
          }
          subtitle="Record body weight, body fat %, and circumference measurements for this athlete."
          size="md"
        >
          <form onSubmit={handleSubmitProgress}>
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
                  placeholder="e.g. 82.5"
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
                  placeholder="e.g. 19.5"
                  value={progressForm.bodyFatPercentage}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, bodyFatPercentage: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Chest (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 104"
                  value={progressForm.chest}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, chest: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Waist (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 86"
                  value={progressForm.waist}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, waist: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Hips (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="250"
                  className="field-input"
                  placeholder="e.g. 98"
                  value={progressForm.hips}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, hips: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Arms (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="100"
                  className="field-input"
                  placeholder="e.g. 38"
                  value={progressForm.arms}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, arms: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label className="field-label">Thighs (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="15"
                  max="150"
                  className="field-input"
                  placeholder="e.g. 60"
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
                <label className="field-label">Coach Notes & Assessment</label>
                <textarea
                  className="field-textarea"
                  rows={3}
                  placeholder="e.g. Visible delt separation, core hardening, recommended maintaining current caloric intake."
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
                disabled={progressSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={progressSubmitting}
              >
                {progressSubmitting
                  ? 'Saving Metrics...'
                  : editingProgressId
                  ? 'Update Metrics'
                  : 'Save Athlete Metrics'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
