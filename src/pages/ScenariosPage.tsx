import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Environment, Scenario } from '../types';

export const ScenariosPage = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const environmentId = searchParams.get('environment_id');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch environments first
        const environmentsResponse = await apiClient.get<Environment[]>('/environments');
        setEnvironments(environmentsResponse.data);
        
        // Fetch scenarios, filtered by environment_id if provided
        let url = '/scenarios';
        if (environmentId) {
          url += `?environment_id=${environmentId}`;
        }
        
        const scenariosResponse = await apiClient.get<Scenario[]>(url);
        setScenarios(scenariosResponse.data);
      } catch (error) {
        setError('Failed to load scenarios. Please try again later.');
        console.error('Scenarios fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [environmentId]);

  const handleEnvironmentFilter = (id: string | null) => {
    if (id) {
      setSearchParams({ environment_id: id });
    } else {
      setSearchParams({});
    }
  };

  const getEnvironmentName = (id: number) => {
    const environment = environments.find(env => env.id === id);
    return environment ? environment.name : `Environment ${id}`;
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Scenarios</h1>
            <Link to="/scenarios/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
              Create Scenario
            </Link>
          </div>
          
          {/* Environment filter */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
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
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.length === 0 ? (
                <div className="col-span-full bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg border border-gray-700/50 shadow-xl text-center">
                  <h3 className="text-lg font-medium text-gray-200 mb-2">No scenarios found</h3>
                  <p className="text-gray-400 mb-4">
                    {environmentId 
                      ? 'No scenarios exist for the selected environment. Create one now!' 
                      : 'Create your first scenario to get started.'}
                  </p>
                  <Link to="/scenarios/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-block">
                    Create Scenario
                  </Link>
                </div>
              ) : (
                <>
                  {scenarios.map((scenario) => (
                    <div key={scenario.id} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl hover:shadow-2xl transition-shadow">
                      <div className="text-xs font-medium text-blue-400 mb-2">
                        {getEnvironmentName(scenario.environment_id)}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-200">{scenario.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {scenario.description || 'No description provided'}
                      </p>
                      <div className="text-sm text-gray-400 mb-3">
                        <div>Order Volume: {scenario.parameters.order_volume}</div>
                        <div>Robots: {scenario.parameters.robot_count}</div>
                      </div>
                      <Link to={`/scenarios/${scenario.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors block text-center">
                        View Details
                      </Link>
                    </div>
                  ))}
                </>
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