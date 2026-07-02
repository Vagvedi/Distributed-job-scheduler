import React, { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiList } from 'react-icons/fi';
import {
  getJobs,
  getAllQueues,
  getJobsByQueue,
  createJob,
  updateJobStatus,
  deleteJob,
} from '../api/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    queue_id: '',
    payload: '',
    priority: 1,
    max_retries: 3,
  });

  // Load all queues initially
  useEffect(() => {
    const fetchQueuesList = async () => {
      try {
        setLoadingQueues(true);
        const data = await getAllQueues();
        setQueues(data);
        if (data.length > 0) {
          setSelectedQueueId(data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load queues.');
      } finally {
        setLoadingQueues(false);
      }
    };

    fetchQueuesList();
  }, []);

  // Fetch jobs when selected queue changes
  useEffect(() => {
    if (!selectedQueueId) {
      setJobs([]);
      return;
    }

    const fetchJobsList = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getJobsByQueue(selectedQueueId);
        setJobs(data);
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve jobs for the selected queue.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobsList();
  }, [selectedQueueId]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!formData.queue_id || !formData.payload.trim()) return;

    setError('');
    setMessage('');
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
      setMessage('Job created successfully!');
      
      // Refresh jobs list
      const data = await getJobsByQueue(selectedQueueId);
      setJobs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to create job. Please verify queue and parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    setError('');
    setMessage('');
    setStatusUpdatingId(jobId);

    try {
      await updateJobStatus(jobId, newStatus);
      setMessage(`Job status updated to ${newStatus}!`);
      // Update in local state
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (err) {
      console.error(err);
      setError('Failed to update job status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    setError('');
    setMessage('');

    try {
      await deleteJob(jobId);
      setMessage('Job deleted successfully!');
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      console.error(err);
      setError('Failed to delete job.');
    }
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

  const getSelectedQueueName = () => {
    const queue = queues.find((q) => q.id.toString() === selectedQueueId);
    return queue ? queue.name : '';
  };

  const getQueueProjectName = (queueId) => {
    const queue = queues.find((q) => q.id.toString() === queueId);
    return queue ? `Project ID: ${queue.project_id}` : '';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Job Management</h2>
          <p className="text-muted mb-0">Create, monitor, and manage background jobs.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary-custom d-flex align-items-center py-2 px-3"
          disabled={!selectedQueueId}
        >
          <FiPlus className="me-2" />
          <span>Create Job</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 py-2 px-3 small border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success rounded-3 py-2 px-3 small border-0 mb-4" role="alert">
          {message}
        </div>
      )}

      {/* Queue Selector */}
      {queues.length === 0 ? (
        <div className="card border-0 rounded-4 glass-panel p-4 mb-4">
          <div className="text-center py-4">
            <FiList size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Queues Found</h5>
            <p className="text-muted small mb-4">
              You need to create queues before you can manage jobs.
            </p>
            <button
              onClick={() => window.location.href = '/queues'}
              className="btn btn-primary-custom btn-sm py-2 px-3"
            >
              Go to Queues
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 rounded-4 glass-panel p-4 mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm" style={{ minWidth: '200px' }}>
              <FiList className="text-primary me-2" />
              <select
                className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
                value={selectedQueueId}
                onChange={(e) => setSelectedQueueId(e.target.value)}
                disabled={loadingQueues}
                style={{ cursor: 'pointer' }}
              >
                {loadingQueues ? (
                  <option>Loading queues...</option>
                ) : queues.length === 0 ? (
                  <option value="">No queues found</option>
                ) : (
                  queues.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <span className="text-muted small">
              {selectedQueueId ? `Showing jobs for: ${getSelectedQueueName()}` : 'Select a queue to view jobs'}
            </span>
          </div>
        </div>
      )}

      {/* Jobs Table */}
      <div className="card border-0 rounded-4 glass-panel p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading jobs...</p>
          </div>
        ) : !selectedQueueId ? (
          <div className="text-center py-5">
            <FiList size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Queue Selected</h5>
            <p className="text-muted small">Please select a queue to view jobs.</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-5">
            <FiList size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Jobs Found</h5>
            <p className="text-muted small mb-4">Create your first job in queue "{getSelectedQueueName()}".</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary-custom btn-sm py-2 px-3"
            >
              Create Job
            </button>
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
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <span className="badge bg-light text-dark px-2 py-1 font-monospace">#{job.id}</span>
                    </td>
                    <td>
                      <span className="text-muted small">{getSelectedQueueName()}</span>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '200px' }} title={job.payload}>
                        <span className="text-dark small">{job.payload}</span>
                      </div>
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
                          style={{ width: 'auto', fontSize: '0.75rem' }}
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
                ))}
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
