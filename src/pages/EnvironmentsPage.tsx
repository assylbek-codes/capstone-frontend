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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Environments</h1>
          <div className="flex space-x-3">
            <Link to="/environments/grid-editor" className="btn btn-secondary">
              Grid Editor
            </Link>
            <Link to="/environments/create" className="btn btn-primary">
              Create Environment
            </Link>
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
            {environments.length === 0 ? (
              <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No environments yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first warehouse environment to get started.
                </p>
                <div className="flex justify-center space-x-3">
                  <Link to="/environments/grid-editor" className="btn btn-secondary">
                    Grid Editor
                  </Link>
                  <Link to="/environments/create" className="btn btn-primary">
                    Create Environment
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {environments.map((environment) => (
                  <div key={environment.id} className="card hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">{environment.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {environment.description || 'No description provided'}
                    </p>
                    <div className="text-sm text-gray-500 mb-3">
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
                    <Link to={`/environments/${environment.id}`} className="btn btn-outline block text-center">
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