import React, { useState, useEffect } from 'react';
import { getOrganizations, getProjects, getQueues, createQueue, updateQueueStatus } from '../api/api';
import { FiPlus, FiList, FiCheckCircle, FiInfo, FiLayers, FiFolder, FiRefreshCw } from 'react-icons/fi';

const Queues = () => {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [queues, setQueues] = useState([]);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState('active');

  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Status Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Load organizations initially
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoadingOrgs(true);
        setError('');
        const data = await getOrganizations();
        setOrgs(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch organizations.');
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  // Fetch projects when selected organization changes
  useEffect(() => {
    if (!selectedOrgId) {
      setProjects([]);
      setSelectedProjectId('');
      return;
    }

    const fetchProjectsList = async () => {
      try {
        setLoadingProjects(true);
        setError('');
        const data = await getProjects(selectedOrgId);
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id.toString());
        } else {
          setSelectedProjectId('');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load projects for selected organization.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjectsList();
  }, [selectedOrgId]);

  // Fetch queues when selected project changes
  const fetchQueuesList = async () => {
    if (!selectedProjectId) {
      setQueues([]);
      return;
    }

    try {
      setLoadingQueues(true);
      setError('');
      const data = await getQueues(selectedProjectId);
      setQueues(data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve queues for the selected project.');
    } finally {
      setLoadingQueues(false);
    }
  };

  useEffect(() => {
    fetchQueuesList();
  }, [selectedProjectId]);

  const handleCreateQueue = async (e) => {
    e.preventDefault();
    if (!name.trim() || !selectedProjectId) return;

    setError('');
    setSubmitting(true);

    try {
      const newQueue = await createQueue(
        parseInt(selectedProjectId, 10),
        name,
        parseInt(priority, 10),
        status
      );
      setName('');
      setPriority(1);
      setStatus('active');
      setShowModal(false);
      if (window.showToast) window.showToast(`Queue "${newQueue.name}" created successfully!`, 'success');
      
      // Refresh queues list
      fetchQueuesList();
    } catch (err) {
      console.error(err);
      setError('Failed to create queue. Please verify priority and queue parameters.');
      if (window.showToast) window.showToast('Failed to create queue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (queueId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setError('');
    setStatusUpdatingId(queueId);

    try {
      await updateQueueStatus(queueId, nextStatus);
      if (window.showToast) window.showToast(`Queue is now ${nextStatus}!`, 'success');
      // Update in local state to avoid full reload flickers
      setQueues(queues.map(q => q.id === queueId ? { ...q, status: nextStatus } : q));
    } catch (err) {
      console.error(err);
      setError('Failed to update queue status.');
      if (window.showToast) window.showToast('Failed to update status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const getSelectedOrgName = () => {
    const org = orgs.find((o) => o.id.toString() === selectedOrgId);
    return org ? org.name : '';
  };

  const getSelectedProjectName = () => {
    const proj = projects.find((p) => p.id.toString() === selectedProjectId);
    return proj ? proj.name : '';
  };

  // Perform client-side status filtering
  const filteredQueues = queues.filter(q => {
    if (statusFilter !== 'ALL') {
      return q.status.toLowerCase() === statusFilter.toLowerCase();
    }
    return true;
  });

  return (
    <div>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Queues</h2>
          <p className="text-muted mb-0">Monitor queue priorities, configure statuses, and toggle activity states.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          {/* Org Selector */}
          <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm" style={{ minWidth: '180px' }}>
            <FiLayers className="text-primary me-2" />
            <select
              className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={loadingOrgs}
              style={{ cursor: 'pointer' }}
            >
              {loadingOrgs ? (
                <option>Loading workspace...</option>
              ) : orgs.length === 0 ? (
                <option value="">No organizations</option>
              ) : (
                orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Project Selector */}
          <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm" style={{ minWidth: '180px' }}>
            <FiFolder className="text-success me-2" />
            <select
              className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={loadingProjects || !selectedOrgId}
              style={{ cursor: 'pointer' }}
            >
              {loadingProjects ? (
                <option>Loading projects...</option>
              ) : projects.length === 0 ? (
                <option value="">No projects found</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary-custom d-flex align-items-center py-2 px-3 flex-shrink-0"
            disabled={!selectedProjectId}
          >
            <FiPlus className="me-2" />
            <span>New Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 py-2 px-3 small border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Queues Display */}
      <div className="card border-0 rounded-4 glass-panel p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-dark">
            Queues in: <span className="text-primary">{getSelectedProjectName() || 'No Project Selected'}</span>
          </h5>
          
          <div className="d-flex align-items-center gap-2">
            {/* Status Filter */}
            {selectedProjectId && (
              <div className="d-flex align-items-center bg-white rounded-3 px-2 py-1 border shadow-sm" style={{ minWidth: '130px', fontSize: '0.8rem' }}>
                <FiList className="text-warning me-2" size={14} />
                <select
                  className="form-select border-0 p-0 shadow-none fw-medium text-dark bg-transparent small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            
            {selectedProjectId && (
              <button 
                onClick={fetchQueuesList}
                className="btn btn-light btn-sm rounded-3 p-2 text-secondary d-flex align-items-center"
                title="Refresh queues"
                disabled={loadingQueues}
              >
                <FiRefreshCw className={loadingQueues ? 'spinner-border spinner-border-sm border-0' : ''} />
              </button>
            )}
          </div>
        </div>

        {loadingQueues ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading queues...</p>
          </div>
        ) : !selectedProjectId ? (
          <div className="text-center py-5">
            <FiList size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Project Selected</h5>
            <p className="text-muted small">Please choose or configure an active project context to list scheduler queues.</p>
          </div>
        ) : filteredQueues.length === 0 ? (
          <div className="text-center py-5">
            <FiList size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Queues Found</h5>
            <p className="text-muted small">No queue pipelines match the selected filters for project "{getSelectedProjectName()}".</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '10%' }}>ID</th>
                  <th scope="col" style={{ width: '35%' }}>Queue Name</th>
                  <th scope="col" style={{ width: '15%' }}>Priority</th>
                  <th scope="col" style={{ width: '20%' }}>Status</th>
                  <th scope="col" style={{ width: '20%' }} className="text-end">Toggle Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueues.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <span className="badge bg-light text-dark px-2 py-1 font-monospace">#{q.id}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-light text-warning rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                          <FiList />
                        </div>
                        <span className="fw-semibold text-dark">{q.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill font-monospace fw-semibold">
                        P{q.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge px-3 py-2 rounded-pill ${q.status === 'active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {q.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="form-check form-switch d-inline-block text-start">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id={`switch-${q.id}`}
                          checked={q.status === 'active'}
                          disabled={statusUpdatingId === q.id}
                          onChange={() => handleToggleStatus(q.id, q.status)}
                          style={{ cursor: statusUpdatingId === q.id ? 'not-allowed' : 'pointer' }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Queue Modal */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Create Queue</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateQueue}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Project Context</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2 bg-light text-muted border-0"
                      value={`${getSelectedOrgName()} / ${getSelectedProjectName()}`}
                      disabled
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Queue Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2"
                      placeholder="e.g. video-rendering-queue"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold text-secondary">Priority</label>
                      <input
                        type="number"
                        className="form-control rounded-3 py-2"
                        value={priority}
                        min="1"
                        max="100"
                        onChange={(e) => setPriority(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold text-secondary">Initial Status</label>
                      <select
                        className="form-select rounded-3 py-2"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-light text-muted p-3 rounded-3 small d-flex align-items-start mt-2">
                    <FiInfo className="text-primary me-2 mt-1 flex-shrink-0" />
                    <span>Queues route background jobs to active worker instances. Higher priority queues are processed preferentially.</span>
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
                    <span>Create Queue</span>
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

export default Queues;
