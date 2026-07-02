import React, { useState, useEffect } from 'react';
import { FiPlus, FiServer, FiCircle, FiRefreshCw, FiSearch, FiSliders, FiDownload } from 'react-icons/fi';
import { getWorkers, createWorker, updateWorkerStatus } from '../api/api';

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jobFilter, setJobFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
  });

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load workers. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      const newWorker = await createWorker(formData.name);
      setFormData({ name: '' });
      setShowModal(false);
      if (window.showToast) window.showToast(`Worker "${newWorker.name}" registered successfully!`, 'success');
      fetchWorkers();
    } catch (err) {
      console.error(err);
      setError('Failed to create worker. Please try again.');
      if (window.showToast) window.showToast('Failed to register worker', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (workerId, newStatus) => {
    setError('');
    setStatusUpdatingId(workerId);

    try {
      await updateWorkerStatus(workerId, newStatus);
      if (window.showToast) window.showToast(`Worker status updated to ${newStatus}!`, 'success');
      setWorkers(workers.map(w => w.id === workerId ? { ...w, status: newStatus } : w));
    } catch (err) {
      console.error(err);
      setError('Failed to update worker status.');
      if (window.showToast) window.showToast('Failed to update worker status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Client-side CSV export
  const handleExportCSV = () => {
    if (filteredWorkers.length === 0) return;

    const headers = ['ID', 'Worker Name', 'Status', 'Current Job ID', 'Last Heartbeat', 'Registered At', 'Updated At'];
    const csvRows = [headers.join(',')];

    filteredWorkers.forEach(w => {
      const row = [
        w.id,
        w.name,
        w.status,
        w.current_job_id || 'None',
        w.last_heartbeat || 'Never',
        w.created_at || '-',
        w.updated_at || '-'
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `workers_export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.showToast) window.showToast('Workers exported successfully!', 'success');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-success';
      case 'IDLE':
        return 'text-warning';
      case 'BUSY':
        return 'text-primary';
      case 'OFFLINE':
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatLastHeartbeat = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Perform client-side filtering
  const filteredWorkers = workers.filter(w => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const idMatch = w.id.toString().includes(q);
      const nameMatch = w.name.toLowerCase().includes(q);
      if (!idMatch && !nameMatch) return false;
    }

    if (statusFilter !== 'ALL' && w.status !== statusFilter) {
      return false;
    }

    if (jobFilter !== 'ALL') {
      const hasJob = !!w.current_job_id;
      if (jobFilter === 'ASSIGNED' && !hasJob) return false;
      if (jobFilter === 'UNASSIGNED' && hasJob) return false;
    }

    return true;
  });

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Worker Cluster Nodes</h2>
          <p className="text-muted mb-0">Inspect heartbeat telemetry, cluster capacity, and workload distribution.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline-secondary btn-sm rounded-3 py-2 px-3 fw-semibold d-flex align-items-center"
            disabled={filteredWorkers.length === 0}
          >
            <FiDownload className="me-2" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchWorkers}
            className="btn btn-outline-primary btn-sm rounded-3 py-2 px-3 d-flex align-items-center"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinner-border spinner-border-sm border-0' : ''} />
            <span className="ms-2">Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary-custom d-flex align-items-center py-2 px-3"
          >
            <FiPlus className="me-2" />
            <span>Register Worker</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 py-2 px-3 small border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="card border-0 rounded-4 glass-panel p-4 mb-4">
        <div className="row g-3">
          {/* Search Box */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-secondary">Search name / ID</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiSearch className="text-muted me-2" />
              <input
                type="text"
                className="form-control border-0 p-0 shadow-none small text-dark bg-transparent"
                placeholder="Search worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-12 col-sm-6 col-md-4">
            <label className="form-label small fw-semibold text-secondary">Status Filter</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiCircle className="text-success me-2" />
              <select
                className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="IDLE">IDLE</option>
                <option value="BUSY">BUSY</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
          </div>

          {/* Workload Filter */}
          <div className="col-12 col-sm-6 col-md-4">
            <label className="form-label small fw-semibold text-secondary">Workload Filter</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiSliders className="text-primary me-2" />
              <select
                className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="ALL">All Workloads</option>
                <option value="ASSIGNED">Has Assigned Job</option>
                <option value="UNASSIGNED">No Assigned Job (Idle)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="card border-0 rounded-4 glass-panel p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading workers...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-5">
            <FiServer size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Workers Found</h5>
            <p className="text-muted small">No cluster nodes match the selected search or filter context.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                    <div className="d-flex align-items-center">
                      <div className="bg-light text-primary rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <FiServer size={20} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{worker.name}</h6>
                        <span className="text-muted small">Worker ID: #{worker.id}</span>
                      </div>
                    </div>
                    <span className={`small fw-bold d-flex align-items-center ${getStatusColor(worker.status)}`}>
                      <FiCircle className="fill-current me-1" size={8} />
                      {worker.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small fw-medium">Current Job</span>
                      <span className="text-dark small fw-bold">
                        {worker.current_job_id ? `Job #${worker.current_job_id}` : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small fw-medium">Last Heartbeat</span>
                      <span className="text-dark small fw-bold">{formatLastHeartbeat(worker.last_heartbeat)}</span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between pt-2 border-top">
                    <span className="text-muted small">Registered:</span>
                    <span className="text-dark small fw-bold">{formatDate(worker.created_at)}</span>
                  </div>

                  <div className="mt-3 pt-3 border-top">
                    <label className="form-label small fw-semibold text-secondary mb-1">Update Status</label>
                    <select
                      className="form-select form-select-sm rounded-3 py-2"
                      value={worker.status}
                      onChange={(e) => handleUpdateStatus(worker.id, e.target.value)}
                      disabled={statusUpdatingId === worker.id}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="IDLE">IDLE</option>
                      <option value="BUSY">BUSY</option>
                      <option value="OFFLINE">OFFLINE</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Worker Modal */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Register Worker</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateWorker}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Worker Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2"
                      placeholder="e.g. worker-prod-primary-01"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-3 px-4 py-2" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom rounded-3 px-4 py-2" disabled={submitting}>
                    {submitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : null}
                    <span>Register</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
