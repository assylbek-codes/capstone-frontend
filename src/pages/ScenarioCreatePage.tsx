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
  const [parameters, setParameters] = useState('');
  const [hasParsingError, setHasParsingError] = useState(false);

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

  const handleParametersChange = (value: string) => {
    setParameters(value);
    
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create New Scenario</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
                  Environment <span className="text-red-500">*</span>
                </label>
                <select
                  id="environment"
                  className="input w-full"
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
                  <p className="mt-1 text-sm text-red-500">
                    You need to create an environment first.{' '}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => navigate('/environments/create')}
                    >
                      Create one now
                    </button>
                  </p>
                )}
              </div>
              
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
                  placeholder="e.g., Warehouse Scenario Alpha"
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
                  placeholder="Optional description of this scenario"
                />
              </div>
              
              <div>
                <label htmlFor="parameters" className="block text-sm font-medium text-gray-700 mb-1">
                  Parameters (JSON)
                </label>
                <textarea
                  id="parameters"
                  className={`input w-full h-48 font-mono ${hasParsingError ? 'border-red-500' : ''}`}
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
                  <p className="mt-1 text-sm text-red-500">
                    Invalid JSON format. Please check your syntax.
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter scenario-specific parameters in JSON format. Leave blank if not needed.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/scenarios')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || environments.length === 0 || hasParsingError}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : 'Create Scenario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}; 