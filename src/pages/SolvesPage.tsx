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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Solves</h1>
          <Link to="/solves/create" className="btn btn-primary">
            Create Solve
          </Link>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Filter by Environment</h2>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  !environmentId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => handleEnvironmentFilter(env.id.toString())}
                >
                  {env.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Filter by Scenario</h2>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  !scenarioId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {solves.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No solves found</h3>
                <p className="text-gray-500 mb-4">
                  {(environmentId || scenarioId) 
                    ? 'No solves match your current filters.' 
                    : 'Run your first optimization solve to see results.'}
                </p>
                <Link to="/solves/create" className="btn btn-primary">
                  Create Solve
                </Link>
              </div>
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
                        Scenario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {solves.map((solve) => (
                      <tr key={solve.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{solve.name}</div>
                          <div className="text-sm text-gray-500">{solve.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSolveStatusClass(solve.status)}`}>
                            {solve.status.charAt(0).toUpperCase() + solve.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getEnvironmentName(solve.environment_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getScenarioName(solve.scenario_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {solve.task_id || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(solve.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/solves/${solve.id}`} className="text-primary hover:text-primary/80">
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
    </MainLayout>
  );
}; 