import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiTrash2, FiAlertOctagon } from 'react-icons/fi';
import { getDeadLetterEntries, deleteDeadLetterEntry } from '../api/api';

const DeadLetterQueue = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDeadLetterEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load Dead Letter Queue entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dead letter entry?')) {
      return;
    }
    setError('');
    setMessage('');
    setDeletingId(id);

    try {
      await deleteDeadLetterEntry(id);
      setMessage('Dead letter entry deleted successfully!');
      setEntries(entries.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete dead letter entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Dead Letter Queue</h2>
          <p className="text-muted mb-0">Monitor and manage jobs that have exceeded their maximum retry limits.</p>
        </div>
        <div>
          <button
            onClick={fetchEntries}
            className="btn btn-outline-primary btn-sm rounded-3 py-2 px-3 d-flex align-items-center"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spinner-border spinner-border-sm border-0' : ''} />
            <span className="ms-2">Refresh</span>
          </button>
        </div>
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

      <div className="card border-0 rounded-4 glass-panel p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2 small">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-5">
            <FiAlertOctagon size={48} className="text-muted mb-3" />
            <h5 className="fw-semibold text-dark">No failed jobs</h5>
            <p className="text-muted small">All systems are operational. No jobs are currently in the Dead Letter Queue.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table mb-0">
              <thead>
                <tr>
                  <th scope="col">Job ID</th>
                  <th scope="col">Queue</th>
                  <th scope="col">Failure Reason</th>
                  <th scope="col">Retry Count</th>
                  <th scope="col">Failed At</th>
                  <th scope="col">Assigned Worker</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className="badge bg-light text-dark px-2 py-1 font-monospace">#{entry.job_id}</span>
                    </td>
                    <td>
                      <span className="text-muted small fw-medium">{entry.queue_name || `Queue #${entry.queue_id}`}</span>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '300px' }} title={entry.failure_reason}>
                        <span className="text-danger small fw-medium">{entry.failure_reason || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-danger-subtle text-danger px-2 py-1 rounded-pill font-monospace fw-semibold">
                        {entry.retry_count}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{formatDate(entry.failed_at)}</span>
                    </td>
                    <td>
                      <span className="text-muted small">{entry.worker_name || (entry.worker_id ? `Worker #${entry.worker_id}` : '-')}</span>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn btn-outline-danger btn-sm rounded-3 py-1 px-2"
                        title="Delete Entry"
                        disabled={deletingId === entry.id}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadLetterQueue;
