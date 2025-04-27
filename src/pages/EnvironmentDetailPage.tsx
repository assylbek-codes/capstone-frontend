import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import { GridEditor } from '../components/environment/GridEditor';
import apiClient from '../api/client';
import { Environment } from '../types';

export const EnvironmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [calculatedZoom, setCalculatedZoom] = useState(1);
  
  // Reference for the visualization container
  const visualizationContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate initial zoom based on environment dimensions
  const calculateInitialZoom = () => {
    if (!environment || !visualizationContainerRef.current) return 1;
    
    const containerWidth = visualizationContainerRef.current.clientWidth;
    const containerHeight = visualizationContainerRef.current.clientHeight;
    
    // Get environment dimensions
    const envWidth = environment.dimensions.width;
    const envHeight = environment.dimensions.height;
    
    // Calculate zoom factors to fit the environment in the container
    const horizontalZoom = containerWidth / (envWidth * 50); // 50 is the base cell size
    const verticalZoom = containerHeight / (envHeight * 50);
    
    // Use the smaller zoom factor to ensure the environment fits in both dimensions
    // Add a small margin by multiplying by 0.9
    return Math.min(horizontalZoom, verticalZoom) * 1.4;
  };
  
  // Recalculate zoom when environment data is loaded and the container is ready
  useEffect(() => {
    if (environment && visualizationContainerRef.current) {
      // Small timeout to ensure the container is fully rendered
      const timer = setTimeout(() => {
        const zoom = calculateInitialZoom();
        console.log(`Calculated initial zoom: ${zoom}`);
        setCalculatedZoom(zoom);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [environment, visualizationContainerRef.current]);

  useEffect(() => {
    const fetchEnvironment = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get<Environment>(`/environments/${id}`);
        setEnvironment(response.data);
      } catch (error) {
        setError('Failed to load environment details. Please try again later.');
        console.error('Environment fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEnvironment();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this environment?')) return;
    
    setIsLoading(true);
    try {
      await apiClient.delete(`/environments/${id}`);
      navigate('/environments');
    } catch (error) {
      setError('Failed to delete environment.');
      console.error('Environment delete error:', error);
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/environments" className="text-primary hover:underline">
              Environments
            </Link>
            <span className="text-gray-500">/</span>
            <h1 className="text-2xl font-bold">
              {isLoading ? 'Loading...' : environment?.name || 'Environment Details'}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Link to={`/scenarios/create?environment_id=${id}`} className="btn btn-primary">
              Create Scenario
            </Link>
            <button 
              onClick={handleDelete}
              className="btn btn-outline btn-danger"
              disabled={isLoading}
            >
              Delete
            </button>
          </div>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">
            {error}
          </div>
        ) : environment ? (
          <div className="space-y-6">
            {/* Environment info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="text-lg">{environment.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dimensions</p>
                  <p className="text-lg">{environment.dimensions.width} × {environment.dimensions.height}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-lg">{environment.description || 'No description provided'}</p>
                </div>
              </div>
            </div>
            
            {/* Environment elements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Environment Elements</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Shelves</h3>
                  <p className="text-lg">{environment.elements.shelves.length}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Pickup Points</h3>
                  <p className="text-lg">{environment.elements.pickups.length}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Dropoff Points</h3>
                  <p className="text-lg">{environment.elements.dropoffs.length}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Robot Stations</h3>
                  <p className="text-lg">{environment.elements.robot_stations.length}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Robots</h3>
                  <p className="text-lg">{environment.elements.robots?.length || 0}</p>
                </div>
              </div>
            </div>
            
            {/* Environment Visualization */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Visualization</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-4">Use buttons to zoom, drag to pan</span>
                  <button
                    onClick={() => setShowGraph(!showGraph)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs mr-2"
                  >
                    {showGraph ? 'Hide Graph' : 'Show Graph'}
                  </button>
                  {showGraph && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      Showing navigation graph
                    </span>
                  )}
                </div>
              </div>
              <div 
                ref={visualizationContainerRef}
                className="border rounded-md h-96 overflow-hidden"
              >
                <GridEditor 
                  dimensions={environment.dimensions}
                  elements={{
                    ...environment.elements,
                    // Add all pickup points as selected for better visualization
                    allPickupPoints: environment.elements.pickups,
                    selectedPickupIds: new Set(environment.elements.pickups.map(p => p.id))
                  }}
                  onElementsChange={() => {}} // Provide empty handler for read-only mode
                  showGraph={showGraph}
                  graph={environment.graph}
                  isReadOnly={true} // Set to read-only mode
                  initialZoom={calculatedZoom}
                />
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <div className="flex space-x-4">
                  <div>
                    <span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span>
                    <span>Shelves</span>
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                    <span>Dropoff Points</span>
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 bg-amber-500 transform rotate-45 mr-1"></span>
                    <span>Robot Stations</span>
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-pink-500 mr-1"></span>
                    <span>Pickup Points</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scenarios section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Scenarios</h2>
                <Link to={`/scenarios?environment_id=${id}`} className="text-primary hover:underline text-sm">
                  View All
                </Link>
              </div>
              <div>
                <Link to={`/scenarios/create?environment_id=${id}`} className="btn btn-secondary">
                  Create New Scenario
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Environment not found</h3>
            <p className="text-gray-500 mb-4">
              The environment you are looking for may have been deleted or never existed.
            </p>
            <Link to="/environments" className="btn btn-primary">
              Back to Environments
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 