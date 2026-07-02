import React from 'react';
import { FiCpu, FiServer, FiActivity, FiHardDrive, FiInfo, FiCircle } from 'react-icons/fi';

const Workers = () => {
  // Premium mock workers telemetry
  const mockWorkers = [
    { id: 'node-01', name: 'worker-prod-primary-01', ip: '10.0.4.12', cpu: 42, memory: 65, status: 'active', tasks: 6 },
    { id: 'node-02', name: 'worker-prod-secondary-02', ip: '10.0.4.13', cpu: 12, memory: 40, status: 'active', tasks: 2 },
    { id: 'node-03', name: 'worker-prod-heavy-03', ip: '10.0.6.20', cpu: 94, memory: 88, status: 'active', tasks: 6 },
    { id: 'node-04', name: 'worker-dev-sandbox', ip: '192.168.1.99', cpu: 0, memory: 15, status: 'idle', tasks: 0 },
    { id: 'node-05', name: 'worker-legacy-backup', ip: '10.0.9.15', cpu: 0, memory: 0, status: 'offline', tasks: 0 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'idle':
        return 'text-warning';
      case 'offline':
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">Worker Cluster Nodes</h2>
          <p className="text-muted mb-0">Inspect heartbeat telemetry, cluster capacity, and workload distribution.</p>
        </div>
        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-3 py-2 px-3 fw-semibold">
          Placeholder Mode
        </span>
      </div>

      {/* Info Warning Alert */}
      <div className="alert alert-primary rounded-4 border-0 p-4 mb-4 d-flex align-items-start shadow-sm">
        <FiInfo className="text-primary me-3 mt-1" size={24} />
        <div>
          <h6 className="fw-bold text-dark mb-1">Worker Heartbeats Mocked</h6>
          <p className="text-muted small mb-0">
            The cluster nodes view below details proposed telemetry analytics. 
            Backend agent heartbeats and daemon orchestration systems are scheduled for implementation in a later phase.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-primary mb-0 me-3">
                <FiServer />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Total Nodes</p>
                <h4 className="fw-bold mb-0 text-dark">5</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-success mb-0 me-3">
                <FiCpu />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Avg CPU Load</p>
                <h4 className="fw-bold mb-0 text-dark">29.6%</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-info mb-0 me-3">
                <FiHardDrive />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Memory Reserved</p>
                <h4 className="fw-bold mb-0 text-dark">41.6%</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
            <div className="d-flex align-items-center mb-2">
              <div className="card-icon-wrapper text-warning mb-0 me-3">
                <FiActivity />
              </div>
              <div>
                <p className="text-muted small mb-0 fw-semibold">Tasks Processing</p>
                <h4 className="fw-bold mb-0 text-dark">14</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="row g-4">
        {mockWorkers.map((worker) => (
          <div key={worker.id} className="col-12 col-md-6 col-xl-4">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                <div className="d-flex align-items-center">
                  <div className="bg-light text-primary rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <FiServer size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{worker.name}</h6>
                    <span className="text-muted small">{worker.ip}</span>
                  </div>
                </div>
                <span className={`small fw-bold d-flex align-items-center ${getStatusColor(worker.status)}`}>
                  <FiCircle className="fill-current me-1" size={8} />
                  {worker.status.toUpperCase()}
                </span>
              </div>

              {worker.status !== 'offline' ? (
                <div>
                  {/* CPU Usage bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small fw-medium">CPU Utilization</span>
                      <span className="text-dark small fw-bold">{worker.cpu}%</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className={`progress-bar ${worker.cpu > 85 ? 'bg-danger' : 'bg-primary'}`} 
                        role="progressbar" 
                        style={{ width: `${worker.cpu}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Memory Usage bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small fw-medium">Memory Allocation</span>
                      <span className="text-dark small fw-bold">{worker.memory}%</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className={`progress-bar ${worker.memory > 80 ? 'bg-warning' : 'bg-success'}`} 
                        role="progressbar" 
                        style={{ width: `${worker.memory}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between pt-2 border-top">
                    <span className="text-muted small">Active Task Count:</span>
                    <span className="badge bg-light text-dark font-monospace">{worker.tasks} tasks</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-light rounded-3 my-2">
                  <span className="text-muted small">Node offline. Telemetry link lost.</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workers;
