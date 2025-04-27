import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Environment, Scenario, Solve } from '../types';

export const DashboardPage = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [solves, setSolves] = useState<Solve[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch environments, scenarios, and solves in parallel
        const [environmentsRes, scenariosRes, solvesRes] = await Promise.all([
          apiClient.get<Environment[]>('/environments'),
          apiClient.get<Scenario[]>('/scenarios'),
          apiClient.get<Solve[]>('/solves')
        ]);
        
        setEnvironments(environmentsRes.data);
        setScenarios(scenariosRes.data);
        setSolves(solvesRes.data);
      } catch (error) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Dashboard data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-white shadow-md p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Environments</h3>
                <p className="text-3xl font-bold text-primary">{environments.length}</p>
                <Link to="/environments" className="text-sm text-primary hover:underline mt-4 inline-block">
                  View all environments
                </Link>
              </div>
              
              <div className="card bg-white shadow-md p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Scenarios</h3>
                <p className="text-3xl font-bold text-secondary">{scenarios.length}</p>
                <Link to="/scenarios" className="text-sm text-secondary hover:underline mt-4 inline-block">
                  View all scenarios
                </Link>
              </div>
              
              <div className="card bg-white shadow-md p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Solves</h3>
                <p className="text-3xl font-bold text-accent">{solves.length}</p>
                <Link to="/solves" className="text-sm text-accent hover:underline mt-4 inline-block">
                  View all solves
                </Link>
              </div>
            </div>
            
            {/* Recent Solves */}
            <div className="card bg-white shadow-md p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Recent Solves</h2>
              
              {solves.length === 0 ? (
                <p className="text-gray-500">No solves yet. Create your first one!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Environment
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {solves.slice(0, 5).map((solve) => (
                        <tr key={solve.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link to={`/solves/${solve.id}`} className="text-primary hover:underline">
                              {solve.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${solve.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                solve.status === 'failed' ? 'bg-red-100 text-red-800' : 
                                solve.status === 'running' ? 'bg-blue-100 text-blue-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {solve.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {solve.environment?.name || `Environment ${solve.environment_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(solve.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-4">
                <Link to="/solves/create" className="btn btn-primary inline-flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create New Solve
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}; 