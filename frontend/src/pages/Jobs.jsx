import React from 'react';
import { FiPlayCircle, FiCheckCircle, FiXCircle, FiClock, FiInfo } from 'react-icons/fi';

const Jobs = () => {
  // Premium mock jobs data
  const mockJobs = [
    { id: 'job-9842', name: 'image-resize-task-23', queue: 'media-processing', status: 'running', progress: 68, duration: '1.2s', created: '10s ago' },
    { id: 'job-9841', name: 'sync-user-db', queue: 'auth-sync', status: 'success', progress: 100, duration: '3.4s', created: '2m ago' },
    { id: 'job-9840', name: 'send-welcome-emails', queue: 'notifications', status: 'success', progress: 100, duration: '0.8s', created: '5m ago' },
    { id: 'job-9839', name: 'generate-monthly-report', queue: 'reporting', status: 'failed', progress: 45, duration: '12.1s', created: '15m ago' },
    { id: 'job-9838', name: 'aggregate-analytics-logs', queue: 'analytics-heavy', status: 'success', progress: 100, duration: '45.2s', created: '1h ago' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">RUNNING</span>;
      case 'success':
        return <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill">SUCCESS</span>;
      case 'failed':
        return <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill">FAILED</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill">PENDING</span>;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Job Executions</h2>
          <p className="text-muted mb-0">Monitor active processes, schedule tasks, and inspect failures.</p>
        </div>
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-3 py-2 px-3 fw-semibold">
          Placeholder Mode
        </span>
      </div>

      {/* Info Warning Alert */}
      <div className="alert alert-primary rounded-4 border-0 p-4 mb-4 d-flex align-items-start shadow-sm">
        <FiInfo className="text-primary me-3 mt-1" size={24} />
        <div>
          <h6 className="fw-bold text-dark mb-1">Execution Metrics Mocked</h6>
          <p className="text-muted small mb-0">
            The frontend interface below demonstrates the proposed architecture for monitoring jobs. 
            Backend endpoints for scheduling and tracking jobs are scheduled for implementation in the next phase.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-primary mb-0 me-3">
                <FiPlayCircle />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Active Executions</p>
                <h4 className="fw-bold mb-0 text-dark">14</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-success mb-0 me-3">
                <FiCheckCircle />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Successful Today</p>
                <h4 className="fw-bold mb-0 text-dark">1,204</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-danger mb-0 me-3">
                <FiXCircle />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Failed Today</p>
                <h4 className="fw-bold mb-0 text-dark">5</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-warning mb-0 me-3">
                <FiClock />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Avg Duration</p>
                <h4 className="fw-bold mb-0 text-dark">4.2s</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card border-0 rounded-4 glass-panel p-4">
        <h5 className="fw-bold mb-3 text-dark">Recent Executed Jobs</h5>
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th scope="col" style={{ width: '15%' }}>Job ID</th>
                <th scope="col" style={{ width: '25%' }}>Task Target</th>
                <th scope="col" style={{ width: '20%' }}>Queue</th>
                <th scope="col" style={{ width: '15%' }}>Status</th>
                <th scope="col" style={{ width: '15%' }}>Runtime</th>
                <th scope="col" style={{ width: '10%' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {mockJobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <span className="badge bg-light text-dark px-2 py-1 font-monospace">{job.id}</span>
                  </td>
                  <td>
                    <div>
                      <span className="fw-semibold text-dark">{job.name}</span>
                      {job.status === 'running' && (
                        <div className="progress mt-1" style={{ height: '4px', width: '120px' }}>
                          <div 
                            className="progress-bar progress-bar-striped progress-bar-animated" 
                            role="progressbar" 
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-muted small">{job.queue}</span>
                  </td>
                  <td>
                    {getStatusBadge(job.status)}
                  </td>
                  <td>
                    <span className="text-dark small font-monospace">{job.duration}</span>
                  </td>
                  <td>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{job.created}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
