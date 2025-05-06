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
  const [expandedRobots, setExpandedRobots] = useState<Record<string, boolean>>({});

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

  // Add a battery calculation function
  const calculateBatteryPercentage = (distanceTraveled: number, maxDistance: number, batteryCapacity: number): number => {
    if (!maxDistance || maxDistance <= 0) return batteryCapacity;
    
    // Linear relationship: battery decreases proportionally to distance traveled
    const batteryPercentage = batteryCapacity * (1 - (distanceTraveled / maxDistance));
    return Math.max(0, Math.min(batteryCapacity, batteryPercentage));
  };

  const toggleRobotExpanded = (robotId: string) => {
    setExpandedRobots(prev => ({
      ...prev,
      [robotId]: !prev[robotId]
    }));
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
                  {/* <div>
                    <p className="text-sm text-gray-400 mb-1">Created</p>
                    <p className="text-lg text-white">{new Date(solve.created_at).toLocaleString()}</p>
                  </div> */}
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
                    {/* Calculate metrics from results */}
                    {getResult() && (
                      <>
                        <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Total Deliveries</p>
                          <p className="text-2xl font-medium text-white">
                            {Object.values(getResult())
                              .flat()
                              .filter((task: any) => task.task !== 'recharge' && task.task !== 'recharge_in_place')
                              .length}
                          </p>
                        </div>
                        
                        <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Total Distance</p>
                          <p className="text-2xl font-medium text-white">
                            {(() => {
                              // Get all tasks from all robots
                              // const allTasks = Object.values(getResult()).flat() as any[];
                              
                              // Find the robot with the maximum total distance
                              // const maxDistance = Math.max(
                              //   ...Object.values(getResult()).map((robotTasks: any) => {
                              //     const tasks = Array.isArray(robotTasks) ? robotTasks : [];
                              //     return tasks.length > 0 ? tasks[tasks.length - 1].total_distance || 0 : 0;
                              //   })
                              // );
                              
                              // Calculate combined distance across all robots
                              const totalDistance = Object.values(getResult())
                                .map((robotTasks: any) => {
                                  const tasks = Array.isArray(robotTasks) ? robotTasks : [];
                                  return tasks.length > 0 ? tasks[tasks.length - 1].total_distance || 0 : 0;
                                })
                                .reduce((sum, distance) => sum + distance, 0);
                                
                              return `${totalDistance.toFixed(2)} meters`;
                            })()}
                          </p>
                        </div>
                        
                        <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Max Completion Time</p>
                          <p className="text-2xl font-medium text-white">
                            {formatTime(
                              Math.max(
                                ...Object.values(getResult())
                                  .flat()
                                  .map((task: any) => task.completion_time || 0)
                              )
                            )}
                          </p>
                        </div>
                        
                        <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Total Recharges</p>
                          <p className="text-2xl font-medium text-white">
                            {Object.values(getResult())
                              .flat()
                              .filter((task: any) => task.task === 'recharge' || task.task === 'recharge_in_place')
                              .length}
                          </p>
                        </div>

                        <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Total Recharge Time</p>
                          <p className="text-2xl font-medium text-white">
                            {(() => {
                              const totalRechargeTime = Object.values(getResult())
                                .flat()
                                .filter((task: any) => task.task === 'recharge' || task.task === 'recharge_in_place')
                                .reduce((sum: number, task: any) => sum + (task.recharge_time || 0), 0);
                              return `${totalRechargeTime} min`;
                            })()}
                          </p>
                        </div>

                        <div className="bg-gray-900/70 p-4 rounded-md border border-gray-700">
                          <p className="text-sm text-gray-400 mb-1">Battery Efficiency</p>
                          <p className="text-2xl font-medium text-white">
                            {(() => {
                              // Get parameters
                              const batteryCapacity = solve.parameters?.battery_capacity || 100;
                              const maxDistance = solve.parameters?.max_distance || 1000;
                              
                              // Calculate total distance traveled
                              const allTasks = Object.values(getResult()).flat() as any[];
                              const totalDistance = Math.max(...allTasks.map((t) => t.total_distance || 0));
                              
                              // Calculate total battery used based on our formula
                              const totalBatteryUsed = totalDistance / maxDistance * batteryCapacity;
                              
                              return totalBatteryUsed > 0 ? 
                                `${(totalDistance / totalBatteryUsed).toFixed(2)} meters/batt` : 
                                'N/A';
                            })()}
                          </p>
                        </div>
                      </>
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
                          batteryCapacity={solve.parameters?.battery_capacity || 100}
                          maxDistance={solve.parameters?.max_distance || 1000}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-300">Solution Details</h3>
                    {getResult() && (
                      <div className="space-y-6">
                        {Object.entries(getResult()).filter(([key]) => key !== 'stats').map(([robotId, tasks]) => {
                          const robotTasks = Array.isArray(tasks) ? tasks : [];
                          const isExpanded = !!expandedRobots[robotId];
                          
                          return (
                            <div key={robotId} className="border border-gray-700 rounded-lg p-4 bg-gray-900/30">
                              <div 
                                className="flex justify-between items-center cursor-pointer"
                                onClick={() => toggleRobotExpanded(robotId)}
                              >
                                <h4 className="text-md font-semibold bg-blue-900/50 border border-blue-700/30 p-2 rounded text-blue-200 flex-1">
                                  Robot: {robotId} ({robotTasks.filter(t => t.task !== 'recharge' && t.task !== 'recharge_in_place').length} tasks)
                                </h4>
                                <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full ml-2">
                                  {isExpanded ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              
                              {/* Always show summary metrics */}
                              {robotTasks.length > 0 && (
                                <div className="mt-3 grid grid-cols-3 gap-3">
                                  <div className="bg-gray-800/70 p-3 rounded-lg border border-blue-900/30">
                                    <div className="text-xs text-gray-400 mb-1">Deliveries</div>
                                    <div className="text-lg font-medium text-blue-400">
                                      {robotTasks.filter(t => t.task !== 'recharge' && t.task !== 'recharge_in_place').length}
                                    </div>
                                  </div>
                                  <div className="bg-gray-800/70 p-3 rounded-lg border border-blue-900/30">
                                    <div className="text-xs text-gray-400 mb-1">Recharges</div>
                                    <div className="text-lg font-medium text-blue-400">
                                      {robotTasks.filter(t => t.task === 'recharge' || t.task === 'recharge_in_place').length}
                                    </div>
                                  </div>
                                  <div className="bg-gray-800/70 p-3 rounded-lg border border-blue-900/30">
                                    <div className="text-xs text-gray-400 mb-1">Total Distance</div>
                                    <div className="text-lg font-medium text-blue-400">
                                      {robotTasks.length > 0 ? `${robotTasks[robotTasks.length - 1].total_distance?.toFixed(2)}m` : '0m'}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Show detailed content only when expanded */}
                              {isExpanded && (
                                robotTasks.length > 0 ? (
                                  <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700">
                                      <thead className="bg-gray-900/70">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Task #</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pickup → Dropoff</th>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Path</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-700">
                                        {robotTasks.map((task, index) => (
                                          <tr key={index} className="hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-300">{index + 1}</td>
                                            <td className="px-4 py-3">
                                              {task.task === 'recharge' || task.task === 'recharge_in_place' ? (
                                                <div className="flex items-center">
                                                  <span className="inline-flex items-center px-2 py-1 bg-purple-900/60 text-purple-200 border border-purple-700/30 text-xs rounded">
                                                    {task.task === 'recharge_in_place' ? 'Recharge In Place' : (
                                                      <>
                                                        Recharge at {task.path?.[task.path.length-1] || "Station"}
                                                        {task.recharge_time && <span className="ml-1 bg-purple-800 px-1 rounded-sm">{task.recharge_time} min</span>}
                                                      </>
                                                    )}
                                                  </span>
                                                </div>
                                              ) : (
                                                <div className="flex items-center">
                                                  <span className="inline-flex items-center px-2 py-1 bg-blue-900/60 text-blue-200 border border-blue-700/30 text-xs rounded mr-2">
                                                    {task.task[0]}
                                                  </span>
                                                  <span className="text-gray-500">→</span>
                                                  <span className="inline-flex items-center px-2 py-1 bg-green-900/60 text-green-200 border border-green-700/30 text-xs rounded ml-2">
                                                    {task.task[1]}
                                                  </span>
                                                </div>
                                              )}
                                            </td>
                                            <td className="px-4 py-3">
                                              {task.path ? (
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
                                              ) : (
                                                <span className="text-gray-400 italic">No path (in-place operation)</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    
                                    {/* Performance Metrics table */}
                                    <div className="mt-4 bg-gray-900/70 rounded p-3 overflow-x-auto">
                                      <h5 className="text-sm font-medium text-gray-300 mb-2">Performance Metrics</h5>
                                      <table className="min-w-full divide-y divide-gray-700">
                                        <thead>
                                          <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Metric</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                          {/* Get last task to show final metrics */}
                                          <>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Total Distance</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {robotTasks[robotTasks.length - 1].total_distance?.toFixed(2)} meters
                                              </td>
                                            </tr>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Total Time</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {robotTasks[robotTasks.length - 1].completion_time?.toFixed(2)}s
                                              </td>
                                            </tr>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Deliveries Completed</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {robotTasks.filter(t => t.task !== 'recharge' && t.task !== 'recharge_in_place').length}
                                              </td>
                                            </tr>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Recharges</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {robotTasks.filter(t => t.task === 'recharge' || t.task === 'recharge_in_place').length}
                                              </td>
                                            </tr>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Recharge Time</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {(() => {
                                                  const totalRechargeTime = robotTasks
                                                    .filter(t => t.task === 'recharge' || t.task === 'recharge_in_place')
                                                    .reduce((sum, t) => sum + (t.recharge_time || 0), 0);
                                                  return `${totalRechargeTime} min`;
                                                })()}
                                              </td>
                                            </tr>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Final Battery</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {(() => {
                                                  const batteryCapacity = solve.parameters?.battery_capacity || 100;
                                                  const maxDistance = solve.parameters?.max_distance || 1000;
                                                  const totalDistance = robotTasks[robotTasks.length - 1].total_distance || 0;
                                                  
                                                  const batteryRemaining = calculateBatteryPercentage(totalDistance, maxDistance, batteryCapacity);
                                                  return `${batteryRemaining.toFixed(2)}%`;
                                                })()}
                                              </td>
                                            </tr>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Min Battery Level</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {Math.min(...robotTasks.map(t => t.battery_remaining || 0)).toFixed(1)}%
                                              </td>
                                            </tr>
                                            <tr className="hover:bg-gray-800/50">
                                              <td className="px-4 py-2 text-sm text-gray-300">Avg Battery Level</td>
                                              <td className="px-4 py-2 font-medium text-blue-400">
                                                {(robotTasks.reduce((sum, t) => sum + (t.battery_remaining || 0), 0) / robotTasks.length).toFixed(1)}%
                                              </td>
                                            </tr>
                                          </>
                                        </tbody>
                                      </table>
                                    </div>
                                    
                                    {/* Battery levels table */}
                                    {robotTasks.length > 0 && robotTasks[0].battery_remaining !== undefined && (
                                      <div className="mt-4 bg-gray-900/70 rounded p-3">
                                        <h5 className="text-sm font-medium text-gray-300 mb-2">Battery Levels</h5>
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-gray-700">
                                            <thead>
                                              <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Task #</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Task Type</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Battery Level</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                              {robotTasks.map((task, index) => (
                                                <tr key={index} className="hover:bg-gray-800/50">
                                                  <td className="px-3 py-2 text-sm text-gray-400">{index + 1}</td>
                                                  <td className="px-3 py-2 text-sm">
                                                    {task.task === 'recharge' || task.task === 'recharge_in_place' ? (
                                                      <span className="inline-flex items-center px-2 py-1 bg-purple-900/60 text-purple-200 text-xs rounded">
                                                        {task.task === 'recharge_in_place' ? 'Recharge In Place' : (
                                                          <>
                                                            Recharge at {task.path?.[task.path.length-1] || "Station"}
                                                            {task.recharge_time && <span className="ml-1 bg-purple-800 px-1 rounded-sm">{task.recharge_time} min</span>}
                                                          </>
                                                        )}
                                                      </span>
                                                    ) : (
                                                      <span className="text-gray-300">Delivery</span>
                                                    )}
                                                  </td>
                                                  <td className="px-3 py-2 text-sm">
                                                    <div className="flex items-center">
                                                      <div className="w-16 bg-gray-700 h-2 rounded-full mr-2">
                                                        <div 
                                                          className={`h-2 rounded-full ${
                                                            task.battery_remaining > 70 ? 'bg-green-500' : 
                                                            task.battery_remaining > 30 ? 'bg-yellow-500' : 
                                                            'bg-red-500'
                                                          }`}
                                                          style={{ width: `${Math.min(100, Math.max(0, task.battery_remaining))}%` }}
                                                        />
                                                      </div>
                                                      <span className={`text-sm ${
                                                        task.battery_remaining > 70 ? 'text-green-400' : 
                                                        task.battery_remaining > 30 ? 'text-yellow-400' : 
                                                        'text-red-400'
                                                      }`}>
                                                        {task.battery_remaining?.toFixed(1)}%
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="px-3 py-2 text-sm">
                                                    {task.battery_remaining <= 20 && task.task !== 'recharge' && task.task !== 'recharge_in_place' ? (
                                                      <span className="inline-flex items-center px-2 py-1 bg-red-900/60 text-red-200 text-xs rounded">
                                                        Low Battery
                                                      </span>
                                                    ) : task.battery_remaining >= 80 ? (
                                                      <span className="inline-flex items-center px-2 py-1 bg-green-900/60 text-green-200 text-xs rounded">
                                                        Full
                                                      </span>
                                                    ) : (
                                                      <span className="inline-flex items-center px-2 py-1 bg-blue-900/60 text-blue-200 text-xs rounded">
                                                        Normal
                                                      </span>
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Battery history visualization */}
                                    {robotTasks.length > 0 && robotTasks[0].battery_remaining !== undefined && (
                                      <div className="mt-4 bg-gray-900/70 rounded p-3">
                                        <h5 className="text-sm font-medium text-gray-300 mb-2">Battery History</h5>
                                        <div className="flex items-center space-x-1 overflow-x-auto pb-2">
                                          {robotTasks.map((task, index) => (
                                            <div key={index} className="flex flex-col items-center min-w-[40px]">
                                              <div className="h-20 w-6 bg-gray-700 rounded-sm relative mb-1">
                                                <div 
                                                  className={`absolute bottom-0 w-full rounded-sm transition-all ${
                                                    task.battery_remaining > 70 ? 'bg-green-500' : 
                                                    task.battery_remaining > 30 ? 'bg-yellow-500' : 
                                                    'bg-red-500'
                                                  }`} 
                                                  style={{ height: `${Math.min(100, Math.max(0, task.battery_remaining))}%` }}
                                                />
                                              </div>
                                              <span className="text-xs text-gray-400">{index + 1}</span>
                                              {task.task === 'recharge' || task.task === 'recharge_in_place' ? (
                                                <div className="flex flex-col items-center">
                                                  <span className="text-xs text-purple-400">⚡</span>
                                                  {task.recharge_time && (
                                                    <span className="text-xs text-purple-300">{task.recharge_time}m</span>
                                                  )}
                                                  {task.task === 'recharge' && task.path && task.path.length > 1 && (
                                                    <span className="text-xs text-blue-300">{task.path[task.path.length-1]}</span>
                                                  )}
                                                </div>
                                              ) : null}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 italic mt-3">No tasks assigned to this robot</p>
                                )
                              )}
                            </div>
                          );
                        })}
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