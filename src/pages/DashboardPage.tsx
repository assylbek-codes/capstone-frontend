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
      <div className="min-h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden p-6 rounded-xl">
        {/* Tech background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-purple-500 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500 blur-3xl"></div>
        </div>
        
        {/* Grid lines for tech effect */}
        <div className="absolute inset-0 grid grid-cols-8 z-0 opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`v-${i}`} className="border-r border-white h-full"></div>
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h-${i}`} className="border-b border-white w-full absolute" style={{ top: `${(i + 1) * 12.5}%` }}></div>
          ))}
        </div>
        
        <div className="relative z-1 space-y-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Dashboard</h1>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <>
              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">Environments</h3>
                  <p className="text-3xl font-bold text-blue-400">{environments.length}</p>
                  <Link to="/environments" className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-4 inline-block">
                    View all environments
                  </Link>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">Scenarios</h3>
                  <p className="text-3xl font-bold text-purple-400">{scenarios.length}</p>
                  <Link to="/scenarios" className="text-sm text-purple-400 hover:text-purple-300 transition-colors mt-4 inline-block">
                    View all scenarios
                  </Link>
                </div>
                
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">Solves</h3>
                  <p className="text-3xl font-bold text-cyan-400">{solves.length}</p>
                  <Link to="/solves" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors mt-4 inline-block">
                    View all solves
                  </Link>
                </div>
              </div>
              
              {/* Recent Solves */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Recent Solves</h2>
                
                {solves.length === 0 ? (
                  <p className="text-gray-400">No solves yet. Create your first one!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-800/70">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Environment
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900/50 divide-y divide-gray-700">
                        {solves.slice(0, 5).map((solve) => (
                          <tr key={solve.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link to={`/solves/${solve.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                                {solve.name}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${solve.status === 'completed' ? 'bg-green-900/50 text-green-300' : 
                                  solve.status === 'failed' ? 'bg-red-900/50 text-red-300' : 
                                  solve.status === 'running' ? 'bg-blue-900/50 text-blue-300' : 
                                  'bg-yellow-900/50 text-yellow-300'
                                }`}
                              >
                                {solve.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                              {solve.environment?.name || `Environment ${solve.environment_id}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {new Date(solve.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="mt-6">
                  <Link to="/solves/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center w-fit">
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
        
        {/* Tech overlay elements */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
    </MainLayout>
  );
}; 
