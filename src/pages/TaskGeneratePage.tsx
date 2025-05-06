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
  const [taskType, setTaskType] = useState<TaskType | ''>('pickup_delivery');
  const [name, setName] = useState('');
  const [description, ] = useState('');

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
      case 'pickup': return 'bg-blue-900/50 text-blue-300 border border-blue-700/50';
      case 'delivery': return 'bg-green-900/50 text-green-300 border border-green-700/50';
      case 'pickup_delivery': return 'bg-purple-900/50 text-purple-300 border border-purple-700/50';
      default: return 'bg-gray-900/50 text-gray-300 border border-gray-700/50';
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Generate Tasks with AI</h1>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
            <form onSubmit={handleGenerate} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-900/50 border border-green-700 text-green-200 p-4 rounded-lg">
                  {success}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="scenario" className="block text-sm font-medium text-gray-300 mb-1">
                    Scenario <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="scenario"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
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
                    <p className="mt-1 text-sm text-red-300">
                      You need to create a scenario first.{' '}
                      <button
                        type="button"
                        className="text-blue-400 hover:text-blue-300 transition-colors underline"
                        onClick={() => navigate('/scenarios/create')}
                      >
                        Create one now
                      </button>
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Task Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name of the generated tasks"
                  />
                  {/* <p className="mt-1 text-xs text-gray-500">
                    Will be used as a prefix for all generated tasks. A number will be appended to each task.
                  </p> */}
                </div>
                
                {/* <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Task Description
                  </label>
                  <textarea
                    id="description"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 h-24"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Common description for the generated tasks"
                  />
                </div> */}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="num-tasks" className="block text-sm font-medium text-gray-300 mb-1">
                      Number of Tasks
                    </label>
                    <input
                      type="number"
                      id="num-tasks"
                      className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      min={1}
                      // max={20}
                      value={numTasks}
                      onChange={(e) => setNumTasks(parseInt(e.target.value) || 5)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="task-type" className="block text-sm font-medium text-gray-300 mb-1">
                      Task Type
                    </label>
                    <select
                      id="task-type"
                      className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value as TaskType | '')}
                    >
                      {/* <option value="">Any Type</option> */}
                      {/* <option value="pickup">Pickup</option> */}
                      {/* <option value="delivery">Delivery</option> */}
                      <option value="pickup_delivery">Pickup & Delivery</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => navigate('/tasks')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors relative overflow-hidden group"
                  disabled={isLoading || scenarios.length === 0}
                >
                  <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-blue-500 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
                  <span className="relative">
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : 'Generate Tasks'}
                  </span>
                </button>
              </div>
            </form>
          </div>
          
          {/* Display generated tasks */}
          {generatedTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-200">Generated Tasks</h2>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors relative overflow-hidden group"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-blue-500 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
                  <span className="relative">
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : 'Save All Tasks'}
                  </span>
                </button>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/30">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Start Point
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        End Point
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {generatedTasks.map((task, index) => (
                      <tr key={index} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-200">{task.name}</div>
                          <div className="text-sm text-gray-400">{task.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskTypeBadgeClass(task.task_type)}`}>
                            {getTaskTypeLabel(task.task_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          [{task.details.start_point[0]}, {task.details.start_point[1]}]
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          [{task.details.end_point[0]}, {task.details.end_point[1]}]
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
        
        {/* Tech overlay elements */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
    </MainLayout>
  );
}; 