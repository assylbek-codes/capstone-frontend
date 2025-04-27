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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Scenarios</h1>
          <Link to="/scenarios/create" className="btn btn-primary">
            Create Scenario
          </Link>
        </div>
        
        {/* Environment filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
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
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.length === 0 ? (
              <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scenarios found</h3>
                <p className="text-gray-500 mb-4">
                  {environmentId 
                    ? 'No scenarios exist for the selected environment. Create one now!' 
                    : 'Create your first scenario to get started.'}
                </p>
                <Link to="/scenarios/create" className="btn btn-primary">
                  Create Scenario
                </Link>
              </div>
            ) : (
              <>
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="card hover:shadow-lg transition-shadow">
                    <div className="text-xs font-medium text-primary mb-2">
                      {getEnvironmentName(scenario.environment_id)}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{scenario.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {scenario.description || 'No description provided'}
                    </p>
                    <div className="text-sm text-gray-500 mb-3">
                      <div>Order Volume: {scenario.parameters.order_volume}</div>
                      <div>Robots: {scenario.parameters.robot_count}</div>
                    </div>
                    <Link to={`/scenarios/${scenario.id}`} className="btn btn-outline block text-center">
                      View Details
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 