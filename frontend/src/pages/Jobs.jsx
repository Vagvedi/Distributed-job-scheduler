import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiList, FiSearch, FiCalendar, FiCpu, FiClock, FiDownload } from 'react-icons/fi';
import {
  getJobs,
  getAllQueues,
  getJobsByQueue,
  createJob,
  updateJobStatus,
  deleteJob,
  getWorkers
} from '../api/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [queues, setQueues] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState('ALL');
  
  const [loading, setLoading] = useState(false);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    queue_id: '',
    payload: '',
    priority: 1,
    max_retries: 3,
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [workerFilter, setWorkerFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Load all queues and workers initially
  const loadInitialData = async () => {
    try {
      setLoadingQueues(true);
      const [queuesData, workersData] = await Promise.all([
        getAllQueues(),
        getWorkers()
      ]);
      setQueues(queuesData);
      setWorkers(workersData);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize page data.');
    } finally {
      setLoadingQueues(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch jobs based on selectedQueueId
  const fetchJobsList = async () => {
    try {
      setLoading(true);
      setError('');
      let data = [];
      if (selectedQueueId === 'ALL') {
        data = await getJobs();
      } else {
        data = await getJobsByQueue(parseInt(selectedQueueId, 10));
      }
      setJobs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsList();
  }, [selectedQueueId]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!formData.queue_id || !formData.payload.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      await createJob(
        parseInt(formData.queue_id, 10),
        formData.payload,
        parseInt(formData.priority, 10),
        parseInt(formData.max_retries, 10)
      );
      setFormData({ queue_id: '', payload: '', priority: 1, max_retries: 3 });
      setShowModal(false);
      if (window.showToast) window.showToast('Job created successfully!', 'success');
      
      // Refresh jobs list
      fetchJobsList();
    } catch (err) {
      console.error(err);
      setError('Failed to create job. Please verify queue and parameters.');
      if (window.showToast) window.showToast('Failed to create job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    setError('');
    setStatusUpdatingId(jobId);

    try {
      const response = await updateJobStatus(jobId, newStatus);
      if (window.showToast) {
        if (response.status === 'DEAD_LETTER') {
          window.showToast(`Job #${jobId} exceeded retry limit and moved to Dead Letter!`, 'warning');
        } else {
          window.showToast(`Job status updated to ${response.status}!`, 'success');
        }
      }
      // Refresh jobs list to sync all database values (like retry_count and status)
      fetchJobsList();
    } catch (err) {
      console.error(err);
      setError('Failed to update job status.');
      if (window.showToast) window.showToast('Failed to update status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    setError('');

    try {
      await deleteJob(jobId);
      if (window.showToast) window.showToast('Job deleted successfully!', 'success');
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      console.error(err);
      setError('Failed to delete job.');
      if (window.showToast) window.showToast('Failed to delete job', 'error');
    }
  };

  // Client-side CSV export
  const handleExportCSV = () => {
    if (filteredJobs.length === 0) return;

    const headers = [
      'ID', 'Queue ID', 'Queue Name', 'Payload', 'Status', 'Priority', 
      'Retry Count', 'Max Retries', 'Retry Delay (Seconds)', 
      'Created At', 'Started At', 'Completed At', 'Assigned Worker'
    ];

    const csvRows = [headers.join(',')];

    filteredJobs.forEach(job => {
      const q = queues.find(queue => queue.id === job.queue_id);
      const workerInfo = workers.find(w => w.current_job_id === job.id);
      
      const row = [
        job.id,
        job.queue_id,
        q ? q.name : `Queue #${job.queue_id}`,
        `"${job.payload.replace(/"/g, '""')}"`,
        job.status,
        job.priority,
        job.retry_count,
        job.max_retries,
        job.retry_delay_seconds,
        job.created_at || '-',
        job.started_at || '-',
        job.completed_at || '-',
        workerInfo ? workerInfo.name : 'None'
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jobs_export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.showToast) window.showToast('CSV exported successfully!', 'success');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'QUEUED': 'bg-secondary-subtle text-secondary',
      'RUNNING': 'bg-primary-subtle text-primary',
      'SUCCESS': 'bg-success-subtle text-success',
      'FAILED': 'bg-danger-subtle text-danger',
      'RETRY': 'bg-warning-subtle text-warning',
      'DEAD_LETTER': 'bg-dark text-white',
    };
    return (
      <span className={`badge px-3 py-2 rounded-pill ${statusColors[status] || 'bg-secondary-subtle text-secondary'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getQueueName = (queueId) => {
    const queue = queues.find((q) => q.id === queueId);
    return queue ? queue.name : `Queue #${queueId}`;
  };

  // Perform client-side filtering
  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const idMatch = job.id.toString().includes(q);
      const payloadMatch = job.payload.toLowerCase().includes(q);
      if (!idMatch && !payloadMatch) return false;
    }

    if (statusFilter !== 'ALL' && job.status !== statusFilter) {
      return false;
    }

    if (workerFilter !== 'ALL') {
      const assignedWorker = workers.find(w => w.current_job_id === job.id);
      if (!assignedWorker || assignedWorker.id.toString() !== workerFilter) {
        return false;
      }
    }

    if (priorityFilter !== 'ALL' && job.priority.toString() !== priorityFilter) {
      return false;
    }

    if (dateFilter) {
      if (!job.created_at) return false;
      const jobDate = new Date(job.created_at).toISOString().split('T')[0];
      if (jobDate !== dateFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Job Management</h2>
          <p className="text-muted mb-0">Create, monitor, filter, and export background jobs.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline-secondary btn-sm rounded-3 py-2 px-3 fw-semibold d-flex align-items-center"
            disabled={filteredJobs.length === 0}
          >
            <FiDownload className="me-2" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary-custom d-flex align-items-center py-2 px-3"
            disabled={queues.length === 0}
          >
            <FiPlus className="me-2" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 py-2 px-3 small border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Queue & Search Filters Panel */}
      <div className="card border-0 rounded-4 glass-panel p-4 mb-4">
        <div className="row g-3">
          {/* Queue Filter */}
          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label small fw-semibold text-secondary">Queue Filter</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiList className="text-primary me-2" />
              <select
                className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
                value={selectedQueueId}
                onChange={(e) => setSelectedQueueId(e.target.value)}
                disabled={loadingQueues}
                style={{ cursor: 'pointer' }}
              >
                <option value="ALL">All Queues</option>
                {queues.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="col-12 col-md-8 col-lg-3">
            <label className="form-label small fw-semibold text-secondary">Search payload / ID</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiSearch className="text-muted me-2" />
              <input
                type="text"
                className="form-control border-0 p-0 shadow-none small text-dark bg-transparent"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-12 col-sm-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary">Status Filter</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiClock className="text-warning me-2" />
              <select
                className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="QUEUED">QUEUED</option>
                <option value="RUNNING">RUNNING</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="RETRY">RETRY</option>
                <option value="DEAD_LETTER">DEAD_LETTER</option>
              </select>
            </div>
          </div>

          {/* Worker Filter */}
          <div className="col-12 col-sm-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary">Worker Filter</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiCpu className="text-info me-2" />
              <select
                className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="ALL">All Workers</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Date Filters */}
          <div className="col-12 col-sm-6 col-md-4 col-lg-2">
            <label className="form-label small fw-semibold text-secondary">Date Filter</label>
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm">
              <FiCalendar className="text-success me-2" />
              <input
                type="date"
                className="form-control border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card border-0 rounded-4 glass-panel p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-dark">
            Jobs List: <span className="text-primary">{selectedQueueId === 'ALL' ? 'All Queues' : getQueueName(parseInt(selectedQueueId, 10))}</span>
          </h5>
          <span className="text-muted small">Showing {filteredJobs.length} of {jobs.length} jobs</span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading jobs...</p>
          </div>
        ) : queues.length === 0 ? (
          <div className="text-center py-5">
            <FiList size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Queues Configured</h5>
            <p className="text-muted small mb-4">Create your first queue context to start scheduling jobs.</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-5">
            <FiList size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Jobs Found</h5>
            <p className="text-muted small">No jobs match your search or selected filter options.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '8%' }}>ID</th>
                  <th scope="col" style={{ width: '15%' }}>Queue</th>
                  <th scope="col" style={{ width: '25%' }}>Payload</th>
                  <th scope="col" style={{ width: '8%' }}>Priority</th>
                  <th scope="col" style={{ width: '12%' }}>Status</th>
                  <th scope="col" style={{ width: '10%' }}>Retry Count</th>
                  <th scope="col" style={{ width: '12%' }}>Created At</th>
                  <th scope="col" style={{ width: '10%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const workerInfo = workers.find(w => w.current_job_id === job.id);
                  return (
                    <tr key={job.id}>
                      <td>
                        <span className="badge bg-light text-dark px-2 py-1 font-monospace">#{job.id}</span>
                      </td>
                      <td>
                        <span className="text-muted small fw-semibold">{getQueueName(job.queue_id)}</span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={job.payload}>
                          <span className="text-dark small">{job.payload}</span>
                        </div>
                        {workerInfo && (
                          <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                            <FiCpu className="me-1" size={10} />
                            Worker: {workerInfo.name}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill font-monospace fw-semibold">
                          P{job.priority}
                        </span>
                      </td>
                      <td>
                        {getStatusBadge(job.status)}
                      </td>
                      <td>
                        <span className="text-muted small font-monospace">{job.retry_count}/{job.max_retries}</span>
                      </td>
                      <td>
                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{formatDate(job.created_at)}</span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <select
                            className="form-select form-select-sm rounded-3 py-1 px-2"
                            style={{ width: 'auto', fontSize: '0.75rem', cursor: 'pointer' }}
                            value={job.status}
                            onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                            disabled={statusUpdatingId === job.id}
                          >
                            <option value="QUEUED">QUEUED</option>
                            <option value="RUNNING">RUNNING</option>
                            <option value="SUCCESS">SUCCESS</option>
                            <option value="FAILED">FAILED</option>
                            <option value="RETRY">RETRY</option>
                            <option value="DEAD_LETTER">DEAD_LETTER</option>
                          </select>
                          <button
                            onClick={() => handleDeleteJob(job.id)}
                            className="btn btn-outline-danger btn-sm rounded-3 py-1 px-2"
                            title="Delete Job"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Create Job</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateJob}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Queue</label>
                    <select
                      className="form-select rounded-3 py-2"
                      value={formData.queue_id}
                      onChange={(e) => setFormData({ ...formData, queue_id: e.target.value })}
                      required
                      disabled={loadingQueues}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Select a queue</option>
                      {queues.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Payload</label>
                    <textarea
                      className="form-control rounded-3 py-2"
                      placeholder="Enter job payload (JSON or text)"
                      value={formData.payload}
                      onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                      required
                      rows={4}
                      autoFocus
                    />
                  </div>

                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold text-secondary">Priority</label>
                      <input
                        type="number"
                        className="form-control rounded-3 py-2"
                        value={formData.priority}
                        min="1"
                        max="100"
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold text-secondary">Max Retries</label>
                      <input
                        type="number"
                        className="form-control rounded-3 py-2"
                        value={formData.max_retries}
                        min="0"
                        max="10"
                        onChange={(e) => setFormData({ ...formData, max_retries: e.target.value })}
                        required
                      />
                    </div>
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
                    <span>Create</span>
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

export default Jobs;
