import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import { GridEditor } from '../components/environment/GridEditor';
import apiClient from '../api/client';
import { Scenario, Environment, Task } from '../types';

export const ScenarioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
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
    const fetchScenarioData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch scenario details
        const scenarioResponse = await apiClient.get<Scenario>(`/scenarios/${id}`);
        setScenario(scenarioResponse.data);
        
        // Fetch associated environment
        const environmentResponse = await apiClient.get<Environment>(
          `/environments/${scenarioResponse.data.environment_id}`
        );
        setEnvironment(environmentResponse.data);
        
        // Fetch tasks associated with this scenario
        const tasksResponse = await apiClient.get<Task[]>(`/tasks?scenario_id=${id}`);
        setTasks(tasksResponse.data);
      } catch (error) {
        setError('Failed to load scenario details. Please try again later.');
        console.error('Scenario fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScenarioData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;
    
    setIsLoading(true);
    try {
      await apiClient.delete(`/scenarios/${id}`);
      navigate('/scenarios');
    } catch (error) {
      setError('Failed to delete scenario.');
      console.error('Scenario delete error:', error);
      setIsLoading(false);
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'pickup': return 'Pickup';
      case 'delivery': return 'Delivery';
      case 'combined': return 'Combined';
      default: return type;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/scenarios" className="text-primary hover:underline">
              Scenarios
            </Link>
            <span className="text-gray-500">/</span>
            <h1 className="text-2xl font-bold">
              {isLoading ? 'Loading...' : scenario?.name || 'Scenario Details'}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Link to={`/tasks/generate?scenario_id=${id}`} className="btn btn-primary">
              Generate Tasks
            </Link>
            {/* <Link to={`/solves/create?scenario_id=${id}`} className="btn btn-secondary">
              Create Solve
            </Link> */}
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
        ) : scenario ? (
          <div className="space-y-6">
            {/* Scenario info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Scenario Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="text-lg">{scenario.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Environment</p>
                  <p className="text-lg">
                    {environment ? (
                      <Link to={`/environments/${environment.id}`} className="text-primary hover:underline">
                        {environment.name}
                      </Link>
                    ) : 'Loading...'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-lg">{scenario.description || 'No description provided'}</p>
                </div>
              </div>
            </div>
            
            {/* Scenario parameters */}
            {/* <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Parameters</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order Volume</p>
                  <p className="text-lg">{scenario.parameters.order_volume}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Robot Count</p>
                  <p className="text-lg">{scenario.parameters.robot_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created At</p>
                  <p className="text-lg">{new Date(scenario.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div> */}
            
            {/* Environment Visualization */}
            {environment && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Environment Visualization</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-4">Use buttons to zoom, drag to pan</span>
                    <button
                      onClick={() => setShowGraph(!showGraph)}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs mr-2"
                    >
                      {showGraph ? 'Hide Graph' : 'Show Graph'}
                    </button>
                    {/* {showGraph && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        Showing navigation graph
                      </span>
                    )} */}
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
            )}
            
            {/* Tasks section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <Link to={`/tasks?scenario_id=${id}`} className="text-primary hover:underline text-sm">
                  View All Tasks
                </Link>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    No tasks have been created for this scenario yet.
                  </p>
                  <div className="flex gap-3 justify-center">
                    {/* <Link to={`/tasks/create?scenario_id=${id}`} className="btn btn-outline">
                      Create Task Manually
                    </Link> */}
                    <Link to={`/tasks/generate?scenario_id=${id}`} className="btn btn-primary">
                      Generate Tasks
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">ID</th>
                        <th className="py-2 text-left">Type</th>
                        <th className="py-2 text-left">Priority</th>
                        <th className="py-2 text-left">Created At</th>
                        <th className="py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.slice(0, 5).map(task => (
                        <tr key={task.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">{task.id}</td>
                          <td className="py-2">{getTaskTypeLabel(task.task_type)}</td>
                          <td className="py-2">{task.details?.priority || 'Normal'}</td>
                          <td className="py-2">{new Date(task.created_at).toLocaleDateString()}</td>
                          <td className="py-2">
                            <Link to={`/tasks/${task.id}`} className="text-primary hover:underline">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {tasks.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link to={`/tasks?scenario_id=${id}`} className="text-primary hover:underline">
                        View all {tasks.length} tasks
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Solves section */}
            {/* <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Optimizations</h2>
                <Link to={`/solves?scenario_id=${id}`} className="text-primary hover:underline text-sm">
                  View All
                </Link>
              </div>
              <div>
                <Link to={`/solves/create?scenario_id=${id}`} className="btn btn-secondary">
                  Create New Optimization
                </Link>
              </div>
            </div> */}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scenario not found</h3>
            <p className="text-gray-500 mb-4">
              The scenario you are looking for may have been deleted or never existed.
            </p>
            <Link to="/scenarios" className="btn btn-primary">
              Back to Scenarios
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 