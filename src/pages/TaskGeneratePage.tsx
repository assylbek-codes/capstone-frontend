import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Scenario, Task, TaskType } from '../types';

export const TaskGeneratePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);
  
  const [scenarioId, setScenarioId] = useState<number | ''>('');
  const [numTasks, setNumTasks] = useState(5);
  const [taskType, setTaskType] = useState<TaskType | ''>('pickup');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Fetch scenarios on component mount
  useEffect(() => {
    const fetchScenarios = async () => {
      setIsLoadingScenarios(true);
      try {
        const response = await apiClient.get<Scenario[]>('/scenarios');
        setScenarios(response.data);
        
        // Set the first scenario as default if available
        if (response.data.length > 0) {
          setScenarioId(response.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
      } finally {
        setIsLoadingScenarios(false);
      }
    };
    
    fetchScenarios();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scenarioId) {
      setError('Please select a scenario');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedTasks([]);
    
    try {
      // Prepare query parameters
      const params = new URLSearchParams();
      params.append('scenario_id', scenarioId.toString());
      params.append('num_tasks', numTasks.toString());
      if (taskType) {
        params.append('task_type', taskType);
      }
      if (name) {
        params.append('name', name);
      }
      if (description) {
        params.append('description', description);
      }
      
      const response = await apiClient.post<Task[]>(`/tasks/generate?${params.toString()}`);
      setGeneratedTasks(response.data);
      setSuccess(`Successfully generated ${response.data.length} tasks.`);
    } catch (error) {
      setError('Failed to generate tasks. Please try again.');
      console.error('Task generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (generatedTasks.length === 0) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the batch endpoint to save all tasks at once
      await apiClient.post('/tasks/batch', generatedTasks);
      navigate(`/tasks?scenario_id=${scenarioId}`);
    } catch (error) {
      setError('Failed to save tasks. Please try again.');
      console.error('Task save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Generate Tasks with AI</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-md">
                {success}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario <span className="text-red-500">*</span>
                </label>
                <select
                  id="scenario"
                  className="input w-full"
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value ? Number(e.target.value) : '')}
                  required
                  disabled={isLoadingScenarios}
                >
                  {isLoadingScenarios ? (
                    <option>Loading scenarios...</option>
                  ) : scenarios.length === 0 ? (
                    <option value="">No scenarios available</option>
                  ) : (
                    <>
                      <option value="">Select a scenario</option>
                      {scenarios.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.environment?.name || `Environment ${s.environment_id}`})
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {scenarios.length === 0 && !isLoadingScenarios && (
                  <p className="mt-1 text-sm text-red-500">
                    You need to create a scenario first.{' '}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => navigate('/scenarios/create')}
                    >
                      Create one now
                    </button>
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name Prefix (Optional)
                </label>
                <input
                  type="text"
                  id="name"
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Warehouse Pickup Task"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Will be used as a prefix for all generated tasks. A number will be appended to each task.
                </p>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Description (Optional)
                </label>
                <textarea
                  id="description"
                  className="input w-full h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Common description for all generated tasks"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="num-tasks" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Tasks
                  </label>
                  <input
                    type="number"
                    id="num-tasks"
                    className="input w-full"
                    min={1}
                    // max={20}
                    value={numTasks}
                    onChange={(e) => setNumTasks(parseInt(e.target.value) || 5)}
                  />
                </div>
                
                <div>
                  <label htmlFor="task-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Type (Optional)
                  </label>
                  <select
                    id="task-type"
                    className="input w-full"
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType | '')}
                  >
                    <option value="">Any Type</option>
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                    <option value="pickup_delivery">Pickup & Delivery</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/tasks')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || scenarios.length === 0}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : 'Generate Tasks'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Display generated tasks */}
        {generatedTasks.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Generated Tasks</h2>
              <button
                className="btn btn-secondary"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save All Tasks'}
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                      Start Point
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Point
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generatedTasks.map((task, index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
                        [{task.details.start_point[0]}, {task.details.start_point[1]}]
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        [{task.details.end_point[0]}, {task.details.end_point[1]}]
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.details.priority}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}; 