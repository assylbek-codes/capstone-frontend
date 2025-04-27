import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';

export const EnvironmentCreatePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState('');
  const [hasParsingError, setHasParsingError] = useState(false);

  const handleConfigChange = (value: string) => {
    setConfig(value);
    
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
    
    if (hasParsingError) {
      setError('Please fix the JSON configuration format');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const configObj = config.trim() ? JSON.parse(config) : {};
      
      const response = await apiClient.post('/environments', {
        name,
        description,
        config: configObj
      });
      
      navigate(`/environments/${response.data.id}`);
    } catch (error) {
      setError('Failed to create environment. Please try again.');
      console.error('Environment creation error:', error);
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create New Environment</h1>
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Warehouse Environment"
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
                  placeholder="Optional description of this environment"
                />
              </div>
              
              <div>
                <label htmlFor="config" className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration (JSON) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="config"
                  className={`input w-full h-64 font-mono ${hasParsingError ? 'border-red-500' : ''}`}
                  value={config}
                  onChange={(e) => handleConfigChange(e.target.value)}
                  placeholder='{
  "layout": {
    "width": 50,
    "height": 50,
    "obstacles": [
      {"x": 10, "y": 15},
      {"x": 20, "y": 25}
    ]
  },
  "resources": {
    "maxRobots": 10,
    "chargingStations": [
      {"x": 5, "y": 5},
      {"x": 45, "y": 45}
    ]
  }
}'
                  required
                />
                {hasParsingError && (
                  <p className="mt-1 text-sm text-red-500">
                    Invalid JSON format. Please check your syntax.
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter environment configuration in JSON format. This should define the layout, resources, and other parameters.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/environments')}
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
                ) : 'Create Environment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}; 