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
  const [timeLimit, _] = useState(300); // 5 minutes default
  
  // Robot configuration parameters
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Robot capabilities
  const [batteryCapacity, ] = useState(100); // %
  const [maxDistance, setMaxDistance] = useState(1000); // meters
  const [robotSpeed, setRobotSpeed] = useState(1.0); // m/s
  // const [payloadCapacity, setPayloadCapacity] = useState(10); // kg
  const [rechargeTime, setRechargeTime] = useState(3); // minutes
  
  // Task constraints
  const [taskPriorities,] = useState(false); // Enable priority levels
  const [timeWindows,] = useState(false); // Enable time windows
  const [taskDependencies,] = useState(false); // Enable dependencies
  
  // Environment constraints
  const [noGoZones,] = useState(false); // Enable no-go zones
  const [trafficCongestion,] = useState(false); // Consider traffic
  const [variableTerrain,] = useState(false); // Consider terrain
  
  // Multi-objective optimization
  const [objectiveWeights, setObjectiveWeights] = useState({
    completion_time: { enabled: true, weight: 100 },
    energy_usage: { enabled: false, weight: 0 },
    distance_traveled: { enabled: false, weight: 0 },
    balanced_workload: { enabled: false, weight: 0 },
    cost_efficiency: { enabled: false, weight: 0 }
  });
  
  const [balanceFactor, ] = useState(50); // Balance between cost and speed (%)

  const AlgorithmsIdMap = {
    'greedy_distance': 1,
    'hungarian': 2,
    'kmeans': 3,
    'auction': 4,
    'genetic': 5,
    'makespan': 6,
    'marginal_benefit': 7
  }

  // const optimizationObjectives = {
  //   'completion_time': 'Minimize total completion time',
  //   'energy_usage': 'Minimize energy consumption',
  //   'distance_traveled': 'Minimize total distance traveled',
  //   'balanced_workload': 'Balance workload among robots',
  //   'cost_efficiency': 'Optimize for cost efficiency'
  // };

  // Helper function to normalize weights to sum to 100
  const normalizeWeights = () => {
    const enabledObjectives = Object.entries(objectiveWeights).filter(([_, obj]) => obj.enabled);
    
    // If no objectives are enabled, enable completion_time
    if (enabledObjectives.length === 0) {
      setObjectiveWeights({
        ...objectiveWeights,
        completion_time: { enabled: true, weight: 100 }
      });
      return;
    }
    
    // Calculate sum of weights for enabled objectives
    const totalWeight = enabledObjectives.reduce((sum, [_, obj]) => sum + obj.weight, 0);
    
    // If sum is 0, distribute weights evenly
    if (totalWeight === 0) {
      const evenWeight = Math.floor(100 / enabledObjectives.length);
      const remainder = 100 - (evenWeight * enabledObjectives.length);
      
      const newWeights = {...objectiveWeights};
      enabledObjectives.forEach(([key], index) => {
        newWeights[key as keyof typeof objectiveWeights].weight = 
          evenWeight + (index === 0 ? remainder : 0);
      });
      
      setObjectiveWeights(newWeights);
      return;
    }
    
    // Normalize weights to sum to 100
    if (totalWeight !== 100) {
      const newWeights = {...objectiveWeights};
      enabledObjectives.forEach(([key, obj]) => {
        newWeights[key as keyof typeof objectiveWeights].weight = 
          Math.round((obj.weight / totalWeight) * 100);
      });
      
      // Adjust for rounding errors to ensure sum is exactly 100
      const adjustedTotal = enabledObjectives.reduce(
        (sum, [key]) => sum + newWeights[key as keyof typeof objectiveWeights].weight, 
        0
      );
      
      if (adjustedTotal !== 100 && enabledObjectives.length > 0) {
        const firstKey = enabledObjectives[0][0] as keyof typeof objectiveWeights;
        newWeights[firstKey].weight += (100 - adjustedTotal);
      }
      
      setObjectiveWeights(newWeights);
    }
  };
  
  // Handle objective toggle
  // const handleObjectiveToggle = (key: keyof typeof objectiveWeights) => {
  //   const newWeights = {
  //     ...objectiveWeights,
  //     [key]: {
  //       ...objectiveWeights[key],
  //       enabled: !objectiveWeights[key].enabled
  //     }
  //   };
    
  //   setObjectiveWeights(newWeights);
    
  //   // Normalize on next tick to ensure state is updated
  //   setTimeout(normalizeWeights, 0);
  // };
  
  // // Handle weight change
  // const handleWeightChange = (key: keyof typeof objectiveWeights, weight: number) => {
  //   setObjectiveWeights({
  //     ...objectiveWeights,
  //     [key]: {
  //       ...objectiveWeights[key],
  //       weight
  //     }
  //   });
  // };

  const algorithmRecommendations = {
    'greedy_distance': 'Best for simple point-to-point tasks with low complexity.',
    'hungarian': 'Optimal for one-to-one assignments where global optimization is needed.',
    'kmeans': 'Ideal for grouping tasks by location when robots have similar capabilities.',
    'auction': 'Good for dynamic environments where tasks are added incrementally.',
    'genetic': 'Best for complex constraints and multi-objective optimization.',
    'makespan': 'Ideal when minimizing total completion time is critical.',
    'marginal_benefit': 'Best when robots have different capabilities or costs.'
  };
  
  // Function to get algorithm recommendation based on parameter settings
  const getAlgorithmRecommendation = () => {
    // Count enabled objectives
    const enabledObjectiveCount = Object.values(objectiveWeights).filter(obj => obj.enabled).length;
    
    // If multiple objectives are enabled, recommend genetic algorithm
    if (enabledObjectiveCount > 1) {
      return "For multiple optimization objectives, Genetic Algorithm is recommended as it handles multi-objective problems well.";
    }
    
    if (taskDependencies || timeWindows || noGoZones) {
      return "For complex constraints (dependencies, time windows, or no-go zones), Genetic Algorithm is recommended.";
    }
    
    if (taskPriorities) {
      return "For priority-based tasks, Marginal Benefit or Auction algorithms perform well.";
    }
    
    if (objectiveWeights.balanced_workload.enabled && objectiveWeights.balanced_workload.weight > 50) {
      return "For balanced workload optimization, the Makespan algorithm is optimal.";
    }
    
    if (objectiveWeights.energy_usage.enabled && objectiveWeights.energy_usage.weight > 50 || 
        objectiveWeights.cost_efficiency.enabled && objectiveWeights.cost_efficiency.weight > 50) {
      return "For energy/cost optimization, Hungarian or Genetic algorithms provide good results.";
    }
    
    if (variableTerrain || trafficCongestion) {
      return "With variable terrain or traffic, KMeans clustering with Genetic optimization works well.";
    }
    
    if (batteryCapacity < 50) {
      return "For low battery scenarios, algorithms that minimize distance (Greedy) or optimize energy (Hungarian) are recommended.";
    }
    
    return "Standard recommendation: Greedy for simplicity, Hungarian for optimality, Genetic for complex scenarios.";
  };

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
    
    // Normalize weights before submitting
    normalizeWeights();
    
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
          algorithm_type: algorithmType,
          
          // Robot capabilities
          battery_capacity: batteryCapacity,
          max_distance: maxDistance,
          robot_speed: robotSpeed,
          recharge_time: rechargeTime,
          
          // Multi-objective optimization weights
          objective_weights: Object.entries(objectiveWeights).reduce((acc, [key, value]) => {
            if (value.enabled) {
              acc[key] = value.weight;
            }
            return acc;
          }, {} as Record<string, number>),
          
          balance_factor: balanceFactor
        },
        environment_id: selectedScenario.environment_id,
        scenario_id: scenarioId,
        algorithm_id: algorithmId,
        task_id: taskId
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Create New Optimization Solve</h1>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
                  {error}
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
                  <label htmlFor="task" className="block text-sm font-medium text-gray-300 mb-1">
                    Task <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="task"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
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
                    <p className="mt-1 text-sm text-red-300">
                      You need to create a task for this scenario first.{' '}
                      <button
                        type="button"
                        className="text-blue-400 hover:text-blue-300 transition-colors underline"
                        onClick={() => navigate(`/tasks/create?scenario_id=${scenarioId}`)}
                      >
                        Create one now
                      </button>
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name of this solve run"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 h-24"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description of this solve run"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="algorithm-type" className="block text-sm font-medium text-gray-300 mb-1">
                      Algorithm
                    </label>
                    <select
                      id="algorithm-type"
                      className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                      value={algorithmType}
                      onChange={(e) => {
                        setAlgorithmType(e.target.value);
                        setAlgorithmId(AlgorithmsIdMap[e.target.value as keyof typeof AlgorithmsIdMap]);
                      }}
                    >
                      <option value="greedy_distance">Greedy Distance Minimization</option>
                      {/* <option value="hungarian">Global Optimization with Hungarian Algorithm</option> */}
                      <option value="kmeans">K-Means Inspired Task Clustering</option>
                      <option value="auction">Auction-Based Allocation</option>
                      <option value="genetic">Genetic Algorithm for Assignment</option>
                      <option value="makespan">Makespan Balanced Assignment</option>
                      <option value="marginal_benefit">Marginal Benefit Assignment</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-300">
                      {algorithmRecommendations[algorithmType as keyof typeof algorithmRecommendations]}
                    </p>
                  </div>
                  
                  {/* <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-300">
                        Multi-Objective Optimization
                      </label>
                      <span className="text-xs text-gray-400">Weights must sum to 100%</span>
                    </div>
                    <div className="p-3 bg-gray-900/70 border border-gray-700 rounded-md">
                      {Object.entries(optimizationObjectives).map(([key, label]) => {
                        const objectiveKey = key as keyof typeof objectiveWeights;
                        const isEnabled = objectiveWeights[objectiveKey].enabled;
                        const weight = objectiveWeights[objectiveKey].weight;
                        
                        return (
                          <div key={key} className="mb-2 last:mb-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`objective-${key}`}
                                  className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-700 rounded bg-gray-900/70"
                                  checked={isEnabled}
                                  onChange={() => handleObjectiveToggle(objectiveKey)}
                                />
                                <label htmlFor={`objective-${key}`} className="ml-2 block text-sm text-gray-300">
                                  {label}
                                </label>
                              </div>
                              <span className="text-sm font-medium text-gray-400">
                                {isEnabled ? `${weight}%` : '-'}
                              </span>
                            </div>
                            
                            {isEnabled && (
                              <div className="mt-1 pl-6">
                                <input
                                  type="range"
                                  className="w-full accent-blue-500 bg-gray-900/70"
                                  min={1}
                                  max={100}
                                  value={weight}
                                  onChange={(e) => handleWeightChange(objectiveKey, parseInt(e.target.value))}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div> */}
                </div>
              </div>
              
              {/* Advanced Settings Toggle */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-blue-400">Advanced Configuration Parameters</h3>
                  <button
                    type="button"
                    className="text-sm text-blue-400 hover:text-blue-300"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  >
                    {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                  </button>
                </div>
                
                {showAdvancedSettings && (
                  <div className="mt-4 space-y-6">
                    {/* Robot Capabilities Panel */}
                    <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-300 mb-3">Robot Capabilities</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* <div>
                          <label htmlFor="battery-capacity" className="block text-sm font-medium text-gray-300 mb-1">
                            Battery Capacity (%)
                          </label>
                          <input
                            type="number"
                            id="battery-capacity"
                            className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white"
                            min={1}
                            max={100}
                            value={batteryCapacity}
                            onChange={(e) => setBatteryCapacity(parseInt(e.target.value) || 100)}
                          />
                        </div> */}
                        
                        <div>
                          <label htmlFor="max-distance" className="block text-sm font-medium text-gray-300 mb-1">
                            Max Distance (meters)
                          </label>
                          <input
                            type="number"
                            id="max-distance"
                            className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white"
                            min={100}
                            max={10000}
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(parseInt(e.target.value) || 1000)}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="robot-speed" className="block text-sm font-medium text-gray-300 mb-1">
                            Robot Speed (m/s)
                          </label>
                          <input
                            type="number"
                            id="robot-speed"
                            className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white"
                            min={0.1}
                            max={5}
                            step={0.1}
                            value={robotSpeed}
                            onChange={(e) => setRobotSpeed(parseFloat(e.target.value) || 1.0)}
                          />
                        </div>
                        
                        {/* <div>
                          <label htmlFor="payload-capacity" className="block text-sm font-medium text-gray-300 mb-1">
                            Payload Capacity (kg)
                          </label>
                          <input
                            type="number"
                            id="payload-capacity"
                            className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white"
                            min={1}
                            max={100}
                            value={payloadCapacity}
                            onChange={(e) => setPayloadCapacity(parseInt(e.target.value) || 10)}
                          />
                        </div> */}
                        
                        <div>
                          <label htmlFor="recharge-time" className="block text-sm font-medium text-gray-300 mb-1">
                            Recharge Time (min)
                          </label>
                          <input
                            type="number"
                            id="recharge-time"
                            className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white"
                            min={3}
                            max={120}
                            value={rechargeTime}
                            onChange={(e) => setRechargeTime(parseInt(e.target.value) || 3)}
                          />
                        </div>
                        
                        {/* <div className="md:col-span-2 lg:col-span-3">
                          <label htmlFor="balance-factor" className="block text-sm font-medium text-gray-300 mb-1">
                            Energy vs. Speed Balance: {balanceFactor}%
                          </label>
                          <input
                            type="range"
                            id="balance-factor"
                            className="w-full accent-blue-500 bg-gray-900/70"
                            min={0}
                            max={100}
                            value={balanceFactor}
                            onChange={(e) => setBalanceFactor(parseInt(e.target.value))}
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Energy Efficient</span>
                            <span>Balanced</span>
                            <span>Fast Completion</span>
                          </div>
                        </div> */}
                      </div>
                    </div>
                    
                    {/* Task Constraints Panel */}
                    {/* <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-300 mb-3">Task Constraints</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="task-priorities"
                            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-700 rounded bg-gray-900/70"
                            checked={taskPriorities}
                            onChange={(e) => setTaskPriorities(e.target.checked)}
                          />
                          <label htmlFor="task-priorities" className="ml-2 block text-sm text-gray-300">
                            Enable task priority levels
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="time-windows"
                            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-700 rounded bg-gray-900/70"
                            checked={timeWindows}
                            onChange={(e) => setTimeWindows(e.target.checked)}
                          />
                          <label htmlFor="time-windows" className="ml-2 block text-sm text-gray-300">
                            Enable time windows for tasks
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="task-dependencies"
                            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-700 rounded bg-gray-900/70"
                            checked={taskDependencies}
                            onChange={(e) => setTaskDependencies(e.target.checked)}
                          />
                          <label htmlFor="task-dependencies" className="ml-2 block text-sm text-gray-300">
                            Enable task dependencies
                          </label>
                        </div>
                      </div>
                    </div> */}
                    
                    {/* Environment Constraints Panel */}
                    {/* <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-300 mb-3">Environment Constraints</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="no-go-zones"
                            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-700 rounded bg-gray-900/70"
                            checked={noGoZones}
                            onChange={(e) => setNoGoZones(e.target.checked)}
                          />
                          <label htmlFor="no-go-zones" className="ml-2 block text-sm text-gray-300">
                            Enable no-go zones
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="traffic-congestion"
                            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-700 rounded bg-gray-900/70"
                            checked={trafficCongestion}
                            onChange={(e) => setTrafficCongestion(e.target.checked)}
                          />
                          <label htmlFor="traffic-congestion" className="ml-2 block text-sm text-gray-300">
                            Consider traffic congestion
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="variable-terrain"
                            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-700 rounded bg-gray-900/70"
                            checked={variableTerrain}
                            onChange={(e) => setVariableTerrain(e.target.checked)}
                          />
                          <label htmlFor="variable-terrain" className="ml-2 block text-sm text-gray-300">
                            Consider variable terrain costs
                          </label>
                        </div>
                      </div>
                    </div> */}
                    
                    {/* Algorithm Recommendation */}
                    <div className="bg-blue-900/30 p-3 rounded border border-blue-800/50">
                      <h4 className="text-sm font-medium text-blue-300">Intelligent Algorithm Recommendation</h4>
                      <p className="text-xs text-gray-300 mt-1">
                        {getAlgorithmRecommendation()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => navigate('/solves')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors relative overflow-hidden group"
                  disabled={isLoading || !scenarioId || !taskId}
                >
                  <span className="absolute w-64 h-0 transition-all duration-300 origin-center rotate-45 -translate-x-20 bg-blue-500 top-1/2 group-hover:h-64 group-hover:-translate-y-32 ease"></span>
                  <span className="relative">
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Starting...
                      </span>
                    ) : 'Start Optimization'}
                  </span>
                </button>
              </div>
            </form>
          </div>
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