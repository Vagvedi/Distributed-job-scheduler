import React, { useState, useEffect } from 'react';
import { getOrganizations, getProjects, createProject } from '../api/api';
import { FiPlus, FiFolder, FiCheckCircle, FiInfo, FiLayers } from 'react-icons/fi';

const Projects = () => {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

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
        setError('Failed to fetch organizations. Make sure FastAPI backend is running.');
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
      return;
    }

    const fetchProjectsList = async () => {
      try {
        setLoadingProjects(true);
        setError('');
        const data = await getProjects(selectedOrgId);
        setProjects(data);
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve projects for selected organization.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjectsList();
  }, [selectedOrgId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim() || !selectedOrgId) return;

    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await createProject(name, parseInt(selectedOrgId, 10));
      setName('');
      setShowModal(false);
      setMessage('Project created successfully!');
      
      // Refresh list
      const data = await getProjects(selectedOrgId);
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError('Failed to create project. Please verify backend state.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedOrgName = () => {
    const org = orgs.find((o) => o.id.toString() === selectedOrgId);
    return org ? org.name : '';
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Projects</h2>
          <p className="text-muted mb-0">Organize your computational flows and task queues by project.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Organization Select Dropdown */}
          <div className="d-flex align-items-center bg-white rounded-3 px-3 py-2 border shadow-sm" style={{ minWidth: '220px' }}>
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

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary-custom d-flex align-items-center py-2 px-3 flex-shrink-0"
            disabled={orgs.length === 0}
          >
            <FiPlus className="me-2" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 py-2 px-3 small border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success rounded-3 py-2 px-3 small border-0 mb-4 d-flex align-items-center" role="alert">
          <FiCheckCircle className="me-2" />
          {message}
        </div>
      )}

      {/* Projects Display */}
      <div className="card border-0 rounded-4 glass-panel p-4">
        {loadingProjects ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading projects...</p>
          </div>
        ) : !selectedOrgId ? (
          <div className="text-center py-5">
            <FiFolder size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Organization Selected</h5>
            <p className="text-muted small">Please select or create an organization first to configure projects.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-5">
            <FiFolder size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Projects in {getSelectedOrgName()}</h5>
            <p className="text-muted small mb-4">Group queues together by creating your first project here.</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary-custom btn-sm py-2 px-3"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '10%' }}>ID</th>
                  <th scope="col" style={{ width: '50%' }}>Project Name</th>
                  <th scope="col" style={{ width: '40%' }}>Organization</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj.id}>
                    <td>
                      <span className="badge bg-light text-dark px-2 py-1 font-monospace">#{proj.id}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-light text-success rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                          <FiFolder />
                        </div>
                        <span className="fw-semibold text-dark">{proj.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted small fw-medium">{getSelectedOrgName()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Create Project</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateProject}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Organization Workspace</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2 bg-light text-muted border-0"
                      value={getSelectedOrgName()}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Project Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2"
                      placeholder="e.g. data-processing-pipeline"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="bg-light text-muted p-3 rounded-3 small d-flex align-items-start">
                    <FiInfo className="text-primary me-2 mt-1 flex-shrink-0" />
                    <span>Projects organize related task queues together and define settings, metrics, and workers allocation.</span>
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
                    <span>Create Project</span>
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

export default Projects;
