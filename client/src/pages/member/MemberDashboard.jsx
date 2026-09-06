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
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { dashboardApi, membersApi, trainingPlansApi } from '../../services/api';
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

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  const flashMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
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
      alert(err.message || 'Error updating profile');
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
                      ${membership.plan.price}
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
                <p style={{ fontSize: '0.88rem' }}>
                  Please consult the IronForge front desk to activate a membership tier.
                </p>
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
      </div>
    </div>
  );
}
