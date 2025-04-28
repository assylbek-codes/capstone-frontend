import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Environment } from '../types';

export const EnvironmentsPage = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnvironments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get<Environment[]>('/environments');
        setEnvironments(response.data);
      } catch (error) {
        setError('Failed to load environments. Please try again later.');
        console.error('Environment fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEnvironments();
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Environments</h1>
            <div className="flex space-x-3">
              <Link to="/environments/grid-editor" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                Grid Editor
              </Link>
              {/* <Link to="/environments/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Create Environment
              </Link> */}
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
              {environments.length === 0 ? (
                <div className="col-span-full bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg border border-gray-700/50 shadow-xl text-center">
                  <h3 className="text-lg font-medium text-gray-200 mb-2">No environments yet</h3>
                  <p className="text-gray-400 mb-4">
                    Create your first warehouse environment to get started.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Link to="/environments/grid-editor" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                      Grid Editor
                    </Link>
                    {/* <Link to="/environments/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                      Create Environment
                    </Link> */}
                  </div>
                </div>
              ) : (
                <>
                  {environments.map((environment) => (
                    <div key={environment.id} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl hover:shadow-2xl transition-shadow">
                      <h3 className="text-lg font-semibold mb-2 text-gray-200">{environment.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {environment.description || 'No description provided'}
                      </p>
                      <div className="text-sm text-gray-400 mb-3">
                        <div>
                          Dimensions: {environment.dimensions.width} x {environment.dimensions.height}
                        </div>
                        <div>
                          Shelves: {environment.elements.shelves.length}
                        </div>
                        <div>
                          Drop-offs: {environment.elements.dropoffs.length}
                        </div>
                      </div>
                      <Link to={`/environments/${environment.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors block text-center">
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