import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Scenario, Task, TaskType } from '../types';

export const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | 'all'>('all');
  
  const scenarioId = searchParams.get('scenario_id');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch scenarios first
        const scenariosResponse = await apiClient.get<Scenario[]>('/scenarios');
        setScenarios(scenariosResponse.data);
        
        // Fetch tasks, filtered by scenario_id if provided
        let url = '/tasks';
        if (scenarioId) {
          url += `?scenario_id=${scenarioId}`;
        }
        
        const tasksResponse = await apiClient.get<Task[]>(url);
        setTasks(tasksResponse.data);
      } catch (error) {
        setError('Failed to load tasks. Please try again later.');
        console.error('Tasks fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [scenarioId]);

  const handleScenarioFilter = (id: string | null) => {
    if (id) {
      setSearchParams({ scenario_id: id });
    } else {
      setSearchParams({});
    }
  };

  const getScenarioName = (id: number) => {
    const scenario = scenarios.find(s => s.id === id);
    return scenario ? scenario.name : `Scenario ${id}`;
  };

  const filteredTasks = selectedTaskType === 'all' 
    ? tasks 
    : tasks.filter(task => task.task_type === selectedTaskType);

  const getTaskTypeLabel = (type: TaskType) => {
    switch (type) {
      case 'pickup': return 'Pickup';
      case 'delivery': return 'Delivery';
      case 'pickup_delivery': return 'Pickup & Delivery';
      default: return type;
    }
  };

  const getTaskTypeBadgeClass = (type: TaskType) => {
    switch (type) {
      case 'pickup': return 'bg-blue-900/50 text-blue-300';
      case 'delivery': return 'bg-green-900/50 text-green-300';
      case 'pickup_delivery': return 'bg-purple-900/50 text-purple-300';
      default: return 'bg-gray-900/50 text-gray-300';
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Tasks</h1>
            <div className="flex gap-2">
              {/* <Link to="/tasks/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Create Task
              </Link> */}
              <Link to="/tasks/generate" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                Generate Tasks
              </Link>
            </div>
          </div>
          

          {/* Scenario filter */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">

            <h2 className="text-sm font-medium text-gray-300 mb-2">Filter by Scenario</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  !scenarioId ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                }`}
                onClick={() => handleScenarioFilter(null)}
              >
                All
              </button>
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  className={`px-3 py-1 rounded-full text-sm ${
                    scenarioId === scenario.id.toString() 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                  }`}
                  onClick={() => handleScenarioFilter(scenario.id.toString())}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
            
            <h2 className="text-sm font-medium text-gray-300 mb-2">Filter by Type</h2>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTaskType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                }`}
                onClick={() => setSelectedTaskType('all')}
              >
                All Types
              </button>
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTaskType === 'pickup' ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                }`}
                onClick={() => setSelectedTaskType('pickup')}
              >
                Pickup
              </button>
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTaskType === 'delivery' ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                }`}
                onClick={() => setSelectedTaskType('delivery')}
              >
                Delivery
              </button>
              <button
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTaskType === 'pickup_delivery' ? 'bg-blue-600 text-white' : 'bg-gray-700/70 text-gray-300 hover:bg-gray-700 transition-colors'
                }`}
                onClick={() => setSelectedTaskType('pickup_delivery')}
              >
                Pickup & Delivery
              </button>
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
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl overflow-hidden">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-200 mb-2">No tasks found</h3>
                  <p className="text-gray-400 mb-4">
                    {scenarioId 
                      ? 'No tasks exist for the selected scenario. Create one now!' 
                      : 'Create your first task to get started.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {/* <Link to="/tasks/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                      Create Task
                    </Link> */}
                    <Link to="/tasks/generate" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors">
                      Generate Tasks
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800/70">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Priority
                        </th> */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Scenario
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900/50 divide-y divide-gray-700">
                      {filteredTasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-200">{task.name}</div>
                            {/* <div className="text-sm text-gray-400">{task.description}</div> */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskTypeBadgeClass(task.task_type)}`}>
                              {getTaskTypeLabel(task.task_type)}
                            </span>
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {task.details.priority}
                          </td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {getScenarioName(task.scenario_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/tasks/${task.id}`} className="text-blue-400 hover:text-blue-300 transition-colors mr-3">
                              View
                            </Link>
                            {/* <Link to={`/tasks/${task.id}/edit`} className="text-gray-400 hover:text-gray-300 transition-colors">
                              Edit
                            </Link> */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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