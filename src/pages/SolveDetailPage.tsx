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
      case 'pending': return 'bg-yellow-500/60 text-yellow-100 border border-yellow-500/30';
      case 'running': return 'bg-blue-500/60 text-blue-100 border border-blue-500/30';
      case 'completed': return 'bg-green-500/60 text-green-100 border border-green-500/30';
      case 'failed': return 'bg-red-500/60 text-red-100 border border-red-500/30';
      default: return 'bg-gray-500/60 text-gray-100 border border-gray-500/30';
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
              <Link to="/solves" className="text-blue-400 hover:text-blue-300 transition-colors">
                Solves
              </Link>
              <span className="text-gray-500">/</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                {isLoading ? 'Loading...' : solve?.name || 'Solve Details'}
              </h1>
            </div>
            <div className="flex space-x-3">
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
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : solve ? (
            <div className="space-y-6">
              {/* Solve info */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-200">{solve.name}</h2>
                    {solve.description && (
                      <p className="text-gray-400 mb-4">{solve.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(solve.status)}`}>
                    {solve.status.charAt(0).toUpperCase() + solve.status.slice(1)}
                  </span>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Environment</p>
                    <p className="text-lg text-white">
                      {environment ? (
                        <Link to={`/environments/${environment.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                          {environment.name}
                        </Link>
                      ) : 'Loading...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Scenario</p>
                    <p className="text-lg text-white">
                      {scenario ? (
                        <Link to={`/scenarios/${scenario.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                          {scenario.name}
                        </Link>
                      ) : 'Loading...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Algorithm</p>
                    <p className="text-lg text-white">{solve.parameters?.algorithm_type || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Created</p>
                    <p className="text-lg text-white">{new Date(solve.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                    <p className="text-lg text-white">{new Date(solve.updated_at).toLocaleString()}</p>
                  </div>
                  {solve.celery_task_id && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Task ID</p>
                      <p className="text-lg text-xs font-mono text-gray-300">{solve.celery_task_id}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tasks */}
              {solve && tasks.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                  <h2 className="text-xl font-semibold mb-4 text-gray-200">Tasks</h2>
                    
                  <div className="space-y-6">
                    {tasks.map(task => (
                      <div key={task.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/30">
                        <div className="flex justify-between mb-3">
                          <Link to={`/tasks/${task.id}`} className="text-lg font-medium text-blue-400 hover:text-blue-300 transition-colors">
                            {task.name}
                          </Link>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(task.status || 'pending')}`}>
                            {task.status || 'pending'}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-gray-400 mb-3">{task.description}</p>
                        )}
                        
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-300">Type: </span>
                          <span className="text-sm text-gray-400">{task.task_type}</span>
                        </div>
                        
                        {task.details?.tasks && task.details.tasks.length > 0 && (
                          <div>
                            <h3 className="text-md font-medium mb-2 text-gray-300">Pickup/Dropoff Pairs</h3>
                            <div className="bg-gray-900/70 rounded p-3 overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-700">
                                <thead>
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pickup</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dropoff</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                  {task.details.tasks.map((pair, index) => (
                                    <tr key={index} className="hover:bg-gray-800/50">
                                      <td className="px-4 py-2 text-sm text-gray-400">{index + 1}</td>
                                      <td className="px-4 py-2 font-medium text-blue-400">{pair[0]}</td>
                                      <td className="px-4 py-2 font-medium text-green-400">{pair[1]}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        {!task.details?.tasks && task.details?.start_point && task.details?.end_point && (
                          <div className="bg-gray-900/70 p-3 rounded text-sm">
                            <span className="font-medium text-gray-300">Start:</span> <span className="text-blue-400">({task.details.start_point[0]}, {task.details.start_point[1]})</span> →{' '}
                            <span className="font-medium text-gray-300">End:</span> <span className="text-green-400">({task.details.end_point[0]}, {task.details.end_point[1]})</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Results */}
              {solve.status === 'completed' && getResult() && (
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
                  <h2 className="text-xl font-semibold mb-4 text-gray-200">Results</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {getResult()?.stats?.completion_time && (
                      <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Completion Time</p>
                        <p className="text-2xl font-medium text-white">{formatTime(getResult().stats.completion_time)}</p>
                      </div>
                    )}
                    
                    {getResult()?.stats?.total_distance && (
                      <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Total Distance</p>
                        <p className="text-2xl font-medium text-white">{getResult().stats.total_distance.toFixed(1)} units</p>
                      </div>
                    )}
                    
                    {getResult()?.stats?.collisions !== undefined && (
                      <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Collisions</p>
                        <p className="text-2xl font-medium text-white">{getResult().stats.collisions}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Simulation Section */}
                  {environment && getResult() && Object.keys(getResult()).filter(key => key !== 'stats').length > 0 && (
                    <div className="mt-6 mb-8">
                      <h3 className="text-lg font-medium mb-4 text-gray-300">Path Simulation</h3>
                      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl text-gray-600">
                        <RobotPathSimulation
                          environment={environment}
                          results={getResult()}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-300">Solution Details</h3>
                    {getResult() && (
                      <div className="space-y-6">
                        {Object.entries(getResult()).filter(([key]) => key !== 'stats').map(([robotId, tasks]) => (
                          <div key={robotId} className="border border-gray-700 rounded-lg p-4 bg-gray-900/30">
                            <h4 className="text-md font-semibold bg-blue-900/50 border border-blue-700/30 p-2 mb-3 rounded text-blue-200">
                              Robot: {robotId} ({Array.isArray(tasks) ? tasks.length : 0} tasks)
                            </h4>
                            
                            {Array.isArray(tasks) && tasks.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                  <thead className="bg-gray-900/70">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Task #</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pickup → Dropoff</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Path</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700">
                                    {tasks.map((task, index) => (
                                      <tr key={index} className="hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-300">{index + 1}</td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center">
                                            <span className="inline-flex items-center px-2 py-1 bg-blue-900/60 text-blue-200 border border-blue-700/30 text-xs rounded mr-2">
                                              {task.task[0]}
                                            </span>
                                            <span className="text-gray-500">→</span>
                                            <span className="inline-flex items-center px-2 py-1 bg-green-900/60 text-green-200 border border-green-700/30 text-xs rounded ml-2">
                                              {task.task[1]}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex flex-wrap gap-1 items-center">
                                            {task.path.map((point: string, i: number) => (
                                              <React.Fragment key={i}>
                                                <span 
                                                  className={`inline-flex items-center px-2 py-1 text-xs rounded border ${
                                                    point.startsWith('R') ? 'bg-blue-900/40 text-blue-200 border-blue-700/30' :
                                                    point.startsWith('P') ? 'bg-blue-900/60 text-blue-200 border-blue-700/30' :
                                                    point.startsWith('D') ? 'bg-green-900/60 text-green-200 border-green-700/30' :
                                                    point.startsWith('N') ? 'bg-gray-800/60 text-gray-300 border-gray-700/30' :
                                                    'bg-gray-800/60 text-gray-300 border-gray-700/30'
                                                  }`}
                                                >
                                                  {point}
                                                </span>
                                                {i < task.path.length - 1 && (
                                                  <span className="text-gray-500">→</span>
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
                              <p className="text-gray-400 italic">No tasks assigned to this robot</p>
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
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl text-center">
                  <div className="py-8">
                    {solve.status === 'pending' ? (
                      <>
                        <h3 className="text-xl font-medium mb-2 text-gray-200">Waiting to start...</h3>
                        <p className="text-gray-400">Your optimization will start soon.</p>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-center mb-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                        <h3 className="text-xl font-medium mb-2 text-gray-200">Optimization in progress</h3>
                        <p className="text-gray-400">This may take a few moments.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Status: failed */}
              {solve.status === 'failed' && (
                <div className="bg-red-900/30 backdrop-blur-sm rounded-lg border border-red-700/50 shadow-xl p-6">
                  <h3 className="text-xl font-medium text-red-300 mb-2">Optimization Failed</h3>
                  <p className="text-red-200 mb-4">The optimization process encountered an error.</p>
                  
                  {/* Access error using a type assertion */}
                  {getResult() && 'error' in getResult() && (
                    <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-md">
                      <p className="font-medium mb-1 text-gray-300">Error Details:</p>
                      <pre className="text-sm overflow-x-auto text-red-300">
                        {getResult().error}
                      </pre>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <Link to="/solves/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-block">
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
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 text-center rounded-lg border border-gray-700/50 shadow-xl">
              <h3 className="text-lg font-medium text-gray-200 mb-2">Solve not found</h3>
              <p className="text-gray-400 mb-4">
                The solve you are looking for may have been deleted or never existed.
              </p>
              <Link to="/solves" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-block">
                Back to Solves
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