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
  const [params,] = useState('');
  const [hasParsingError,] = useState(false);
  
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [envResponse, scenarioResponse] = await Promise.all([
          apiClient.get<Environment[]>('/environments'),
          apiClient.get<Scenario[]>('/scenarios')
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

  // const handleParamsChange = (value: string) => {
  //   setParams(value);
    
  //   // Validate JSON if not empty
  //   if (value.trim()) {
  //     try {
  //       JSON.parse(value);
  //       setHasParsingError(false);
  //     } catch (e) {
  //       setHasParsingError(true);
  //     }
  //   } else {
  //     setHasParsingError(false);
  //   }
  // };

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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Create New Task</h1>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
            {isLoadingData ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name of this task"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 h-24"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description of this task"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="environment" className="block text-sm font-medium text-gray-300 mb-1">
                        Environment <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="environment"
                        className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
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
                      <label htmlFor="scenario" className="block text-sm font-medium text-gray-300 mb-1">
                        Scenario <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="scenario"
                        className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
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
                  
                  {/* <div>
                    <label htmlFor="params" className="block text-sm font-medium text-gray-300 mb-1">
                      Parameters (JSON)
                    </label>
                    <textarea
                      id="params"
                      className={`w-full font-mono bg-gray-900/70 border ${hasParsingError ? 'border-red-700' : 'border-gray-700'} rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 h-64`}
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
                      <p className="mt-1 text-sm text-red-400">
                        Invalid JSON format. Please check your syntax.
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Enter task parameters in JSON format. Use "tasks" array for pickup and dropoff pairs in the format [pickup_id, dropoff_id].
                    </p>
                  </div> */}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="border border-blue-500 hover:bg-blue-900/30 px-4 py-2 rounded-md font-medium text-blue-400 transition-colors"
                    onClick={() => navigate('/tasks')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium text-white transition-colors relative overflow-hidden group"
                    disabled={isLoading || hasParsingError}
                  >
                    <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-blue-500 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
                    <span className="relative">
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      ) : 'Create Task'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
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