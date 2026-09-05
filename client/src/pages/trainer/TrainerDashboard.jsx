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
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { dashboardApi } from '../../services/api';
import './TrainerDashboard.css';
import '../admin/AdminDashboard.css';

export default function TrainerDashboard() {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Member Detail Modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadTrainerData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardApi.getTrainerData();
      setDashboardData(data);
      setAssignedMembers(data.assignedMembers || []);
    } catch (err) {
      setError(err.message || 'Failed to load trainer dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrainerData();
  }, [loadTrainerData]);

  const handleOpenDetail = (member) => {
    setSelectedMember(member);
    setDetailModalOpen(true);
  };

  const filteredMembers = assignedMembers.filter((m) => {
    if (!search) return true;
    const name = m.user?.name || '';
    const email = m.user?.email || '';
    const plan = m.membershipPlan?.name || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      plan.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="dashboard-page">
      <div className="container">
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
                  {dashboardData?.trainer?.specialization} &bull; {dashboardData?.trainer?.bio || 'Dedicated to member transformations and athletic performance.'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="dashboard-stats-grid">
          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-cyan">
              <Users size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Total Assigned Members</span>
              <span className="stat-meta-value">{dashboardData?.stats?.totalAssigned ?? 0}</span>
              <span className="stat-meta-sub">In your coaching roster</span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-green">
              <Activity size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Active Members</span>
              <span className="stat-meta-value">{dashboardData?.stats?.activeAssigned ?? 0}</span>
              <span className="stat-meta-sub">Currently training</span>
            </div>
          </Card>

          <Card className="stat-card glass-panel" padding="none">
            <div className="stat-icon-wrap stat-icon-orange">
              <Calendar size={26} />
            </div>
            <div className="stat-meta">
              <span className="stat-meta-title">Expired Memberships</span>
              <span className="stat-meta-value">{dashboardData?.stats?.expiredAssigned ?? 0}</span>
              <span className="stat-meta-sub">Due for renewal</span>
            </div>
          </Card>
        </div>

        {/* Assigned Members Section */}
        <Card className="glass-panel" padding="normal">
          <div className="module-toolbar">
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Assigned Members Roster</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Athletes assigned to your personal training supervision.
              </p>
            </div>

            <div className="search-filter-group" style={{ maxWidth: '380px' }}>
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search your assigned athletes..."
                  className="search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Contact</th>
                  <th>Subscribed Plan</th>
                  <th>Membership Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <div className="user-cell">
                          <span className="user-cell-name">{m.user?.name || 'Member'}</span>
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
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>No Plan</span>
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
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetail(m)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state-box">
                        <div className="empty-state-icon"><Users size={28} /></div>
                        <span className="empty-state-title">No members currently assigned to you</span>
                        <p style={{ fontSize: '0.88rem' }}>When an administrator assigns members to your coaching roster, they will appear here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Member Details Modal */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Member Roster Profile: ${selectedMember?.user?.name}`}
          subtitle="Athlete information, emergency contact, and membership tier."
          size="md"
        >
          {selectedMember && (
            <div className="member-detail-view">
              {/* Personal Info */}
              <div className="detail-section">
                <span className="detail-section-title">Personal & Contact Info</span>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{selectedMember.user?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value">{selectedMember.user?.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedMember.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gender</span>
                    <span className="detail-value" style={{ textTransform: 'capitalize' }}>{selectedMember.gender || 'Unspecified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Home Address</span>
                    <span className="detail-value">{selectedMember.address || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Status</span>
                    <span className="detail-value">
                      <span className={`status-pill status-${selectedMember.status}`}>{selectedMember.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="detail-section">
                <span className="detail-section-title">Emergency Contact</span>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Contact Name</span>
                    <span className="detail-value">{selectedMember.emergencyContact?.name || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Emergency Phone</span>
                    <span className="detail-value">{selectedMember.emergencyContact?.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Relationship</span>
                    <span className="detail-value">{selectedMember.emergencyContact?.relation || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Membership Plan Info */}
              <div className="detail-section">
                <span className="detail-section-title">Membership Package</span>
                {selectedMember.membershipPlan ? (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Subscribed Tier</span>
                      <span className="detail-value">{selectedMember.membershipPlan.name} (${selectedMember.membershipPlan.price}/mo)</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">End Expiration Date</span>
                      <span className="detail-value">
                        {selectedMember.membershipEndDate ? new Date(selectedMember.membershipEndDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No active plan assigned.</p>
                )}
              </div>

              {/* Training Notes */}
              {selectedMember.notes && (
                <div className="detail-section">
                  <span className="detail-section-title">Training Notes</span>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {selectedMember.notes}
                  </p>
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
      </div>
    </div>
  );
}
