import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, FiFolder, FiList, FiActivity, FiArrowUpRight, FiCpu, 
  FiCheckCircle, FiXCircle, FiAlertOctagon, FiClock, FiHeart, FiShield 
} from 'react-icons/fi';
import { 
  getOrganizations, getProjects, getAllQueues, getJobs, getWorkers, getDeadLetterEntries 
} from '../api/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    organizations: 0,
    projects: 0,
    queues: 0,
    jobsTotal: 0,
    jobsQueued: 0,
    jobsRunning: 0,
    jobsSuccess: 0,
    jobsFailed: 0,
    jobsDeadLetter: 0,
    workersActive: 0,
    workersIdle: 0,
    workersBusy: 0,
    workersOffline: 0
  });

  const [health, setHealth] = useState({
    backend: 'Connecting...',
    database: 'Connecting...',
    connectedWorkers: 0,
    pendingJobs: 0,
    failedJobs: 0,
    lastHeartbeat: 'Never'
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch organizations
      const orgs = await getOrganizations();
      
      // Fetch projects for all organizations
      const projectPromises = orgs.map((org) => getProjects(org.id));
      const projectsResults = await Promise.all(projectPromises);
      const allProjects = [];
      projectsResults.forEach((projList) => {
        allProjects.push(...projList);
      });

      // Fetch remaining metrics concurrently
      const [allQueues, allJobs, allWorkers, allDlq] = await Promise.all([
        getAllQueues(),
        getJobs(),
        getWorkers(),
        getDeadLetterEntries(),
      ]);

      // Calculate metric aggregates
      const jobsQueued = allJobs.filter(j => j.status === 'QUEUED').length;
      const jobsRunning = allJobs.filter(j => j.status === 'RUNNING').length;
      const jobsSuccess = allJobs.filter(j => j.status === 'SUCCESS').length;
      const jobsFailed = allJobs.filter(j => j.status === 'FAILED').length;
      const jobsDeadLetter = allJobs.filter(j => j.status === 'DEAD_LETTER').length;

      const workersActive = allWorkers.filter(w => w.status === 'ACTIVE').length;
      const workersIdle = allWorkers.filter(w => w.status === 'IDLE').length;
      const workersBusy = allWorkers.filter(w => w.status === 'BUSY').length;
      const workersOffline = allWorkers.filter(w => w.status === 'OFFLINE').length;

      setStats({
        organizations: orgs.length,
        projects: allProjects.length,
        queues: allQueues.length,
        jobsTotal: allJobs.length,
        jobsQueued,
        jobsRunning,
        jobsSuccess,
        jobsFailed,
        jobsDeadLetter,
        workersActive,
        workersIdle,
        workersBusy,
        workersOffline
      });

      // Calculate Last Heartbeat
      const heartbeats = allWorkers
        .map(w => w.last_heartbeat)
        .filter(hb => !!hb)
        .map(hb => new Date(hb));
      const lastHeartbeatTime = heartbeats.length > 0 ? new Date(Math.max(...heartbeats)) : null;

      setHealth({
        backend: 'Healthy',
        database: 'Healthy',
        connectedWorkers: allWorkers.filter(w => w.status !== 'OFFLINE').length,
        pendingJobs: jobsQueued + allJobs.filter(j => j.status === 'RETRY').length,
        failedJobs: jobsFailed + jobsDeadLetter,
        lastHeartbeat: lastHeartbeatTime ? lastHeartbeatTime.toLocaleTimeString() : 'Never'
      });

      // Construct Recent Activity list
      const activities = [];

      // 1. Job Created
      allJobs.forEach(job => {
        if (job.created_at) {
          activities.push({
            id: `job-created-${job.id}`,
            type: 'Job Created',
            title: `Job #${job.id} Created`,
            desc: `Payload: ${job.payload.substring(0, 30)}${job.payload.length > 30 ? '...' : ''}`,
            timestamp: new Date(job.created_at),
            badgeClass: 'bg-primary-subtle text-primary'
          });
        }
      });

      // 2. Job Completed (Success)
      allJobs.forEach(job => {
        if (job.completed_at && job.status === 'SUCCESS') {
          activities.push({
            id: `job-success-${job.id}`,
            type: 'Job Completed',
            title: `Job #${job.id} Succeeded`,
            desc: 'Task execution completed successfully.',
            timestamp: new Date(job.completed_at),
            badgeClass: 'bg-success-subtle text-success'
          });
        }
      });

      // 3. Worker Registered
      allWorkers.forEach(worker => {
        if (worker.created_at) {
          activities.push({
            id: `worker-reg-${worker.id}`,
            type: 'Worker Registered',
            title: `Worker registered: ${worker.name}`,
            desc: `Node ID: #${worker.id}`,
            timestamp: new Date(worker.created_at),
            badgeClass: 'bg-info-subtle text-info'
          });
        }
      });

      // 4. Worker Assigned
      allWorkers.forEach(worker => {
        if (worker.current_job_id && worker.updated_at) {
          activities.push({
            id: `worker-assign-${worker.id}`,
            type: 'Worker Assigned',
            title: `${worker.name} Assigned`,
            desc: `Processing Job #${worker.current_job_id}`,
            timestamp: new Date(worker.updated_at),
            badgeClass: 'bg-warning-subtle text-warning'
          });
        }
      });

      // 5. Retry Triggered
      allJobs.forEach(job => {
        if (job.retry_count > 0 && job.status === 'RETRY' && job.completed_at) {
          activities.push({
            id: `job-retry-${job.id}-${job.retry_count}`,
            type: 'Retry Triggered',
            title: `Retry Triggered for Job #${job.id}`,
            desc: `Attempt ${job.retry_count} of ${job.max_retries}`,
            timestamp: new Date(job.completed_at),
            badgeClass: 'bg-warning-subtle text-warning'
          });
        }
      });

      // 6. Moved To Dead Letter
      allDlq.forEach(dlqEntry => {
        if (dlqEntry.failed_at) {
          activities.push({
            id: `dlq-${dlqEntry.id}`,
            type: 'Moved To Dead Letter',
            title: `Job #${dlqEntry.job_id} Dead Lettered`,
            desc: `Reason: ${dlqEntry.failure_reason || 'Max retries reached'}`,
            timestamp: new Date(dlqEntry.failed_at),
            badgeClass: 'bg-danger-subtle text-danger'
          });
        }
      });

      // Sort and take top 7
      const sorted = activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 7);

      setRecentActivities(sorted);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Make sure backend is running.');
      setHealth(prev => ({
        ...prev,
        backend: 'Offline',
        database: 'Unreachable'
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatActivityTime = (date) => {
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">System Dashboard</h2>
          <p className="text-muted mb-0">Real-time telemetrics, queue health, cluster loads, and log diagnostics.</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          className="btn btn-outline-primary btn-sm rounded-3 py-2 px-3 fw-semibold d-flex align-items-center"
          disabled={loading}
        >
          <FiActivity className={loading ? 'spinner-border spinner-border-sm border-0' : 'me-2'} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 py-2 px-3 small border-0 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* CORE METRICS SECTIONS */}
      <h5 className="fw-bold text-muted uppercase small mb-3">Core Assets</h5>
      <div className="row g-4 mb-4">
        {[
          { title: 'Organizations', val: stats.organizations, path: '/organizations', icon: <FiUsers />, color: 'primary' },
          { title: 'Projects', val: stats.projects, path: '/projects', icon: <FiFolder />, color: 'success' },
          { title: 'Queues', val: stats.queues, path: '/queues', icon: <FiList />, color: 'warning' },
          { title: 'Total Jobs', val: stats.jobsTotal, path: '/jobs', icon: <FiClock />, color: 'info' }
        ].map((card, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100 border-0 rounded-4 shadow-sm p-4 bg-white cursor-pointer" onClick={() => navigate(card.path)}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className={`bg-${card.color}-subtle text-${card.color} rounded-3 p-2 d-flex align-items-center justify-content-center`} style={{ width: '40px', height: '40px' }}>
                  {card.icon}
                </div>
                <span className="text-muted small d-flex align-items-center">
                  View <FiArrowUpRight className="ms-1" />
                </span>
              </div>
              <p className="text-muted small fw-semibold mb-1">{card.title}</p>
              <h3 className="fw-bold mb-0 text-dark">{loading ? '-' : card.val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-5">
        {/* JOBS BREAKDOWN */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <h6 className="fw-bold mb-3 pb-3 border-bottom text-dark">Jobs Workload Breakdown</h6>
            <div className="row g-3">
              {[
                { name: 'Queued', val: stats.jobsQueued, color: 'primary' },
                { name: 'Running', val: stats.jobsRunning, color: 'warning' },
                { name: 'Successful', val: stats.jobsSuccess, color: 'success' },
                { name: 'Failed', val: stats.jobsFailed, color: 'danger' },
                { name: 'Dead Letter', val: stats.jobsDeadLetter, color: 'dark' }
              ].map((item, idx) => (
                <div key={idx} className="col-6 col-sm-4">
                  <div className={`p-3 bg-light rounded-4 border-start border-4 border-${item.color}`}>
                    <span className="text-muted small fw-medium">{item.name}</span>
                    <h4 className="fw-bold mb-0 mt-1 text-dark">{loading ? '-' : item.val}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WORKERS BREAKDOWN */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <h6 className="fw-bold mb-3 pb-3 border-bottom text-dark">Worker Nodes Distribution</h6>
            <div className="row g-3">
              {[
                { name: 'Active Nodes', val: stats.workersActive, color: 'success' },
                { name: 'Idle Nodes', val: stats.workersIdle, color: 'warning' },
                { name: 'Busy Nodes', val: stats.workersBusy, color: 'primary' },
                { name: 'Offline Nodes', val: stats.workersOffline, color: 'danger' }
              ].map((item, idx) => (
                <div key={idx} className="col-6">
                  <div className={`p-3 bg-light rounded-4 border-start border-4 border-${item.color}`}>
                    <span className="text-muted small fw-medium">{item.name}</span>
                    <h4 className="fw-bold mb-0 mt-1 text-dark">{loading ? '-' : item.val}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* SYSTEM HEALTH */}
        <div className="col-12 col-md-5 col-xl-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
              <FiShield className="text-primary me-2" size={20} />
              <h5 className="fw-bold mb-0 text-dark">System Health</h5>
            </div>
            <ul className="list-unstyled mb-0">
              <li className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-muted small">Backend Service</span>
                <span className={`badge rounded-pill px-3 py-1 fw-bold ${health.backend === 'Healthy' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                  {health.backend}
                </span>
              </li>
              <li className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-muted small">Database Status</span>
                <span className={`badge rounded-pill px-3 py-1 fw-bold ${health.database === 'Healthy' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                  {health.database}
                </span>
              </li>
              <li className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-muted small">Connected Workers</span>
                <span className="text-dark fw-bold">{loading ? '-' : health.connectedWorkers}</span>
              </li>
              <li className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-muted small">Pending Jobs</span>
                <span className="text-dark fw-bold">{loading ? '-' : health.pendingJobs}</span>
              </li>
              <li className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-muted small">Failed/DLQ Jobs</span>
                <span className="text-danger fw-bold">{loading ? '-' : health.failedJobs}</span>
              </li>
              <li className="d-flex justify-content-between align-items-center py-2">
                <span className="text-muted small">Last Heartbeat</span>
                <span className="text-dark fw-bold">{loading ? '-' : health.lastHeartbeat}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RECENT ACTIVITY LOG */}
        <div className="col-12 col-md-7 col-xl-8">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">
            <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
              <FiActivity className="text-primary me-2" size={20} />
              <h5 className="fw-bold mb-0 text-dark">Recent System Activity</h5>
            </div>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Aggregating timeline logs...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-5">
                <FiActivity size={48} className="text-muted mb-3" />
                <h6 className="fw-bold text-dark">No Recent Activity</h6>
                <p className="text-muted small">Systems are idle. Activity telemetry logs will appear once jobs are queued.</p>
              </div>
            ) : (
              <div className="activity-timeline">
                {recentActivities.map((act) => (
                  <div key={act.id} className="d-flex mb-3 align-items-start pb-2 border-bottom border-light">
                    <span className={`badge ${act.badgeClass} rounded-pill px-2 py-1 small fw-semibold me-3 font-monospace`} style={{ minWidth: '110px', fontSize: '0.7rem' }}>
                      {act.type}
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-0 text-dark small fw-bold">{act.title}</h6>
                      <p className="text-muted mb-0 small" style={{ fontSize: '0.75rem' }}>{act.desc}</p>
                    </div>
                    <span className="text-muted small font-monospace" style={{ fontSize: '0.7rem' }}>
                      {formatActivityTime(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
