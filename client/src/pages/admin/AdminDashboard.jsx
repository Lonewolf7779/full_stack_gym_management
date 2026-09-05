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
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { dashboardApi, membersApi, trainersApi, membershipPlansApi } from '../../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members' | 'trainers' | 'plans'

  // Data States
  const [statsData, setStatsData] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter States
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');
  const [trainerSearch, setTrainerSearch] = useState('');

  // Modal States
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'member'|'trainer'|'plan', id, name }

  const [submitting, setSubmitting] = useState(false);

  // Load all data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, membersRes, trainersRes, plansRes] = await Promise.all([
        dashboardApi.getAdminStats(),
        membersApi.getAll(),
        trainersApi.getAll(),
        membershipPlansApi.getAll(),
      ]);

      setStatsData(statsRes);
      setMembers(membersRes);
      setTrainers(trainersRes);
      setPlans(plansRes);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Flash Success Message Helper
  const flashMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
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
      password: '', // Leave blank unless updating
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

  // --- Delete Handler ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      if (deleteTarget.type === 'member') {
        await membersApi.delete(deleteTarget.id);
        flashMessage(`Member ${deleteTarget.name} deleted successfully.`);
      } else if (deleteTarget.type === 'trainer') {
        await trainersApi.delete(deleteTarget.id);
        flashMessage(`Trainer ${deleteTarget.name} deleted successfully.`);
      } else if (deleteTarget.type === 'plan') {
        await membershipPlansApi.delete(deleteTarget.id);
        flashMessage(`Plan ${deleteTarget.name} deleted or deactivated.`);
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await loadDashboardData();
    } catch (err) {
      alert(err.message || 'Error deleting resource');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered members & trainers
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

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="dashboard-greeting">
            <h1>Admin Console</h1>
            <p>Full control over members, coaches, memberships, and facility operations.</p>
          </div>
          <div className="dashboard-badge-group">
            <Badge variant="warning" size="md" icon={Shield}>
              System Administrator
            </Badge>
          </div>
        </div>

        {/* Global Success / Error Feedback */}
        {successMessage && (
          <div className="auth-error-alert" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#34d399', marginBottom: '1.5rem' }}>
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

        {/* Top Real Statistics Cards */}
        <div className="dashboard-stats-grid">
          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-orange">
              <Users size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Total Members</span>
              <span className="stat-meta-value">{statsData?.stats?.totalMembers ?? '...'}</span>
              <span className="stat-meta-sub">{statsData?.stats?.activeMembers ?? 0} active members</span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-cyan">
              <Award size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Certified Coaches</span>
              <span className="stat-meta-value">{statsData?.stats?.totalTrainers ?? '...'}</span>
              <span className="stat-meta-sub">{statsData?.stats?.activeTrainers ?? 0} active on floor</span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-green">
              <Activity size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Active Subscriptions</span>
              <span className="stat-meta-value">{statsData?.stats?.activeMemberships ?? '...'}</span>
              <span className="stat-meta-sub">Current active plans</span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-purple">
              <CreditCard size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Membership Tiers</span>
              <span className="stat-meta-value">{statsData?.stats?.totalPlans ?? '...'}</span>
              <span className="stat-meta-sub">Configured plan tiers</span>
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
            <span>Overview & Activity</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={16} />
            <span>Members Management ({members.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'trainers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trainers')}
          >
            <Award size={16} />
            <span>Trainers Roster ({trainers.length})</span>
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <CreditCard size={16} />
            <span>Membership Plans ({plans.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="overview-tab-content">
            <div className="grid-2" style={{ marginBottom: '2rem' }}>
              {/* Recent Members */}
              <Card className="glass-panel" padding="normal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Recent Member Registrations</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('members')}>View All</Button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Plan</th>
                        <th>Status</th>
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
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent registrations</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Plan Distribution */}
              <Card className="glass-panel" padding="normal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Membership Plan Distribution</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('plans')}>Manage Plans</Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {statsData?.planDistribution?.map((p) => (
                    <div key={p.planId} style={{ background: 'var(--bg-surface-elevated)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{p.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>${p.price}/month</span>
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
                            <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{m.gender || 'unspecified'}</span>
                          </div>
                        </td>
                        <td>
                          {m.membershipPlan ? (
                            <Badge variant="secondary" size="sm">
                              {m.membershipPlan.name} (${m.membershipPlan.price}/mo)
                            </Badge>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>No Plan Assigned</span>
                          )}
                        </td>
                        <td>
                          {m.assignedTrainer ? (
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {m.assignedTrainer.user?.name || 'Coach'}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill status-${m.status}`}>{m.status}</span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
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
                                setDeleteTarget({ type: 'member', id: m._id, name: m.user?.name || 'this member' });
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
                          <div className="empty-state-icon"><Users size={28} /></div>
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

        {/* TAB 3: TRAINERS MANAGEMENT */}
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
                            {t.activeMembersCount ?? t.assignedMembersCount ?? 0} Members
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${t.status}`}>{t.status}</span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
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
                                setDeleteTarget({ type: 'trainer', id: t._id, name: t.user?.name || 'this trainer' });
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
                          <div className="empty-state-icon"><Award size={28} /></div>
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

        {/* TAB 4: MEMBERSHIP PLANS MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="plans-tab-content">
            <div className="module-toolbar">
              <h3 style={{ fontSize: '1.25rem' }}>Configured Membership Packages</h3>
              <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAddPlan}>
                Create New Plan
              </Button>
            </div>

            <div className="grid-3">
              {plans.map((p) => (
                <Card key={p._id} className="glass-panel" padding="normal" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.4rem' }}>{p.name}</h3>
                      <span className={`status-pill status-${p.status}`}>{p.status}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem', minHeight: '38px' }}>
                      {p.description || 'Standard membership tier.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#ffffff' }}>${p.price}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {p.duration} month(s)</span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                        Included Features:
                      </span>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {p.features?.map((f, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <Button variant="secondary" size="sm" fullWidth icon={Edit2} onClick={() => handleOpenEditPlan(p)}>
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

              {/* Assignment Selectors */}
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
                    placeholder="Relation (e.g. Spouse)"
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
                  placeholder="Short professional summary for member matching..."
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

        {/* MODAL 3: ADD / EDIT PLAN */}
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

        {/* MODAL 4: CONFIRM DELETE */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong style={{ color: '#ffffff' }}>{deleteTarget?.name}</strong>? This action will permanently remove the record and linked credentials.
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
      </div>
    </div>
  );
}
