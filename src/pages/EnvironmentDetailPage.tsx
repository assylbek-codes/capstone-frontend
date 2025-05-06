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
          {/* Header with navigation */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Link to="/environments" className="text-blue-400 hover:text-blue-300 transition-colors">
                Environments
              </Link>
              <span className="text-gray-500">/</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                {isLoading ? 'Loading...' : environment?.name || 'Environment Details'}
              </h1>
            </div>
            <div className="flex space-x-3">
              <Link to={`/scenarios/create?environment_id=${id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Create Scenario
              </Link>
              <button 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading}
              >
                Delete
              </button>
            </div>
          </div>
          
          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : environment ? (
            <div className="space-y-6">
              {/* Environment info */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Environment Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Name</p>
                    <p className="text-lg text-white">{environment.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Dimensions</p>
                    <p className="text-lg text-white">{environment.dimensions.width} × {environment.dimensions.height}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-400 mb-1">Description</p>
                    <p className="text-lg text-white">{environment.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>
              
              {/* Environment elements */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Environment Elements</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-300">Shelves</h3>
                    <p className="text-lg text-blue-400">{environment.elements.shelves.length}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-300">Pickup Points</h3>
                    <p className="text-lg text-pink-400">{environment.elements.pickups.length}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-300">Dropoff Points</h3>
                    <p className="text-lg text-green-400">{environment.elements.dropoffs.length}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-300">Robot Stations</h3>
                    <p className="text-lg text-amber-400">{environment.elements.robot_stations.length}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-300">Robots</h3>
                    <p className="text-lg text-purple-400">{environment.elements.robots?.length || 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Environment Visualization */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-200">Visualization</h2>
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">Use buttons to zoom, drag to pan</span>
                    <button
                      onClick={() => setShowGraph(!showGraph)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs mr-2 transition-colors"
                    >
                      {showGraph ? 'Hide Graph' : 'Show Graph'}
                    </button>
                    {/* {showGraph && (
                      <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs">
                        Showing navigation graph
                      </span>
                    )} */}
                  </div>
                </div>
                <div 
                  ref={visualizationContainerRef}
                  className="border border-gray-100 rounded-md h-96 overflow-hidden bg-gray-700/70 text-gray-900"
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
                <div className="mt-4 text-xs text-gray-400">
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
              {/* <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-200">Scenarios</h2>
                  <Link to={`/scenarios?environment_id=${id}`} className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                    View All
                  </Link>
                </div>
                <div>
                  <Link to={`/scenarios/create?environment_id=${id}`} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors inline-block">
                    Create New Scenario
                  </Link>
                </div>
              </div> */}
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg border border-gray-700/50 shadow-xl text-center">
              <h3 className="text-lg font-medium text-gray-200 mb-2">Environment not found</h3>
              <p className="text-gray-400 mb-4">
                The environment you're looking for doesn't exist or has been deleted.
              </p>
              <Link to="/environments" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-block">
                Back to Environments
              </Link>
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