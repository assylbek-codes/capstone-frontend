import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import { GridEditor } from '../components/environment/GridEditor';
import apiClient from '../api/client';
import { Task, Scenario, Environment } from '../types';

export const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
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
    const fetchTaskData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch task details
        const taskResponse = await apiClient.get<Task>(`/tasks/${id}`);
        setTask(taskResponse.data);
        
        // Fetch associated scenario
        const scenarioResponse = await apiClient.get<Scenario>(
          `/scenarios/${taskResponse.data.scenario_id}`
        );
        setScenario(scenarioResponse.data);
        
        // Fetch environment data using scenario's environment_id
        if (scenarioResponse.data.environment_id) {
          const environmentResponse = await apiClient.get<Environment>(
            `/environments/${scenarioResponse.data.environment_id}`
          );
          setEnvironment(environmentResponse.data);
        }
      } catch (error) {
        setError('Failed to load task details. Please try again later.');
        console.error('Task fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTaskData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setIsLoading(true);
    try {
      await apiClient.delete(`/tasks/${id}`);
      navigate(`/tasks?scenario_id=${task?.scenario_id}`);
    } catch (error) {
      setError('Failed to delete task.');
      console.error('Task delete error:', error);
      setIsLoading(false);
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'pickup': return 'Pickup';
      case 'delivery': return 'Delivery';
      case 'pickup_delivery': return 'Pickup & Delivery';
      default: return type;
    }
  };

  // const getPriorityLabel = (priority: number) => {
  //   if (priority >= 8) return 'High';
  //   if (priority >= 5) return 'Medium';
  //   return 'Low';
  // };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/tasks" className="text-primary hover:underline">
              Tasks
            </Link>
            <span className="text-gray-500">/</span>
            <h1 className="text-2xl font-bold">
              {isLoading ? 'Loading...' : task?.name || 'Task Details'}
            </h1>
          </div>
          <div className="flex space-x-3">
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
        ) : task ? (
          <div className="space-y-6">
            {/* Task info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Task Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="text-lg">{task.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <p className="text-lg">{getTaskTypeLabel(task.task_type)}</p>
                </div>
                {/* <div>
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <p className="text-lg">
                    {task.details?.priority ? getPriorityLabel(task.details.priority) : 'Normal'}
                  </p>
                </div> */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Scenario</p>
                  <p className="text-lg">
                    {scenario ? (
                      <Link to={`/scenarios/${scenario.id}`} className="text-primary hover:underline">
                        {scenario.name}
                      </Link>
                    ) : 'Loading...'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-lg">{task.description || 'No description provided'}</p>
                </div>
              </div>
            </div>
            
            {/* Task details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Task Details</h2>
              
              {/* Display legacy format (start_point and end_point) when tasks array isn't present */}
              {(!task.details.tasks) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Start Point</p>
                    <p className="text-lg">
                      ({task.details.start_point[0]}, {task.details.start_point[1]})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">End Point</p>
                    <p className="text-lg">
                      ({task.details.end_point[0]}, {task.details.end_point[1]})
                    </p>
                  </div>
                </div>
              )}
              
              {/* Display new format with tasks array when present */}
              {task.details.tasks && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Pickup-Dropoff Pairs</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pickup
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dropoff
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {task.details.tasks.map((pair: [string, string], index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{pair[0]}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{pair[1]}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="text-lg">{new Date(task.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="text-lg">{new Date(task.updated_at).toLocaleString()}</p>
                </div>
              </div>
              
              {task.details.additional_details && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Additional Details</p>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                    {JSON.stringify(task.details.additional_details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
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
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
            <p className="text-gray-500 mb-4">
              The task you are looking for may have been deleted or never existed.
            </p>
            <Link to="/tasks" className="btn btn-primary">
              Back to Tasks
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 