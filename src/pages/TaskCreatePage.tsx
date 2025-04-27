import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';

type Environment = {
  id: string;
  name: string;
};

type Scenario = {
  id: string;
  name: string;
};

export const TaskCreatePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [scenarioId, setScenarioId] = useState('');
  const [params, setParams] = useState('');
  const [hasParsingError, setHasParsingError] = useState(false);
  
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch environments and scenarios in parallel
        const [envResponse, scenarioResponse] = await Promise.all([
          apiClient.get('/environments'),
          apiClient.get('/scenarios')
        ]);
        
        setEnvironments(envResponse.data);
        setScenarios(scenarioResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load environments and scenarios. Please refresh the page.');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleParamsChange = (value: string) => {
    setParams(value);
    
    // Validate JSON if not empty
    if (value.trim()) {
      try {
        JSON.parse(value);
        setHasParsingError(false);
      } catch (e) {
        setHasParsingError(true);
      }
    } else {
      setHasParsingError(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!environmentId) {
      setError('Please select an environment');
      return;
    }
    
    if (!scenarioId) {
      setError('Please select a scenario');
      return;
    }
    
    if (hasParsingError) {
      setError('Please fix the JSON parameters format');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const paramsObj = params.trim() ? JSON.parse(params) : {};
      
      const response = await apiClient.post('/tasks', {
        name,
        description,
        environment_id: environmentId,
        scenario_id: scenarioId,
        params: paramsObj
      });
      
      navigate(`/tasks/${response.data.id}`);
    } catch (error) {
      setError('Failed to create task. Please try again.');
      console.error('Task creation error:', error);
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create New Task</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {isLoadingData ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="input w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Warehouse Navigation Task"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="input w-full h-24"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description of this task"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
                      Environment <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="environment"
                      className="input w-full"
                      value={environmentId}
                      onChange={(e) => setEnvironmentId(e.target.value)}
                      required
                    >
                      <option value="">Select an environment</option>
                      {environments.map((env) => (
                        <option key={env.id} value={env.id}>
                          {env.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-1">
                      Scenario <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="scenario"
                      className="input w-full"
                      value={scenarioId}
                      onChange={(e) => setScenarioId(e.target.value)}
                      required
                    >
                      <option value="">Select a scenario</option>
                      {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="params" className="block text-sm font-medium text-gray-700 mb-1">
                    Parameters (JSON)
                  </label>
                  <textarea
                    id="params"
                    className={`input w-full h-64 font-mono ${hasParsingError ? 'border-red-500' : ''}`}
                    value={params}
                    onChange={(e) => handleParamsChange(e.target.value)}
                    placeholder='{
                      "tasks": [
                        ["P2", "D2"],
                        ["P3", "D2"],
                        ["P6", "D1"],
                        ["P10", "D1"],
                        ["P15", "D2"]
                      ],
                      "priority": 5,
                      "robot_count": 3
                    }'
                  />
                  {hasParsingError && (
                    <p className="mt-1 text-sm text-red-500">
                      Invalid JSON format. Please check your syntax.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter task parameters in JSON format. Use "tasks" array for pickup and dropoff pairs in the format [pickup_id, dropoff_id].
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate('/tasks')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || hasParsingError}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : 'Create Task'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}; 