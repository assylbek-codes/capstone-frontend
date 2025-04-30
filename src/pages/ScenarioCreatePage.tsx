import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Environment } from '../types';

export const ScenarioCreatePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoadingEnvironments, setIsLoadingEnvironments] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environmentId, setEnvironmentId] = useState<number | ''>('');
  const [parameters,] = useState('');
  const [hasParsingError,] = useState(false);

  // Fetch environments on component mount
  useEffect(() => {
    const fetchEnvironments = async () => {
      setIsLoadingEnvironments(true);
      try {
        const response = await apiClient.get<Environment[]>('/environments');
        setEnvironments(response.data);
        
        // Set the first environment as default if available
        if (response.data.length > 0) {
          setEnvironmentId(response.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch environments:', error);
      } finally {
        setIsLoadingEnvironments(false);
      }
    };
    
    fetchEnvironments();
  }, []);

  // const handleParametersChange = (value: string) => {
  //   setParameters(value);
    
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
    
    if (hasParsingError) {
      setError('Please fix the JSON parameters format');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const parametersObj = parameters.trim() ? JSON.parse(parameters) : {};
      
      const response = await apiClient.post('/scenarios', {
        name,
        description,
        environment_id: environmentId,
        parameters: parametersObj
      });
      
      navigate(`/scenarios/${response.data.id}`);
    } catch (error) {
      setError('Failed to create scenario. Please try again.');
      console.error('Scenario creation error:', error);
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Create New Scenario</h1>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="environment" className="block text-sm font-medium text-gray-300 mb-1">
                    Environment <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="environment"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    value={environmentId}
                    onChange={(e) => setEnvironmentId(e.target.value ? Number(e.target.value) : '')}
                    required
                    disabled={isLoadingEnvironments}
                  >
                    {isLoadingEnvironments ? (
                      <option>Loading environments...</option>
                    ) : environments.length === 0 ? (
                      <option value="">No environments available</option>
                    ) : (
                      <>
                        <option value="">Select an environment</option>
                        {environments.map(env => (
                          <option key={env.id} value={env.id}>
                            {env.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {environments.length === 0 && !isLoadingEnvironments && (
                    <p className="mt-1 text-sm text-red-300">
                      You need to create an environment first.{' '}
                      <button
                        type="button"
                        className="text-blue-400 hover:text-blue-300 underline transition-colors"
                        onClick={() => navigate('/environments/create')}
                      >
                        Create one now
                      </button>
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name of this scenario"
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
                    placeholder="Description of this scenario"
                  />
                </div>
                
                {/* <div>
                  <label htmlFor="parameters" className="block text-sm font-medium text-gray-300 mb-1">
                    Parameters (JSON)
                  </label>
                  <textarea
                    id="parameters"
                    className={`w-full bg-gray-900/70 border ${hasParsingError ? 'border-red-500' : 'border-gray-700'} rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 h-48 font-mono`}
                    value={parameters}
                    onChange={(e) => handleParametersChange(e.target.value)}
                    placeholder='{
  "param1": "value1",
  "param2": 42,
  "param3": {
    "nested": true
  }
}'
                  />
                  {hasParsingError && (
                    <p className="mt-1 text-sm text-red-400">
                      Invalid JSON format. Please check your syntax.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Enter scenario-specific parameters in JSON format. Leave blank if not needed.
                  </p>
                </div> */}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => navigate('/scenarios')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors relative overflow-hidden group"
                  disabled={isLoading || environments.length === 0 || hasParsingError}
                >
                  <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-blue-500 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
                  <span className="relative">
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : 'Create Scenario'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 