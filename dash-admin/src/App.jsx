import React, { useState, useEffect } from 'react';
import * as api from './api';

// Styles
const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#0a0a0a',
    minHeight: '100vh',
    color: '#fff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #333'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff'
  },
  subtitle: {
    color: '#888',
    fontSize: '14px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4ade80'
  },
  statLabel: {
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase',
    marginTop: '5px'
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600'
  },
  button: {
    backgroundColor: '#4ade80',
    color: '#000',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  buttonSecondary: {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginLeft: '8px'
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginLeft: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #333',
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #222'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  badgeActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    color: '#4ade80'
  },
  badgeSuspended: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444'
  },
  badgePremium: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    color: '#a855f7'
  },
  badgeStandard: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6'
  },
  badgeBasic: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    color: '#9ca3af'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: '30px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#888',
    fontSize: '13px'
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px'
  },
  instructions: {
    backgroundColor: '#0a0a0a',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '20px',
    fontSize: '13px'
  },
  instructionTitle: {
    color: '#4ade80',
    fontWeight: '600',
    marginBottom: '10px'
  },
  code: {
    backgroundColor: '#333',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace'
  }
};

// Tier badge component
const TierBadge = ({ tier }) => {
  const badgeStyle = tier === 'PREMIUM' ? styles.badgePremium
    : tier === 'STANDARD' ? styles.badgeStandard
    : styles.badgeBasic;
  return <span style={{...styles.badge, ...badgeStyle}}>{tier}</span>;
};

// Status badge component
const StatusBadge = ({ status }) => {
  const badgeStyle = status === 'active' ? styles.badgeActive : styles.badgeSuspended;
  return <span style={{...styles.badge, ...badgeStyle}}>{status}</span>;
};

// Create User Modal
const CreateUserModal = ({ packages, onClose, onCreated }) => {
  const [form, setForm] = useState({
    username: '',
    name: '',
    whatsapp: '',
    package: 'basic'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.createUser(form);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalTitle}>✅ User Created!</div>

          <div style={styles.instructions}>
            <div style={styles.instructionTitle}>OUR SYSTEM (Automatic)</div>
            <p>Username: <span style={styles.code}>{result.instructions.ourSystem.username}</span></p>
            <p>Tier: <TierBadge tier={result.instructions.ourSystem.tier} /></p>
            <p>Status: Done - Access is active</p>
          </div>

          {result.instructions.starshare && (
            <div style={{...styles.instructions, borderLeft: '3px solid #f59e0b'}}>
              <div style={{...styles.instructionTitle, color: '#f59e0b'}}>⚠️ STARSHARE (Manual)</div>
              <p>Create account in StarShare panel with:</p>
              <p>Username: <span style={styles.code}>{result.instructions.starshare.username}</span></p>
              <p>Password: <span style={styles.code}>{result.instructions.starshare.suggestedPassword}</span></p>
              <p>Package: <span style={styles.code}>{result.instructions.starshare.package}</span></p>
              <p>Max Connections: <span style={styles.code}>{result.instructions.starshare.maxConnections}</span></p>
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button style={styles.button} onClick={() => { onCreated(); onClose(); }}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <div style={styles.modalTitle}>New Customer</div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>StarShare Username</label>
            <input
              style={styles.input}
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              placeholder="e.g., kam_01"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Customer Name</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g., Kamaldine"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>WhatsApp Number</label>
            <input
              style={styles.input}
              value={form.whatsapp}
              onChange={e => setForm({...form, whatsapp: e.target.value})}
              placeholder="e.g., 628123456789"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Package</label>
            <select
              style={styles.select}
              value={form.package}
              onChange={e => setForm({...form, package: e.target.value})}
            >
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} - {pkg.price.toLocaleString()} {pkg.currency}
                </option>
              ))}
            </select>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" style={styles.buttonSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App
function App() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, packagesRes] = await Promise.all([
        api.getStats(),
        api.getUsers(),
        api.getPackages()
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
      setPackages(packagesRes.packages);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSuspend = async (username) => {
    if (!confirm(`Suspend ${username}?`)) return;
    try {
      await api.suspendUser(username);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleActivate = async (username) => {
    try {
      await api.activateUser(username);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (username) => {
    if (!confirm(`DELETE ${username}? This cannot be undone!`)) return;
    try {
      await api.deleteUser(username);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{...styles.app, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>📺 DASH Admin</div>
          <div style={styles.subtitle}>User & Package Management</div>
        </div>
        <button style={styles.button} onClick={() => setShowCreateModal(true)}>
          + New Customer
        </button>
      </header>

      {/* Stats */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalUsers}</div>
            <div style={styles.statLabel}>Total Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#4ade80'}}>{stats.activeUsers}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#ef4444'}}>{stats.suspendedUsers}</div>
            <div style={styles.statLabel}>Suspended</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#a855f7'}}>{stats.starshareUsers}</div>
            <div style={styles.statLabel}>Premium+</div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>Customers ({users.length})</div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Package</th>
              <th style={styles.th}>Tier</th>
              <th style={styles.th}>StarShare</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td style={styles.td}>
                  <span style={styles.code}>{user.username}</span>
                </td>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.package}</td>
                <td style={styles.td}><TierBadge tier={user.tier} /></td>
                <td style={styles.td}>
                  {user.starshareEnabled ? '✅' : '❌'}
                </td>
                <td style={styles.td}><StatusBadge status={user.status} /></td>
                <td style={styles.td}>
                  {user.status === 'active' ? (
                    <button style={styles.buttonSecondary} onClick={() => handleSuspend(user.username)}>
                      Suspend
                    </button>
                  ) : (
                    <button style={{...styles.buttonSecondary, backgroundColor: '#22c55e'}} onClick={() => handleActivate(user.username)}>
                      Activate
                    </button>
                  )}
                  <button style={styles.buttonDanger} onClick={() => handleDelete(user.username)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Packages */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>Packages</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ backgroundColor: '#0a0a0a', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>{pkg.name}</div>
              <div style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>
                {pkg.price.toLocaleString()} <span style={{ fontSize: '14px', color: '#888' }}>{pkg.currency}/mo</span>
              </div>
              <div style={{ color: '#888', fontSize: '13px', marginTop: '10px' }}>{pkg.description}</div>
              <div style={{ marginTop: '15px' }}>
                <TierBadge tier={pkg.tier} />
                {pkg.starshare && <span style={{...styles.badge, ...styles.badgePremium, marginLeft: '5px'}}>+ StarShare</span>}
              </div>
              <ul style={{ marginTop: '15px', paddingLeft: '20px', color: '#aaa', fontSize: '13px' }}>
                {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateUserModal
          packages={packages}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}

export default App;
