import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import { RobotPathSimulation } from '../components/simulation/RobotPathSimulation';
import apiClient from '../api/client';
import { Solve, Environment, Scenario, Task } from '../types';
import React from 'react';

// Extended Solve interface to accommodate API response format
interface ApiSolve extends Solve {
  celery_task_id?: string;
  tasks?: ApiTask[];
  results?: any; // Using any for flexibility with the API response
}

// Extended Task interface to accommodate API response format
interface ApiTask extends Task {
  status?: string;
}

export const SolveDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [solve, setSolve] = useState<ApiSolve | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ApiTask[]>([]);

  useEffect(() => {
    const fetchSolveDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch solve data
        const solveIdNumber = parseInt(id);
        const solveResponse = await apiClient.get<ApiSolve>(`/solves/${solveIdNumber}`);
        setSolve(solveResponse.data);
        
        // Set tasks from the solve response
        setTasks(solveResponse.data.tasks || []);
        
        // Fetch environment
        if (solveResponse.data.environment_id) {
          const environmentResponse = await apiClient.get<Environment>(
            `/environments/${solveResponse.data.environment_id}`
          );
          setEnvironment(environmentResponse.data);
        }
        
        // Fetch scenario
        if (solveResponse.data.scenario_id) {
          const scenarioResponse = await apiClient.get<Scenario>(
            `/scenarios/${solveResponse.data.scenario_id}`
          );
          setScenario(scenarioResponse.data);
        }
      } catch (error) {
        setError('Failed to load solve details. Please try again later.');
        console.error('Error fetching solve details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSolveDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this solve?')) return;
    
    setIsLoading(true);
    try {
      await apiClient.delete(`/solves/${id}`);
      navigate('/solves');
    } catch (error) {
      setError('Failed to delete solve.');
      console.error('Solve delete error:', error);
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  // Helper to handle both result and results properties
  const getResult = () => {
    return solve?.results || solve?.result;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link to="/solves" className="text-primary hover:underline">
              Solves
            </Link>
            <span className="text-gray-500">/</span>
            <h1 className="text-2xl font-bold">
              {isLoading ? 'Loading...' : solve?.name || 'Solve Details'}
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
        ) : solve ? (
          <div className="space-y-6">
            {/* Solve info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{solve.name}</h2>
                  {solve.description && (
                    <p className="text-gray-600 mb-4">{solve.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(solve.status)}`}>
                  {solve.status.charAt(0).toUpperCase() + solve.status.slice(1)}
                </span>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div>
                  <p className="text-sm text-gray-500 mb-1">Algorithm</p>
                  <p className="text-lg">{solve.parameters?.algorithm_type || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="text-lg">{new Date(solve.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="text-lg">{new Date(solve.updated_at).toLocaleString()}</p>
                </div>
                {solve.celery_task_id && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Task ID</p>
                    <p className="text-lg text-xs font-mono">{solve.celery_task_id}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tasks */}
            {solve && tasks.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                  
                <div className="space-y-6">
                  {tasks.map(task => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <Link to={`/tasks/${task.id}`} className="text-lg font-medium text-primary hover:underline">
                          {task.name}
                        </Link>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(task.status || 'pending')}`}>
                          {task.status || 'pending'}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium">Type: </span>
                        <span className="text-sm">{task.task_type}</span>
                      </div>
                      
                      {task.details?.tasks && task.details.tasks.length > 0 && (
                        <div>
                          <h3 className="text-md font-medium mb-2">Pickup/Dropoff Pairs</h3>
                          <div className="bg-gray-50 rounded p-3 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dropoff</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {task.details.tasks.map((pair, index) => (
                                  <tr key={index} className="hover:bg-gray-100">
                                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-medium text-blue-600">{pair[0]}</td>
                                    <td className="px-4 py-2 font-medium text-green-600">{pair[1]}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {!task.details?.tasks && task.details?.start_point && task.details?.end_point && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <span className="font-medium">Start:</span> ({task.details.start_point[0]}, {task.details.start_point[1]}) →{' '}
                          <span className="font-medium">End:</span> ({task.details.end_point[0]}, {task.details.end_point[1]})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Results */}
            {solve.status === 'completed' && getResult() && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Results</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {getResult()?.stats?.completion_time && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Completion Time</p>
                      <p className="text-2xl font-medium">{formatTime(getResult().stats.completion_time)}</p>
                    </div>
                  )}
                  
                  {getResult()?.stats?.total_distance && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Total Distance</p>
                      <p className="text-2xl font-medium">{getResult().stats.total_distance.toFixed(1)} units</p>
                    </div>
                  )}
                  
                  {getResult()?.stats?.collisions !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-500 mb-1">Collisions</p>
                      <p className="text-2xl font-medium">{getResult().stats.collisions}</p>
                    </div>
                  )}
                </div>
                
                {/* Simulation Section */}
                {environment && getResult() && Object.keys(getResult()).filter(key => key !== 'stats').length > 0 && (
                  <div className="mt-6 mb-8">
                    <h3 className="text-lg font-medium mb-4">Path Simulation</h3>
                    <RobotPathSimulation
                      environment={environment}
                      results={getResult()}
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Solution Details</h3>
                  {getResult() && (
                    <div className="space-y-6">
                      {Object.entries(getResult()).filter(([key]) => key !== 'stats').map(([robotId, tasks]) => (
                        <div key={robotId} className="border rounded-lg p-4">
                          <h4 className="text-md font-semibold bg-blue-50 p-2 mb-3 rounded">
                            Robot: {robotId} ({Array.isArray(tasks) ? tasks.length : 0} tasks)
                          </h4>
                          
                          {Array.isArray(tasks) && tasks.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task #</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup → Dropoff</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {tasks.map((task, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm font-medium">{index + 1}</td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center">
                                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-2">
                                            {task.task[0]}
                                          </span>
                                          <span className="text-gray-500">→</span>
                                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded ml-2">
                                            {task.task[1]}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1 items-center">
                                          {task.path.map((point: string, i: number) => (
                                            <React.Fragment key={i}>
                                              <span 
                                                className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                                                  point.startsWith('R') ? 'bg-blue-50 text-blue-800' :
                                                  point.startsWith('P') ? 'bg-blue-100 text-blue-800' :
                                                  point.startsWith('D') ? 'bg-green-100 text-green-800' :
                                                  point.startsWith('N') ? 'bg-gray-100 text-gray-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}
                                              >
                                                {point}
                                              </span>
                                              {i < task.path.length - 1 && (
                                                <span className="text-gray-400">→</span>
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No tasks assigned to this robot</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Status: pending, running */}
            {(solve.status === 'pending' || solve.status === 'running') && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="py-8">
                  {solve.status === 'pending' ? (
                    <>
                      <h3 className="text-xl font-medium mb-2">Waiting to start...</h3>
                      <p className="text-gray-500">Your optimization will start soon.</p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>
                      <h3 className="text-xl font-medium mb-2">Optimization in progress</h3>
                      <p className="text-gray-500">This may take a few moments.</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Status: failed */}
            {solve.status === 'failed' && (
              <div className="bg-red-50 rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-medium text-red-700 mb-2">Optimization Failed</h3>
                <p className="text-red-600 mb-4">The optimization process encountered an error.</p>
                
                {/* Access error using a type assertion */}
                {getResult() && 'error' in getResult() && (
                  <div className="bg-white p-4 rounded-md">
                    <p className="font-medium mb-1">Error Details:</p>
                    <pre className="text-sm overflow-x-auto">
                      {getResult().error}
                    </pre>
                  </div>
                )}
                
                <div className="mt-6">
                  <Link to="/solves/create" className="btn btn-primary">
                    Try Again
                  </Link>
                </div>
              </div>
            )}
            
            {/* Solve Parameters */}
            {/* <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Solver Parameters</h2>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                {JSON.stringify(solve.parameters, null, 2)}
              </pre>
            </div> */}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Solve not found</h3>
            <p className="text-gray-500 mb-4">
              The solve you are looking for may have been deleted or never existed.
            </p>
            <Link to="/solves" className="btn btn-primary">
              Back to Solves
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 