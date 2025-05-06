import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Environment, Scenario, Solve } from '../types';

export const SolvesPage = () => {
  const [solves, setSolves] = useState<Solve[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const environmentId = searchParams.get('environment_id');
  const scenarioId = searchParams.get('scenario_id');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch environments and scenarios first
        const [environmentsResponse, scenariosResponse] = await Promise.all([
          apiClient.get<Environment[]>('/environments'),
          apiClient.get<Scenario[]>('/scenarios')
        ]);
        
        setEnvironments(environmentsResponse.data);
        setScenarios(scenariosResponse.data);
        
        // Fetch solves with filters
        let url = '/solves';
        const params = new URLSearchParams();
        
        if (environmentId) {
          params.append('environment_id', environmentId);
        }
        
        if (scenarioId) {
          params.append('scenario_id', scenarioId);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const solvesResponse = await apiClient.get<Solve[]>(url);
        setSolves(solvesResponse.data);
      } catch (error) {
        setError('Failed to load solves. Please try again later.');
        console.error('Solves fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [environmentId, scenarioId]);

  const handleEnvironmentFilter = (id: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (id) {
      newParams.set('environment_id', id);
    } else {
      newParams.delete('environment_id');
    }
    
    setSearchParams(newParams);
  };

  const handleScenarioFilter = (id: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (id) {
      newParams.set('scenario_id', id);
    } else {
      newParams.delete('scenario_id');
    }
    
    setSearchParams(newParams);
  };

  const getEnvironmentName = (id: number) => {
    const environment = environments.find(env => env.id === id);
    return environment ? environment.name : `Environment ${id}`;
  };

  const getScenarioName = (id: number) => {
    const scenario = scenarios.find(s => s.id === id);
    return scenario ? scenario.name : `Scenario ${id}`;
  };

  const getSolveStatusClass = (status: 'pending' | 'running' | 'completed' | 'failed') => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/50 text-yellow-300';
      case 'running': return 'bg-blue-900/50 text-blue-300';
      case 'completed': return 'bg-green-900/50 text-green-300';
      case 'failed': return 'bg-red-900/50 text-red-300';
      default: return 'bg-gray-900/50 text-gray-300';
    }
  };

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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Solves</h1>
            <Link to="/solves/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
              Create Solve
            </Link>
          </div>
          
          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-300 mb-2">Filter by Environment</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm ${
                    !environmentId ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                  }`}
                  onClick={() => handleEnvironmentFilter(null)}
                >
                  All
                </button>
                {environments.map((env) => (
                  <button
                    key={env.id}
                    className={`px-3 py-1 rounded-full text-sm ${
                      environmentId === env.id.toString() 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                    }`}
                    onClick={() => handleEnvironmentFilter(env.id.toString())}
                  >
                    {env.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-300 mb-2">Filter by Scenario</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm ${
                    !scenarioId ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                  }`}
                  onClick={() => handleScenarioFilter(null)}
                >
                  All
                </button>
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    className={`px-3 py-1 rounded-full text-sm ${
                      scenarioId === scenario.id.toString() 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                    }`}
                    onClick={() => handleScenarioFilter(scenario.id.toString())}
                  >
                    {scenario.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl overflow-hidden">
              {solves.length === 0 ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-200 mb-2">No solves found</h3>
                  <p className="text-gray-400 mb-4">
                    {(environmentId || scenarioId) 
                      ? 'No solves match your current filters.' 
                      : 'Run your first optimization solve to see results.'}
                  </p>
                  <Link to="/solves/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-block">
                    Create Solve
                  </Link>
                </div>
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
                          Scenario
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Task Id
                        </th>
                        {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Date
                        </th> */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900/50 divide-y divide-gray-700">
                      {solves.map((solve) => (
                        <tr key={solve.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-200">{solve.name}</div>
                            <div className="text-sm text-gray-400">{solve.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSolveStatusClass(solve.status)}`}>
                              {solve.status.charAt(0).toUpperCase() + solve.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {getEnvironmentName(solve.environment_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {getScenarioName(solve.scenario_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {solve.task_id || 0}
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(solve.created_at).toLocaleDateString()}
                          </td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/solves/${solve.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                              View Results
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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