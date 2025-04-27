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
      case 'pickup': return 'bg-blue-100 text-blue-800';
      case 'delivery': return 'bg-green-100 text-green-800';
      case 'pickup_delivery': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <div className="flex gap-2">
            <Link to="/tasks/create" className="btn btn-primary">
              Create Task
            </Link>
            <Link to="/tasks/generate" className="btn btn-secondary">
              Generate Tasks
            </Link>
          </div>
        </div>
        
        {/* Scenario filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Filter by Scenario</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                !scenarioId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleScenarioFilter(scenario.id.toString())}
              >
                {scenario.name}
              </button>
            ))}
          </div>
          
          <h2 className="text-sm font-medium text-gray-500 mb-2">Filter by Type</h2>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTaskType === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTaskType('all')}
            >
              All Types
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTaskType === 'pickup' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTaskType('pickup')}
            >
              Pickup
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTaskType === 'delivery' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTaskType('delivery')}
            >
              Delivery
            </button>
            <button
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTaskType === 'pickup_delivery' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedTaskType('pickup_delivery')}
            >
              Pickup & Delivery
            </button>
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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500 mb-4">
                  {scenarioId 
                    ? 'No tasks exist for the selected scenario. Create one now!' 
                    : 'Create your first task to get started.'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Link to="/tasks/create" className="btn btn-primary">
                    Create Task
                  </Link>
                  <Link to="/tasks/generate" className="btn btn-secondary">
                    Generate Tasks
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scenario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{task.name}</div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskTypeBadgeClass(task.task_type)}`}>
                            {getTaskTypeLabel(task.task_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.details.priority}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getScenarioName(task.scenario_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link to={`/tasks/${task.id}`} className="text-primary hover:text-primary/80 mr-3">
                            View
                          </Link>
                          <Link to={`/tasks/${task.id}/edit`} className="text-gray-600 hover:text-gray-900">
                            Edit
                          </Link>
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
    </MainLayout>
  );
}; 