import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiFolder, FiList, FiActivity, FiArrowUpRight } from 'react-icons/fi';
import { getOrganizations, getProjects, getQueues } from '../api/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    organizations: 0,
    projects: 0,
    queues: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch organizations
        const orgs = await getOrganizations();
        let projectCount = 0;
        let queueCount = 0;

        // Fetch projects for all organizations
        const projectPromises = orgs.map((org) => getProjects(org.id));
        const projectsResults = await Promise.all(projectPromises);
        
        const allProjects = [];
        projectsResults.forEach((projList) => {
          projectCount += projList.length;
          allProjects.push(...projList);
        });

        // Fetch queues for all projects
        const queuePromises = allProjects.map((proj) => getQueues(proj.id));
        const queuesResults = await Promise.all(queuePromises);
        queuesResults.forEach((queueList) => {
          queueCount += queueList.length;
        });

        setStats({
          organizations: orgs.length,
          projects: projectCount,
          queues: queueCount,
        });
      } catch (err) {
        console.error('Error fetching statistics for dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Organizations',
      value: stats.organizations,
      icon: <FiUsers />,
      color: 'primary',
      link: '/organizations',
      desc: 'Active organization spaces',
    },
    {
      title: 'Projects',
      value: stats.projects,
      icon: <FiFolder />,
      color: 'success',
      link: '/projects',
      desc: 'Configured project pipelines',
    },
    {
      title: 'Queues',
      value: stats.queues,
      icon: <FiList />,
      color: 'warning',
      link: '/queues',
      desc: 'Message and task queues',
    },
  ];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">System Dashboard</h2>
          <p className="text-muted mb-0">Overview of organizations, projects, queues, jobs, and workers.</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-outline-primary btn-sm rounded-3 py-2 px-3 fw-semibold d-flex align-items-center"
        >
          <FiActivity className="me-2" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Grid of Metric Cards */}
      <div className="row g-4 mb-5">
        {cards.map((card, idx) => (
          <div key={idx} className="col-12 col-md-6 col-lg-4 col-xl-2.4 style-col">
            <div 
              className="card h-100 dashboard-card p-4 cursor-pointer"
              onClick={() => navigate(card.link)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className={`card-icon-wrapper text-${card.color}`}>
                  {card.icon}
                </div>
                <span className="text-muted small d-flex align-items-center">
                  View <FiArrowUpRight className="ms-1" />
                </span>
              </div>
              <p className="text-muted small fw-semibold uppercase mb-1">{card.title}</p>
              {loading ? (
                <div className="spinner-border spinner-border-sm text-primary my-2" role="status"></div>
              ) : (
                <h3 className="fw-bold mb-1 text-dark">{card.value}</h3>
              )}
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{card.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Guide */}
      <div className="row">
        <div className="col-12 col-lg-8">
          <div className="card border-0 rounded-4 bg-white p-4 shadow-sm">
            <h5 className="fw-bold mb-3 border-bottom pb-3">Quick Navigation Guide</h5>
            <p className="text-muted small">Use the sidebar to explore and configure parts of the scheduler:</p>
            <ul className="list-unstyled small mt-2">
              <li className="mb-2 d-flex align-items-center">
                <span className="badge bg-primary-subtle text-primary me-2">1</span>
                <span>Create an **Organization** context first.</span>
              </li>
              <li className="mb-2 d-flex align-items-center">
                <span className="badge bg-primary-subtle text-primary me-2">2</span>
                <span>Add **Projects** into that Organization.</span>
              </li>
              <li className="mb-2 d-flex align-items-center">
                <span className="badge bg-primary-subtle text-primary me-2">3</span>
                <span>Configure **Queues** within your projects.</span>
              </li>
              <li className="d-flex align-items-center">
                <span className="badge bg-primary-subtle text-primary me-2">4</span>
                <span>Activate/deactivate queues on demand.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
