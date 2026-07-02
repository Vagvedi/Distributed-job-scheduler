import React, { useState, useEffect } from 'react';
import { getOrganizations, createOrganization } from '../api/api';
import { FiPlus, FiTrash2, FiUsers, FiCheckCircle, FiInfo } from 'react-icons/fi';

const Organizations = () => {
  const [orgs, setOrgs] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getOrganizations();
      setOrgs(data);
    } catch (err) {
      console.error(err);
      setError('Could not load organizations. Make sure FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      await createOrganization(name);
      setName('');
      setShowModal(false);
      setMessage('Organization created successfully!');
      fetchOrganizations();
    } catch (err) {
      console.error(err);
      setError('Failed to create organization. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlaceholder = (orgName) => {
    alert(`Delete action for "${orgName}" clicked. Note: Deletion endpoints are not supported by the FastAPI backend yet.`);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Organizations</h2>
          <p className="text-muted mb-0">Manage organizational workspaces and teams.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary-custom d-flex align-items-center py-2 px-3"
        >
          <FiPlus className="me-2" />
          <span>New Organization</span>
        </button>
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

      {/* Organizations List */}
      <div className="card border-0 rounded-4 glass-panel p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading organizations...</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-5">
            <FiUsers size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No Organizations Found</h5>
            <p className="text-muted small mb-4">Get started by creating your first organization space.</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary-custom btn-sm py-2 px-3"
            >
              Create Organization
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '10%' }}>ID</th>
                  <th scope="col" style={{ width: '70%' }}>Organization Name</th>
                  <th scope="col" style={{ width: '20%' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <span className="badge bg-light text-dark px-2 py-1 font-monospace">#{org.id}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-light text-primary rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                          <FiUsers />
                        </div>
                        <span className="fw-semibold text-dark">{org.name}</span>
                      </div>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleDeletePlaceholder(org.name)}
                        className="btn btn-outline-danger btn-sm rounded-3 py-2 px-3"
                        title="Delete Organization"
                      >
                        <FiTrash2 className="me-1" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bootstrap Modal Custom Overlay */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Create Organization</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateOrg}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Organization Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2"
                      placeholder="e.g. Acme Corp"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="bg-light text-muted p-3 rounded-3 small d-flex align-items-start">
                    <FiInfo className="text-primary me-2 mt-1 flex-shrink-0" />
                    <span>Creating an organization creates a dedicated workspace for you to organize project pipelines and deploy task queues.</span>
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

export default Organizations;
