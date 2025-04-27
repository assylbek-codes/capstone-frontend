import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import apiClient from '../api/client';
import { Scenario, Task } from '../types';

export const SolveCreatePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  
  const [scenarioId, setScenarioId] = useState<number | ''>('');
  const [taskId, setTaskId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [algorithmId, setAlgorithmId] = useState(1); // Default to 1
  const [algorithmType, setAlgorithmType] = useState('greedy_distance');
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes default

  const AlgorithmsIdMap = {
    'greedy_distance': 1,
    'hungarian': 2,
    'kmeans': 3,
    'auction': 4,
    'genetic': 5,
    'makespan': 6,
    'marginal_benefit': 7
  }
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
          setName(`Solve for ${response.data[0].name}`);
        }
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
      } finally {
        setIsLoadingScenarios(false);
      }
    };
    
    fetchScenarios();
  }, []);

  // Fetch tasks when scenario changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!scenarioId) {
        setTasks([]);
        setTaskId('');
        return;
      }
      
      setIsLoadingTasks(true);
      try {
        const response = await apiClient.get<Task[]>(`/tasks?scenario_id=${scenarioId}`);
        setTasks(response.data);
        
        // Set the first task as default if available
        if (response.data.length > 0) {
          setTaskId(response.data[0].id);
        } else {
          setTaskId('');
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    
    fetchTasks();
  }, [scenarioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scenarioId) {
      setError('Please select a scenario');
      return;
    }
    
    if (!taskId) {
      setError('Please select a task');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Find the selected scenario to get its environment_id
      const selectedScenario = scenarios.find(s => s.id === scenarioId);
      if (!selectedScenario) {
        throw new Error('Selected scenario not found');
      }
      
      const payload = {
        name,
        description,
        parameters: {
          time_limit: timeLimit,
          algorithm_type: algorithmType
        },
        environment_id: selectedScenario.environment_id,
        scenario_id: scenarioId,
        algorithm_id: algorithmId,
        task_id: taskId // API expects an array of task IDs
      };
      
      console.log('Sending solve request with payload:', payload);
      
      const response = await apiClient.post('/solves', payload);
      
      navigate(`/solves/${response.data.id}`);
    } catch (error: any) {
      let errorMessage = 'Failed to create solve. Please try again.';
      if (error.response) {
        errorMessage += ` Server returned ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        console.error('Server error response:', error.response.data);
      }
      setError(errorMessage);
      console.error('Solve creation error:', error);
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create New Optimization Solve</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md">
                {error}
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
                  onChange={(e) => {
                    const selectedId = e.target.value ? Number(e.target.value) : '';
                    setScenarioId(selectedId);
                    
                    // Auto-update name based on selected scenario
                    if (selectedId !== '') {
                      const selectedScenario = scenarios.find(s => s.id === selectedId);
                      if (selectedScenario) {
                        setName(`Solve for ${selectedScenario.name}`);
                      }
                    }
                  }}
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
                <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-1">
                  Task <span className="text-red-500">*</span>
                </label>
                <select
                  id="task"
                  className="input w-full"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : '')}
                  required
                  disabled={isLoadingTasks || !scenarioId}
                >
                  {!scenarioId ? (
                    <option value="">Select a scenario first</option>
                  ) : isLoadingTasks ? (
                    <option value="">Loading tasks...</option>
                  ) : tasks.length === 0 ? (
                    <option value="">No tasks available</option>
                  ) : (
                    <>
                      <option value="">Select a task</option>
                      {tasks.map(task => (
                        <option key={task.id} value={task.id}>
                          {task.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {scenarioId && tasks.length === 0 && !isLoadingTasks && (
                  <p className="mt-1 text-sm text-red-500">
                    You need to create a task for this scenario first.{' '}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => navigate(`/tasks/create?scenario_id=${scenarioId}`)}
                    >
                      Create one now
                    </button>
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Warehouse Optimization Run 1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  className="input w-full h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of this solve run"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="algorithm-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Algorithm
                  </label>
                  <select
                    id="algorithm-type"
                    className="input w-full"
                    value={algorithmType}
                    onChange={(e) => {
                      setAlgorithmType(e.target.value);
                      setAlgorithmId(AlgorithmsIdMap[e.target.value as keyof typeof AlgorithmsIdMap]);
                    }}
                  >
                    <option value="greedy_distance">Greedy Distance Minimization</option>
                    <option value="hungarian">Global Optimization with Hungarian Algorithm</option>
                    <option value="kmeans">K-Means Inspired Task Clustering</option>
                    <option value="auction">Auction-Based Allocation</option>
                    <option value="genetic">Genetic Algorithm for Assignment</option>
                    <option value="makespan">Makespan Balanced Assignment</option>
                    <option value="marginal_benefit">Marginal Benefit Assignment</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="time-limit" className="block text-sm font-medium text-gray-700 mb-1">
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    id="time-limit"
                    className="input w-full"
                    min={10}
                    max={3600}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value) || 300)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum duration for optimization (10 sec - 1 hour)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/solves')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !scenarioId || !taskId}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </span>
                ) : 'Start Optimization'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}; 