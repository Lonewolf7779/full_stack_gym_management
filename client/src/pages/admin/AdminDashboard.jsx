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
  TrendingUp,
  Dumbbell,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  Target,
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
} from '../../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members' | 'trainers' | 'exercises' | 'plans' | 'memberships'

  // Data States
  const [statsData, setStatsData] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }

  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const flashMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
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
      alert(err.message || 'Error saving member');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Trainer Handlers ---
  const handleOpenAddTrainer = () => {
    setEditingTrainer(null);
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
      alert(err.message || 'Error saving trainer');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Plan Handlers ---
  const handleOpenAddPlan = () => {
    setEditingPlan(null);
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
      alert(err.message || 'Error saving plan');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Exercise Handlers ---
  const handleOpenAddExercise = () => {
    setEditingExercise(null);
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
      alert(err.message || 'Error saving exercise');
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
      alert(err.message || 'Error deleting item');
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
                              <span className={`status-pill status-${m.status}`}>{m.status}</span>
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
                          <span className={`status-pill status-${m.status}`}>{m.status}</span>
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
                          <span className={`status-pill status-${t.status}`}>{t.status}</span>
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
                    <input
                      type="password"
                      required
                      className="field-input"
                      placeholder="Enter strong password"
                      value={memberForm.password}
                      onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                    />
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
                    <input
                      type="password"
                      required
                      className="field-input"
                      placeholder="Password"
                      value={trainerForm.password}
                      onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                    />
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
      </div>
    </div>
  );
}
