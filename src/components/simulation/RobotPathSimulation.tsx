import { useState, useRef, useEffect } from 'react';
import { Environment } from '../../types';

interface RobotPathSimulationProps {
  environment: Environment;
  results: Record<string, any>;
  initialZoom?: number;
  maxSpeed?: number; // Maximum speed in m/s
  acceleration?: number; // Acceleration in m/s²
  batteryCapacity?: number; // Battery capacity in percentage
  maxDistance?: number; // Maximum distance in meters
}

interface RobotState {
  robotId: string;
  currentTaskIndex: number;
  nodeIndex: number;
  position: [number, number];
  nextNodeId: string | null;
  color: string;
  task?: { pickup: string; dropoff: string };
  stepsComplete: number;
  // Path tracking
  path: string[];
  currentPathIndex: number;
  // Physics properties
  currentSpeed: number; // Current speed in m/s
  totalDistance: number; // Total distance traveled in meters
  // Movement state for physics
  isAccelerating: boolean;
  isDecelerating: boolean;
  targetNodePosition: [number, number] | null;
  // Task metrics
  tasksCompleted: number; // Number of tasks this robot has completed
  currentTaskStartTime: number; // Time when current task started
  atPickup: boolean; // Whether robot is at pickup location
  atDropoff: boolean; // Whether robot is at dropoff location
  // Battery metrics
  battery_remaining: number; // Battery level remaining in percentage
  // Recharge state
  isRecharging: boolean; // Whether robot is currently recharging
  rechargeTimeRemaining: number; // Time remaining for recharge in seconds
  rechargeStartTime: number; // When the recharge started (simulation time)
}

// Add simulation metrics interface
interface SimulationMetrics {
  elapsedTime: number; // Time in seconds
  totalDistance: number; // Total distance in meters
  robotDistances: Record<string, number>; // Distance per robot
  
  // Task metrics
  totalTasks: number; // Total number of tasks in the plan
  completedTasks: number; // Number of completed tasks
  tasksPerRobot: Record<string, { total: number; completed: number }>; // Tasks per robot
  avgTaskTime: number; // Average time to complete a task (in seconds)
  lastTaskCompletionTime: number; // Timestamp when the last task was completed
}

export const RobotPathSimulation: React.FC<RobotPathSimulationProps> = ({
  environment,
  results,
  initialZoom = 1,
  maxSpeed: initialMaxSpeed = 1, // Default max speed: 1 m/s
  acceleration: initialAcceleration = 0.5, // Default acceleration: 0.5 m/s²
  batteryCapacity = 100, // Default battery capacity: 100%
  maxDistance = 1000, // Default max distance: 1000m
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [maxSteps, setMaxSteps] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const [robotStates, setRobotStates] = useState<RobotState[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState(1); // Speed multiplier
  const [maxSpeed, setMaxSpeed] = useState(initialMaxSpeed);
  const [acceleration, setAcceleration] = useState(initialAcceleration);
  const [debugMode, setDebugMode] = useState(false); // Debug mode toggle
  
  // Add state for battery parameters
  const [currentBatteryCapacity, setCurrentBatteryCapacity] = useState(batteryCapacity);
  const [currentMaxDistance, setCurrentMaxDistance] = useState(maxDistance);
  
  // Get all robot paths from results
  const robotPaths = Object.entries(results).filter(([key]) => key !== 'stats');
  
  // Count total tasks
  const totalTaskCount = robotPaths.reduce((count, [_, tasks]) => {
    if (Array.isArray(tasks)) {
      return count + tasks.length;
    }
    return count;
  }, 0);
  
  // Initialize task metrics per robot
  const initialTasksPerRobot: Record<string, { total: number; completed: number }> = {};
  robotPaths.forEach(([robotId, tasks]) => {
    initialTasksPerRobot[robotId] = {
      total: Array.isArray(tasks) ? tasks.length : 0,
      completed: 0
    };
  });
  
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    elapsedTime: 0,
    totalDistance: 0,
    robotDistances: {},
    totalTasks: totalTaskCount,
    completedTasks: 0,
    tasksPerRobot: initialTasksPerRobot,
    avgTaskTime: 0,
    lastTaskCompletionTime: 0
  });
  
  // Robot colors
  const robotColors = [
    '#4F46E5', // Indigo
    '#7C3AED', // Violet
    '#E11D48', // Rose
    '#0891B2', // Cyan
    '#A16207', // Amber
  ];
  
  // Helper function for consistent task status logging
  const logTaskStatus = (robotId: string, action: string, details: string) => {
    if (debugMode) {
      console.log(`[TASK] ${robotId} ${action}: ${details}`);
    }
  };
  
  // Find position from node ID
  const getPositionFromNodeId = (nodeId: string): [number, number] | null => {
    // Check if it's a pickup point
    const pickup = environment.elements.pickups.find(p => p.id === nodeId);
    if (pickup) return pickup.position;
    
    // Check if it's a dropoff point
    const dropoff = environment.elements.dropoffs.find(d => d.id === nodeId);
    if (dropoff) return dropoff.position;
    
    // Check if it's a robot station
    const station = environment.elements.robot_stations.find(s => s.id === nodeId);
    if (station) return station.position;

    // Check if it's a robot
    const robot = environment.elements.robots.find(r => r.id === nodeId);
    if (robot) return robot.position;
    
    // Check if it's a navigation point
    const navPoint = environment.elements.navigation_points?.find(n => n.id === nodeId);
    if (navPoint) return navPoint.position;
    
    return null;
  };
  
  // Initialize robot states
  useEffect(() => {
    // Initialize robot states based on their assigned robot stations
    const initialRobotStates: RobotState[] = robotPaths.map(([robotId, tasks], index) => {
      const color = robotColors[index % robotColors.length];
      
      // Find the robot in the environment data
      const robot = environment.elements.robots.find(r => r.id === robotId);
      let startPos: [number, number] = [0, 0];
      
      if (robot) {
        // If robot has a predefined position, use it
        if (robot.position) {
          startPos = robot.position;
          console.log(`Robot ${robotId} using its defined position:`, startPos);
        } else if (robot.station_id) {
          // Otherwise get position from its assigned station
          const station = environment.elements.robot_stations.find(s => s.id === robot.station_id);
          if (station) {
            startPos = station.position;
            console.log(`Robot ${robotId} starting from station ${station.id}:`, startPos);
          }
        }
      }
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return {
          robotId,
          currentTaskIndex: 0,
          nodeIndex: 0,
          position: startPos,
          nextNodeId: null,
          color,
          stepsComplete: 0,
          path: [],
          currentPathIndex: 0,
          currentSpeed: 0,
          totalDistance: 0,
          isAccelerating: false,
          isDecelerating: false,
          targetNodePosition: null,
          tasksCompleted: 0,
          currentTaskStartTime: 0,
          atPickup: false,
          atDropoff: false,
          battery_remaining: 100, // Start with full battery
          isRecharging: false,
          rechargeTimeRemaining: 0,
          rechargeStartTime: 0
        };
      }
      
      // Get the first task's path
      const firstTask = tasks[0];
      const path = firstTask?.path && Array.isArray(firstTask.path) ? firstTask.path : [];
      
      // Get first task info
      const task = firstTask?.task ? { 
        pickup: firstTask.task[0],
        dropoff: firstTask.task[1]
      } : undefined;
      
      // Set next node ID to the first node in the path
      const nextNodeId = path.length > 0 ? path[0] : null;
      console.log(`Robot ${robotId} first target node: ${nextNodeId}`);
      
      // Get battery parameters from the first task if available, otherwise use defaults
      const initialBatteryCapacity = firstTask?.battery_capacity !== undefined ? 
        firstTask.battery_capacity : batteryCapacity;
      const initialMaxDistance = firstTask?.max_distance !== undefined ? 
        firstTask.max_distance : maxDistance;
        
      // Set the parameters at component level for calculations
      if (index === 0) {
        // Only set once to avoid multiple state updates
        setCurrentBatteryCapacity(initialBatteryCapacity);
        setCurrentMaxDistance(initialMaxDistance);
      }
      
      // When calculating initial battery, use our function
      let initialBattery = 100;
      if (firstTask?.battery_remaining !== undefined) {
        initialBattery = firstTask.battery_remaining;
      } else if (firstTask?.total_distance !== undefined) {
        // If we have distance data but no battery level, calculate it
        initialBattery = calculateBatteryPercentage(
          firstTask.total_distance,
          initialMaxDistance,
          initialBatteryCapacity
        );
      }
      
      return {
        robotId,
        currentTaskIndex: 0,
        nodeIndex: 0,
        position: startPos,
        nextNodeId,
        color,
        task,
        stepsComplete: 0,
        path,
        currentPathIndex: 0,
        currentSpeed: 0,
        totalDistance: 0,
        isAccelerating: false,
        isDecelerating: false,
        targetNodePosition: null,
        tasksCompleted: 0,
        currentTaskStartTime: 0,
        atPickup: false,
        atDropoff: false,
        battery_remaining: initialBattery,
        isRecharging: false,
        rechargeTimeRemaining: 0,
        rechargeStartTime: 0
      };
    });
    
    setRobotStates(initialRobotStates);
    
    // Calculate total steps - count node transitions
    let totalSteps = 0;
    robotPaths.forEach(([_, tasks]) => {
      if (!Array.isArray(tasks)) return;
      
      tasks.forEach(task => {
        if (task.path && Array.isArray(task.path)) {
          // Count node transitions
          for (let i = 0; i < task.path.length - 1; i++) {
            const currentNodeId = task.path[i];
            const nextNodeId = task.path[i + 1];
            
            const currentPos = getPositionFromNodeId(currentNodeId);
            const nextPos = getPositionFromNodeId(nextNodeId);
            
            if (currentPos && nextPos) {
              // Manhattan distance (|x2 - x1| + |y2 - y1|)
              const manhattanDistance = 
                Math.abs(nextPos[0] - currentPos[0]) + 
                Math.abs(nextPos[1] - currentPos[1]);
              
              totalSteps += manhattanDistance;
            }
          }
        }
      });
    });
    
    setMaxSteps(Math.max(totalSteps, 1));
  }, [results, environment]);
  
  // Animation control functions
  const startAnimation = () => {
    if (currentStep >= maxSteps) {
      resetAnimation();
    }
    setIsPlaying(true);
  };
  
  const stopAnimation = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  const resetAnimation = () => {
    stopAnimation();
    setCurrentStep(0);
    
    // Reset metrics
    setMetrics({
      elapsedTime: 0,
      totalDistance: 0,
      robotDistances: {},
      totalTasks: totalTaskCount,
      completedTasks: 0,
      tasksPerRobot: { ...initialTasksPerRobot },
      avgTaskTime: 0,
      lastTaskCompletionTime: 0
    });
    
    // Reset robot states to initial positions
    const resetRobotStates: RobotState[] = robotPaths.map(([robotId, tasks], index) => {
      const color = robotColors[index % robotColors.length];
      
      // Find the robot in the environment data
      const robot = environment.elements.robots.find(r => r.id === robotId);
      let startPos: [number, number] = [0, 0];
      
      if (robot) {
        // If robot has a predefined position, use it
        if (robot.position) {
          startPos = robot.position;
        } else if (robot.station_id) {
          // Otherwise get position from its assigned station
          const station = environment.elements.robot_stations.find(s => s.id === robot.station_id);
          if (station) {
            startPos = station.position;
          }
        }
      }
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return {
          robotId,
          currentTaskIndex: 0,
          nodeIndex: 0,
          position: startPos,
          nextNodeId: null,
          color,
          stepsComplete: 0,
          path: [],
          currentPathIndex: 0,
          currentSpeed: 0,
          totalDistance: 0,
          isAccelerating: false,
          isDecelerating: false,
          targetNodePosition: null,
          tasksCompleted: 0,
          currentTaskStartTime: 0,
          atPickup: false,
          atDropoff: false,
          battery_remaining: 100, // Start with full battery
          isRecharging: false,
          rechargeTimeRemaining: 0,
          rechargeStartTime: 0
        };
      }
      
      // Get the first task's path
      const firstTask = tasks[0];
      const path = firstTask?.path && Array.isArray(firstTask.path) ? firstTask.path : [];
      
      // Get first task info
      const task = firstTask?.task ? { 
        pickup: firstTask.task[0],
        dropoff: firstTask.task[1]
      } : undefined;
      
      // Set next node ID to the first node in the path
      const nextNodeId = path.length > 0 ? path[0] : null;
      
      // Get initial battery level from the first task, or default to 100%
      const initialBattery = firstTask?.battery_remaining !== undefined ? firstTask.battery_remaining : 100;
      
      return {
        robotId,
        currentTaskIndex: 0,
        nodeIndex: 0,
        position: startPos,
        nextNodeId,
        color,
        task,
        stepsComplete: 0,
        path,
        currentPathIndex: 0,
        currentSpeed: 0,
        totalDistance: 0,
        isAccelerating: false,
        isDecelerating: false,
        targetNodePosition: null,
        tasksCompleted: 0,
        currentTaskStartTime: 0,
        atPickup: false,
        atDropoff: false,
        battery_remaining: initialBattery,
        isRecharging: false,
        rechargeTimeRemaining: 0,
        rechargeStartTime: 0
      };
    });
    
    setRobotStates(resetRobotStates);
  };
  
  // Define functions outside the animation loop
  // Add a function to start recharging
  const startRecharging = (
    state: RobotState, 
    rechargeTask: any, 
    elapsedTime: number
  ) => {
    if (state.isRecharging) return; // Already recharging
    
    // Get the final destination position for logging
    const finalNodeId = state.path[state.path.length - 1];
    
    // Start recharging
    state.isRecharging = true;
    const rechargeMinutes = rechargeTask.recharge_time || 6; // Default to 6 minutes if not specified
    
    // Store the full recharge time in seconds
    state.rechargeTimeRemaining = rechargeMinutes * 60; // Convert to seconds
    state.rechargeStartTime = elapsedTime;
    
    // Force stop the robot
    state.currentSpeed = 0;
    state.isAccelerating = false;
    state.isDecelerating = false;
    
    // Log battery information
    const currentBattery = state.battery_remaining.toFixed(2);
    console.log(`Robot ${state.robotId} STARTING RECHARGE at ${finalNodeId}`);
    console.log(`Current battery: ${currentBattery}% → Will be restored to 100% after recharging`);
    console.log(`Recharge will take ${rechargeMinutes} minutes (${state.rechargeTimeRemaining}s) at sim time ${elapsedTime.toFixed(1)}s`);
  };
  
  // Add a battery calculation function at the top level of the component
  const calculateBatteryPercentage = (distanceTraveled: number, maxDistance: number, batteryCapacity: number): number => {
    if (!maxDistance || maxDistance <= 0) return batteryCapacity;
    
    // Linear relationship: battery decreases proportionally to distance traveled
    const batteryPercentage = batteryCapacity * (1 - (distanceTraveled / maxDistance));
    return Math.max(0, Math.min(batteryCapacity, batteryPercentage));
  };
  
  // Handle step-by-step animation updates
  useEffect(() => {
    if (!isPlaying) return;
    
    let lastTime = 0;
    const frameDelay = 16; // ~60fps
    
    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      
      const elapsed = timestamp - lastTime;
      const deltaTime = elapsed / 1000; // Convert to seconds
      
      if (elapsed >= frameDelay) {
        // Update robot positions
        setRobotStates(prevStates => {
          const newStates = [...prevStates];
          let allPathsCompleted = true;
          let totalDistanceDelta = 0;
          const newRobotDistances = { ...metrics.robotDistances };
          
          for (let i = 0; i < newStates.length; i++) {
            const state = newStates[i];
            const [, tasks] = robotPaths[i];
            
            if (!Array.isArray(tasks) || tasks.length === 0 || !state.path || state.path.length === 0) {
              continue;
            }
            
            // Get current task once and use throughout
            if (state.currentTaskIndex >= tasks.length) {
              continue; // At the end of all tasks
            }
            
            const currentTask = tasks[state.currentTaskIndex];

            // Get parameters needed for battery calculation
            const batteryCapacity = currentTask.battery_capacity !== undefined ? 
              currentTask.battery_capacity : 100;
            const maxDistance = currentTask.max_distance !== undefined ? 
              currentTask.max_distance : 1000;
            
            // Check if robot is currently recharging
            if (state.isRecharging) {
              allPathsCompleted = false; // Keep animation running
              
              // Calculate time spent recharging - use actual time, not simulated time
              const timeSpentRecharging = metrics.elapsedTime - state.rechargeStartTime;
              
              // For recharge time, DON'T multiply by animation speed to ensure consistent recharge duration
              const rechargeTimeInSeconds = state.rechargeTimeRemaining;
              
              // FIXED: Use a simple ratio test - if elapsed time is less than what it should be, keep recharging
              // This fixes any complexities with time calculation
              const expectedRechargeTimeInSimulation = currentTask.recharge_time * 60; // Convert minutes to seconds
              const shouldStillBeRecharging = timeSpentRecharging < expectedRechargeTimeInSimulation;

              // Add much more detailed logging for debugging
              // console.log(`[RECHARGE-DEBUG] Robot ${state.robotId}:
              //   - Current time: ${metrics.elapsedTime.toFixed(1)}s
              //   - Recharge start time: ${state.rechargeStartTime.toFixed(1)}s
              //   - Time spent recharging: ${timeSpentRecharging.toFixed(1)}s
              //   - Expected recharge duration: ${expectedRechargeTimeInSimulation}s
              //   - Should still be recharging: ${shouldStillBeRecharging}
              //   - Animation speed: ${animationSpeed}x
              // `);

              // If still recharging, update the remaining time and continue
              if (shouldStillBeRecharging) {
                // Update remaining time for display purposes - calculate how much time is left
                const timeRemaining = expectedRechargeTimeInSimulation - timeSpentRecharging;
                state.rechargeTimeRemaining = Math.max(0, timeRemaining);
                
                // Log status more frequently during recharging for debugging
                if (Math.floor(metrics.elapsedTime) % 2 === 0 && 
                    Math.floor(metrics.elapsedTime) !== Math.floor(metrics.elapsedTime - deltaTime * animationSpeed)) {
                  // console.log(`Robot ${state.robotId} still recharging... ${Math.ceil(state.rechargeTimeRemaining)} seconds left, elapsed time: ${metrics.elapsedTime.toFixed(1)}`);
                }
                
                // Make sure the robot doesn't move during recharge
                state.currentSpeed = 0;
                allPathsCompleted = false; // Keep animation running
                
                continue; // Skip movement update for this robot while recharging
              } else {
                // Recharge complete!
                console.log(`Robot ${state.robotId} FINISHED RECHARGING after ${timeSpentRecharging.toFixed(1)} seconds at simulation time ${metrics.elapsedTime.toFixed(1)}`);
                state.isRecharging = false;
                state.rechargeTimeRemaining = 0;
                
                // Reset distance traveled counter to 0 when battery is restored to full
                const previousDistance = state.totalDistance;
                state.totalDistance = 0;
                
                // Update battery to full after recharge completes
                if (currentTask.battery_remaining !== undefined) {
                  state.battery_remaining = currentTask.battery_remaining;
                  console.log(`Robot ${state.robotId} battery restored to ${state.battery_remaining}% after recharge`);
                }
                console.log(`Robot ${state.robotId} distance counter reset from ${previousDistance.toFixed(2)}m to 0m`);
                
                // Move to next task if available
                if (state.currentTaskIndex < tasks.length - 1) {
                  // Move to next task
                  state.currentTaskIndex++;
                  state.currentTaskStartTime = metrics.elapsedTime;
                  
                  // Get the new task's path
                  const nextTask = tasks[state.currentTaskIndex];
                  if (nextTask?.path && Array.isArray(nextTask.path) && nextTask.path.length > 0) {
                    state.path = nextTask.path;
                    state.currentPathIndex = 0;
                    
                    // Set the first node of the new task as the next target
                    const firstNodeId = nextTask.path[0];
                    state.nextNodeId = firstNodeId;
                    console.log(`Robot ${state.robotId} transitioning to task ${state.currentTaskIndex+1}/${tasks.length}, targeting: ${firstNodeId}`);
                    
                    // Update battery level from task data
                    if (nextTask.battery_remaining !== undefined) {
                      const oldBattery = state.battery_remaining;
                      state.battery_remaining = nextTask.battery_remaining;
                      console.log(`Robot ${state.robotId} battery updated: ${oldBattery.toFixed(2)}% → ${state.battery_remaining.toFixed(2)}%`);
                    }
                    
                    // Check if next task is a recharge task
                    const isNextRechargeTask = nextTask.task === 'recharge' || nextTask.task === 'recharge_in_place';
                    if (isNextRechargeTask) {
                      console.log(`Robot ${state.robotId} preparing for recharge task, battery: ${state.battery_remaining.toFixed(2)}%`);
                    }
                    
                    // Update current task info
                    if (nextTask.task && Array.isArray(nextTask.task) && nextTask.task.length === 2) {
                      state.task = {
                        pickup: nextTask.task[0],
                        dropoff: nextTask.task[1]
                      };
                      
                      // Always reset pickup/dropoff status for new task
                      state.atPickup = false;
                      state.atDropoff = false;
                      console.log(`Robot ${state.robotId} new pickup-dropoff task: ${nextTask.task[0]} → ${nextTask.task[1]}`);
                    } else {
                      // Clear task info if not a standard pickup-dropoff task
                      if (!isNextRechargeTask) {
                        state.task = undefined;
                      }
                    }
                  }
                }
                
                continue; // Skip the rest of the loop after handling recharge completion
              }
            }
            
            // Check if this is a recharge task
            const isRechargeTask = currentTask.task === 'recharge' || currentTask.task === 'recharge_in_place';
            
            // Check if we need to start recharging:
            // 1. Current task is a recharge task
            // 2. We've reached the end of the path for this task (final node)
            // 3. We're not already recharging
            // 4. Robot has actually arrived at the destination (speed near zero)
            if (isRechargeTask && 
                state.currentPathIndex === (state.path.length - 1) && // At the last node index
                state.nextNodeId === null && // No next node (we've arrived)
                !state.isRecharging && 
                state.currentSpeed < 0.1) {
              
              startRecharging(state, currentTask, metrics.elapsedTime);
              continue; // Skip other movement updates while starting recharge
            }
            
            if (!currentTask?.path || !Array.isArray(currentTask.path) || currentTask.path.length === 0) {
              continue;
            }
            
            // Add a robust function to detect if a task is a recharge task
            const isTaskRecharge = (task: any) => {
              return task && (task.task === 'recharge' || task.task === 'recharge_in_place');
            };
            
            // Update the moveToNextNode function to handle recharge tasks specially
            const moveToNextNode = () => {
              // If we're at first node (index 0), move to next node
              if (state.currentPathIndex === 0) {
                state.currentPathIndex++;
                
                if (state.currentPathIndex < state.path.length) {
                  // Move to next node in current path
                  state.nextNodeId = state.path[state.currentPathIndex];
                  console.log(`Robot ${state.robotId} reached first node, moving to next: ${state.nextNodeId}`);
                } else {
                  // End of path
                  state.nextNodeId = null;
                  
                  // Check if this is a recharge task - if so, start recharging
                  const currentTask = tasks[state.currentTaskIndex];
                  if (isTaskRecharge(currentTask)) {
                    startRecharging(state, currentTask, metrics.elapsedTime);
                    return; // Don't proceed to next task yet
                  }
                }
              } else {
                // Move to next node in path
                state.currentPathIndex++;
                
                if (state.currentPathIndex < state.path.length) {
                  // Move to next node in current path
                  state.nextNodeId = state.path[state.currentPathIndex];
                  console.log(`Robot ${state.robotId} moving to next node: ${state.nextNodeId}`);
                } else {
                  // End of current path
                  state.nextNodeId = null;
                  
                  // Check if this is a recharge task - if so, start recharging
                  const currentTask = tasks[state.currentTaskIndex];
                  if (isTaskRecharge(currentTask)) {
                    startRecharging(state, currentTask, metrics.elapsedTime);
                    return; // Don't proceed to next task yet
                  }
                  
                  // Check if there are more tasks
                  if (state.currentTaskIndex < tasks.length - 1) {
                    // Move to next task
                    state.currentTaskIndex++;
                    
                    // Get the new task's path
                    const nextTask = tasks[state.currentTaskIndex];
                    if (nextTask?.path && Array.isArray(nextTask.path) && nextTask.path.length > 0) {
                      state.path = nextTask.path;
                      state.currentPathIndex = 0;
                      
                      // Set the first node of the new task as the next target
                      const firstNodeId = nextTask.path[0];
                      state.nextNodeId = firstNodeId;
                      console.log(`Robot ${state.robotId} transitioning to next task, targeting: ${firstNodeId}`);
                      
                      // Update battery level from task data
                      if (nextTask.battery_remaining !== undefined) {
                        state.battery_remaining = nextTask.battery_remaining;
                        console.log(`Robot ${state.robotId} battery updated: ${state.battery_remaining}%`);
                      }
                      
                      // Update current task info
                      if (nextTask.task) {
                        state.task = {
                          pickup: nextTask.task[0],
                          dropoff: nextTask.task[1]
                        };
                        
                        // Always reset pickup/dropoff status for new task
                        state.atPickup = false;
                        state.atDropoff = false;
                      }
                    }
                  }
                }
              }
            };
            
            // Helper function to force arrival at a target node
            const forceArrival = () => {
              const targetPos = state.targetNodePosition!;
              state.position = [...targetPos] as [number, number];
              state.currentSpeed = 0;
              state.isDecelerating = false;
              state.targetNodePosition = null;
              
              // If it's a pickup/dropoff, update task status
              const isPickup = environment.elements.pickups.some(p => p.id === state.nextNodeId);
              const isDropoff = environment.elements.dropoffs.some(d => d.id === state.nextNodeId);
              
              if (isPickup) {
                // Only update if not already at pickup to prevent double-counting
                if (!state.atPickup && state.task?.pickup === state.nextNodeId) {
                  state.atPickup = true;
                  state.atDropoff = false;
                  logTaskStatus(state.robotId, "PICKUP", `Reached ${state.nextNodeId} for task: ${state.task?.pickup} → ${state.task?.dropoff}`);
                  console.log(`Robot ${state.robotId} reached pickup ${state.nextNodeId} for task: ${state.task?.pickup} → ${state.task?.dropoff}`);
                  
                  // If this is a new task, record start time
                  if (!state.currentTaskStartTime) {
                    state.currentTaskStartTime = metrics.elapsedTime;
                  }
                }
              } else if (isDropoff) {
                // Only count task completion if this is the actual destination dropoff for the task
                if (!state.atDropoff && state.task?.dropoff === state.nextNodeId) {
                  // We've completed a task
                  state.atPickup = false;
                  state.atDropoff = true;
                  state.tasksCompleted++;
                  logTaskStatus(state.robotId, "DROPOFF", `Completed task #${state.tasksCompleted} at ${state.nextNodeId}: ${state.task?.pickup} → ${state.task?.dropoff}`);
                  console.log(`Robot ${state.robotId} reached dropoff ${state.nextNodeId}, completed task #${state.tasksCompleted}: ${state.task?.pickup} → ${state.task?.dropoff}`);
                  
                  // Reset task start time for next task
                  state.currentTaskStartTime = 0;
                }
              }
              
              // Move to next node
              moveToNextNode();
            };
            
            // If we have a next node to move to
            if (state.nextNodeId) {
              allPathsCompleted = false;
              
              // Current position and target position
              const currentPos = state.position;
              
              // Get target position if we don't already have it
              if (!state.targetNodePosition) {
                const targetPos = getPositionFromNodeId(state.nextNodeId);
                if (!targetPos) {
                  console.error(`Could not find position for node ${state.nextNodeId}`);
                  continue;
                }
                state.targetNodePosition = targetPos;
              }
              
              const targetPos = state.targetNodePosition;
              
              // Calculate direction vector
              const dx = targetPos[0] - currentPos[0];
              const dy = targetPos[1] - currentPos[1];
              
              // Calculate distance to target
              const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

              // Determine if we need to accelerate, maintain speed, or decelerate
              // Deceleration zone is calculated based on current speed and deceleration rate
              const stoppingDistance = (state.currentSpeed * state.currentSpeed) / (2 * acceleration);
              
              // Check if the next node is a pickup or dropoff - these require a full stop
              const isPickupOrDropoff = state.nextNodeId 
                ? environment.elements.pickups.some(p => p.id === state.nextNodeId) || 
                  environment.elements.dropoffs.some(d => d.id === state.nextNodeId)
                : false;
              
              // Check if we're approaching the target and need to decelerate
              if (distanceToTarget <= stoppingDistance && !state.isDecelerating && isPickupOrDropoff) {
                // Only fully decelerate to zero if target is pickup or dropoff
                state.isDecelerating = true;
                state.isAccelerating = false;
                console.log(`Robot ${state.robotId} decelerating to stop at pickup/dropoff ${state.nextNodeId}, ${distanceToTarget.toFixed(2)}m from target. Stopping distance: ${stoppingDistance.toFixed(2)}m`);
              } else if (distanceToTarget <= stoppingDistance * 0.5 && !state.isDecelerating && !isPickupOrDropoff) {
                // For regular navigation nodes, slow down but don't completely stop
                state.isDecelerating = true;
                state.isAccelerating = false;
                console.log(`Robot ${state.robotId} slowing down at node ${state.nextNodeId}, ${distanceToTarget.toFixed(2)}m from target`);
              } else if (!state.isDecelerating && state.currentSpeed < maxSpeed && !state.isAccelerating) {
                // If we're not at max speed and not decelerating, accelerate
                state.isAccelerating = true;
                console.log(`Robot ${state.robotId} accelerating`);
              }
              
              // Update speed based on acceleration/deceleration
              if (state.isAccelerating) {
                // Accelerate
                state.currentSpeed = Math.min(state.currentSpeed + acceleration * deltaTime * animationSpeed, maxSpeed);
                if (state.currentSpeed >= maxSpeed) {
                  state.isAccelerating = false;
                  console.log(`Robot ${state.robotId} reached max speed: ${maxSpeed} m/s`);
                }
              } else if (state.isDecelerating) {
                // Decelerate
                if (isPickupOrDropoff) {
                  // Full stop for pickup/dropoff
                  state.currentSpeed = Math.max(state.currentSpeed - acceleration * deltaTime * animationSpeed, 0);
                  
                  // Add periodic debugging - log every second of simulation time
                  if (Math.floor(metrics.elapsedTime) > Math.floor(metrics.elapsedTime - deltaTime * animationSpeed)) {
                    console.log(`DECELERATION STATUS - Robot ${state.robotId}: distance=${distanceToTarget.toFixed(2)}m, speed=${state.currentSpeed.toFixed(2)}m/s, stopping distance=${stoppingDistance.toFixed(2)}m`);
                  }
                  
                  // SAFETY: If we're very close to the target but moving very slowly, force arrival
                  // This prevents robots from getting stuck in a perpetual deceleration state
                  if (distanceToTarget < 0.5 && state.currentSpeed < 0.05) {
                    console.log(`Robot ${state.robotId} force-arriving at ${state.nextNodeId} to prevent getting stuck (close & slow)`);
                    forceArrival();
                    continue; // Skip the rest of this iteration
                  }
                  
                  // SAFETY 2: If we've been decelerating for too long, force arrival
                  // This catches cases where the robot might be oscillating or calculation errors
                  if (state.currentSpeed < 0.2 && distanceToTarget < 2.0) {
                    console.log(`Robot ${state.robotId} force-arriving at ${state.nextNodeId} to prevent getting stuck (slow speed)`);
                    forceArrival();
                    continue; // Skip the rest of this iteration
                  }
                  
                  // SAFETY 3: If we're very close regardless of speed, force arrival
                  if (distanceToTarget < 0.1) {
                    console.log(`Robot ${state.robotId} force-arriving at ${state.nextNodeId} to prevent getting stuck (very close)`);
                    forceArrival();
                    continue; // Skip the rest of this iteration
                  }
                } else {
                  // Reduce to 30% of max speed for regular nodes, but don't stop completely
                  const minSpeed = maxSpeed * 0.3;
                  state.currentSpeed = Math.max(
                    state.currentSpeed - acceleration * deltaTime * animationSpeed, 
                    minSpeed
                  );
                  
                  // If we've slowed down enough, transition back to accelerating
                  if (state.currentSpeed <= minSpeed + 0.1) {
                    state.isDecelerating = false;
                    // Don't immediately accelerate - wait until we're past the node
                  }
                }
              }
              
              if (distanceToTarget > 0.01) {
                // Normalize direction vector
                const dirX = dx / distanceToTarget;
                const dirY = dy / distanceToTarget;
                
                // Calculate movement distance based on current speed
                const movementDistance = state.currentSpeed * deltaTime * animationSpeed;
                
                // Don't overshoot the target
                const actualDistance = Math.min(movementDistance, distanceToTarget);
                
                // Update position
                const newX = currentPos[0] + dirX * actualDistance;
                const newY = currentPos[1] + dirY * actualDistance;
                
                // Update distance traveled
                state.totalDistance += actualDistance;
                totalDistanceDelta += actualDistance;
                newRobotDistances[state.robotId] = (newRobotDistances[state.robotId] || 0) + actualDistance;
                
                // Dynamically update battery level based on distance traveled, if not recharging
                if (!state.isRecharging && !isRechargeTask) {
                  // Use component-level parameters which may have been updated from task data
                  // Calculate and update battery level in real-time
                  state.battery_remaining = calculateBatteryPercentage(
                    state.totalDistance, 
                    currentMaxDistance, 
                    currentBatteryCapacity
                  );
                  
                  // Log battery level periodically for debugging (e.g., every 5 seconds)
                  if (Math.floor(metrics.elapsedTime) % 5 === 0 && 
                      Math.floor(metrics.elapsedTime) !== Math.floor(metrics.elapsedTime - deltaTime * animationSpeed)) {
                    console.log(`Robot ${state.robotId} battery: ${state.battery_remaining.toFixed(2)}%, distance: ${state.totalDistance.toFixed(2)}m`);
                  }
                  
                  // Check for low battery
                  if (state.battery_remaining <= 15) {
                    console.log(`⚠️ Robot ${state.robotId} LOW BATTERY ALERT: ${state.battery_remaining.toFixed(1)}%`);
                  }
                }
                
                // Check if we've reached or are very close to the target
                if (distanceToTarget - actualDistance < 0.01) {
                  // Reached target node, determine if it's a pickup/dropoff
                  const isPickup = environment.elements.pickups.some(p => p.id === state.nextNodeId);
                  const isDropoff = environment.elements.dropoffs.some(d => d.id === state.nextNodeId);
                  const isNodePickupOrDropoff = isPickup || isDropoff;
                  
                  // Snap to target position
                  state.position = [...targetPos] as [number, number];
                  state.stepsComplete++;
                  
                  // Always reset movement state
                  state.isAccelerating = false;
                  state.isDecelerating = false;
                  state.targetNodePosition = null;
                  
                  // For pickup/dropoff points, always set speed to 0 regardless of deceleration state
                  if (isNodePickupOrDropoff) {
                    state.currentSpeed = 0; // Force stop at pickup/dropoff
                    
                    // Update task status
                    if (isPickup) {
                      // Only update if not already at pickup to prevent double-counting
                      if (!state.atPickup && state.task?.pickup === state.nextNodeId) {
                        state.atPickup = true;
                        state.atDropoff = false;
                        logTaskStatus(state.robotId, "PICKUP", `Reached ${state.nextNodeId} for task: ${state.task?.pickup} → ${state.task?.dropoff}`);
                        console.log(`Robot ${state.robotId} reached pickup ${state.nextNodeId} for task: ${state.task?.pickup} → ${state.task?.dropoff}`);
                        
                        // If this is a new task, record start time
                        if (!state.currentTaskStartTime) {
                          state.currentTaskStartTime = metrics.elapsedTime;
                        }
                      }
                    } else if (isDropoff) {
                      // Only count task completion if this is the actual destination dropoff for the task
                      if (!state.atDropoff && state.task?.dropoff === state.nextNodeId) {
                        // We've completed a task
                        state.atPickup = false;
                        state.atDropoff = true;
                        state.tasksCompleted++;
                        logTaskStatus(state.robotId, "DROPOFF", `Completed task #${state.tasksCompleted} at ${state.nextNodeId}: ${state.task?.pickup} → ${state.task?.dropoff}`);
                        console.log(`Robot ${state.robotId} reached dropoff ${state.nextNodeId}, completed task #${state.tasksCompleted}: ${state.task?.pickup} → ${state.task?.dropoff}`);
                        
                        // Reset task start time for next task
                        state.currentTaskStartTime = 0;
                      }
                    }
                  }
                  
                  // Use the moveToNextNode helper function
                  moveToNextNode();
                } else {
                  // Continue moving towards the target
                  state.position = [newX, newY] as [number, number];
                }
              } else {
                // Already at target position
                state.position = [...targetPos] as [number, number];
                
                // Reset movement state first
                state.isAccelerating = false;
                state.isDecelerating = false;
                state.targetNodePosition = null;
                
                // Check if it's a pickup or dropoff
                const isPickup = environment.elements.pickups.some(p => p.id === state.nextNodeId);
                const isDropoff = environment.elements.dropoffs.some(d => d.id === state.nextNodeId);
                const isNodePickupOrDropoff = isPickup || isDropoff;
                
                if (isNodePickupOrDropoff) {
                  state.currentSpeed = 0; // Force stop at pickup/dropoff
                  
                  // Update task status
                  if (isPickup) {
                    // Only update if not already at pickup to prevent double-counting
                    if (!state.atPickup && state.task?.pickup === state.nextNodeId) {
                      state.atPickup = true;
                      state.atDropoff = false;
                      logTaskStatus(state.robotId, "PICKUP", `Reached ${state.nextNodeId} for task: ${state.task?.pickup} → ${state.task?.dropoff}`);
                      console.log(`Robot ${state.robotId} reached pickup ${state.nextNodeId} for task: ${state.task?.pickup} → ${state.task?.dropoff}`);
                      
                      // If this is a new task, record start time
                      if (!state.currentTaskStartTime) {
                        state.currentTaskStartTime = metrics.elapsedTime;
                      }
                    }
                  } else if (isDropoff) {
                    // Only count task completion if this is the actual destination dropoff for the task
                    if (!state.atDropoff && state.task?.dropoff === state.nextNodeId) {
                      // We've completed a task
                      state.atPickup = false;
                      state.atDropoff = true;
                      state.tasksCompleted++;
                      logTaskStatus(state.robotId, "DROPOFF", `Completed task #${state.tasksCompleted} at ${state.nextNodeId}: ${state.task?.pickup} → ${state.task?.dropoff}`);
                      console.log(`Robot ${state.robotId} reached dropoff ${state.nextNodeId}, completed task #${state.tasksCompleted}: ${state.task?.pickup} → ${state.task?.dropoff}`);
                      
                      // Reset task start time for next task
                      state.currentTaskStartTime = 0;
                    }
                  }
                }
                
                // Use the moveToNextNode helper function
                moveToNextNode();
              }
            }
          }
          
          // Update metrics
          setMetrics(prev => {
            // Track task completions and time
            let newCompletedTasks = prev.completedTasks;
            let newAvgTaskTime = prev.avgTaskTime;
            let newLastTaskCompletionTime = prev.lastTaskCompletionTime;
            const newTasksPerRobot = { ...prev.tasksPerRobot };
            
            // Check for newly completed tasks
            robotStates.forEach(robot => {
              const robotTasks = newTasksPerRobot[robot.robotId] || { total: 0, completed: 0 };
              
              // If robot has completed more tasks than previously recorded
              if (robot.tasksCompleted > robotTasks.completed) {
                const newlyCompletedTasks = robot.tasksCompleted - robotTasks.completed;
                logTaskStatus(robot.robotId, "METRICS", `Robot completed ${newlyCompletedTasks} new tasks, total now ${robot.tasksCompleted}. Updating metrics.`);
                console.log(`Updating metrics: Robot ${robot.robotId} completed ${newlyCompletedTasks} new tasks, total now ${robot.tasksCompleted}`);
                newCompletedTasks += newlyCompletedTasks;
                
                // Update per-robot stats
                newTasksPerRobot[robot.robotId] = {
                  ...robotTasks,
                  completed: robot.tasksCompleted
                };
                
                // Update completion timestamp
                newLastTaskCompletionTime = prev.elapsedTime;
                
                // Update average task time
                if (newCompletedTasks > 0) {
                  if (prev.completedTasks === 0) {
                    // First completion - just use current time
                    newAvgTaskTime = newLastTaskCompletionTime;
                  } else {
                    // Running average calculation
                    newAvgTaskTime = (prev.avgTaskTime * prev.completedTasks + 
                      (newLastTaskCompletionTime - prev.lastTaskCompletionTime) * newlyCompletedTasks) / 
                      newCompletedTasks;
                  }
                }
              }
            });
            
            // Always update elapsed time - this ensures time continues during recharging
            return {
              elapsedTime: prev.elapsedTime + deltaTime * animationSpeed,
              totalDistance: prev.totalDistance + totalDistanceDelta,
              robotDistances: newRobotDistances,
              totalTasks: prev.totalTasks,
              completedTasks: newCompletedTasks,
              tasksPerRobot: newTasksPerRobot,
              avgTaskTime: newAvgTaskTime,
              lastTaskCompletionTime: newLastTaskCompletionTime
            };
          });
          
          // Update step counter
          setCurrentStep(prev => {
            const newStep = Math.min(prev + 1, maxSteps);
            return newStep;
          });
          
          // If all robots have completed their paths, stop the animation
          if (allPathsCompleted) {
            setIsPlaying(false);
          }
          
          return newStates;
        });
        
        lastTime = timestamp;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, robotPaths, maxSteps, animationSpeed, acceleration, maxSpeed, metrics]);
  
  // Draw function
  useEffect(() => {
    if (!canvasRef.current || !environment) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Calculate grid size based on dimensions
    const cellWidth = Math.max(canvas.width / environment.dimensions.width, 25) * zoomLevel;
    const cellHeight = Math.max(canvas.height / environment.dimensions.height, 25) * zoomLevel;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply pan transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    // Calculate total grid dimensions
    const totalGridWidth = environment.dimensions.width * cellWidth;
    const totalGridHeight = environment.dimensions.height * cellHeight;
    
    // Center the grid in the available canvas space
    const offsetX = (canvas.width - totalGridWidth) / 2;
    const offsetY = (canvas.height - totalGridHeight) / 2;
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= environment.dimensions.width; x++) {
      const xPos = offsetX + x * cellWidth;
      ctx.beginPath();
      ctx.moveTo(xPos, offsetY);
      ctx.lineTo(xPos, offsetY + totalGridHeight);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= environment.dimensions.height; y++) {
      const yPos = offsetY + y * cellHeight;
      ctx.beginPath();
      ctx.moveTo(offsetX, yPos);
      ctx.lineTo(offsetX + totalGridWidth, yPos);
      ctx.stroke();
    }
    
    // Draw environment elements
    
    // Draw shelves
    ctx.fillStyle = '#3B82F6'; // Blue
    environment.elements.shelves.forEach((shelf) => {
      const [x, y] = shelf.position;
      const [width, height] = shelf.size;
      ctx.fillRect(
        offsetX + x * cellWidth,
        offsetY + y * cellHeight,
        width * cellWidth,
        height * cellHeight
      );
      
      // Draw shelf label
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(12 * zoomLevel, 10)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        shelf.id,
        offsetX + (x + width / 2) * cellWidth,
        offsetY + (y + height / 2) * cellHeight
      );
      ctx.fillStyle = '#3B82F6'; // Reset fill color
    });
    
    // Draw pickups
    ctx.fillStyle = '#EC4899'; // Pink
    environment.elements.pickups.forEach((pickup) => {
      const [x, y] = pickup.position;
      const radius = 0.35 * Math.min(cellWidth, cellHeight);
      
      ctx.beginPath();
      ctx.arc(
        offsetX + x * cellWidth,
        offsetY + y * cellHeight,
        radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      // Draw pickup label
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(12 * zoomLevel, 10)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        pickup.id,
        offsetX + x * cellWidth,
        offsetY + y * cellHeight
      );
      ctx.fillStyle = '#EC4899'; // Reset fill color
    });
    
    // Draw dropoffs
    ctx.fillStyle = '#10B981'; // Green
    environment.elements.dropoffs.forEach((dropoff) => {
      const [x, y] = dropoff.position;
      const radius = 0.4 * Math.min(cellWidth, cellHeight);
      
      ctx.beginPath();
      ctx.arc(
        offsetX + x * cellWidth,
        offsetY + y * cellHeight,
        radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      // Draw dropoff label
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(12 * zoomLevel, 10)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        dropoff.id,
        offsetX + x * cellWidth,
        offsetY + y * cellHeight
      );
      ctx.fillStyle = '#10B981'; // Reset fill color
    });
    
    // Draw robot stations
    ctx.fillStyle = '#F59E0B'; // Amber
    environment.elements.robot_stations.forEach((station) => {
      const [x, y] = station.position;
      
      ctx.beginPath();
      ctx.moveTo(offsetX + x * cellWidth, offsetY + (y - 0.4) * cellHeight);
      ctx.lineTo(offsetX + (x + 0.4) * cellWidth, offsetY + y * cellHeight);
      ctx.lineTo(offsetX + x * cellWidth, offsetY + (y + 0.4) * cellHeight);
      ctx.lineTo(offsetX + (x - 0.4) * cellWidth, offsetY + y * cellHeight);
      ctx.closePath();
      ctx.fill();
      
      // Draw station label
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(12 * zoomLevel, 10)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        station.id,
        offsetX + x * cellWidth,
        offsetY + y * cellHeight
      );
      ctx.fillStyle = '#F59E0B'; // Reset fill color
    });
    
    // Draw robots
    robotStates.forEach((robot) => {
      const [x, y] = robot.position;
      
      // Draw a robot circle
      ctx.fillStyle = robot.color;
      ctx.beginPath();
      ctx.arc(
        offsetX + x * cellWidth,
        offsetY + y * cellHeight,
        0.4 * Math.min(cellWidth, cellHeight),
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      // Add battery indicator for low battery
      if (robot.battery_remaining <= 15 && !robot.isRecharging) {
        // Flash battery warning for critical battery
        const now = Date.now();
        if ((now % 1000) < 500) { // Flash every half second
          // Draw red battery warning
          ctx.fillStyle = 'red';
          const size = 0.2 * Math.min(cellWidth, cellHeight);
          
          // Draw battery warning triangle
          ctx.beginPath();
          ctx.moveTo(offsetX + x * cellWidth, offsetY + (y - 0.6) * cellHeight - size);
          ctx.lineTo(offsetX + (x + size) * cellWidth, offsetY + (y - 0.6) * cellHeight + size);
          ctx.lineTo(offsetX + (x - size) * cellWidth, offsetY + (y - 0.6) * cellHeight + size);
          ctx.closePath();
          ctx.fill();
          
          // Draw ! inside triangle
          ctx.fillStyle = 'white';
          ctx.font = `bold ${Math.max(10 * zoomLevel, 8)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', offsetX + x * cellWidth, offsetY + (y - 0.6) * cellHeight);
        }
      }
      
      // Draw recharge animation if robot is recharging
      if (robot.isRecharging) {
        // Draw battery charging animation around the robot
        const now = Date.now();
        const flashPhase = (now % 1000) / 1000; // 0 to 1 every second
        
        // Only show charging indicator during part of the animation cycle
        if (flashPhase < 0.7) {
          // Draw lightning bolt or battery indicator
          ctx.fillStyle = 'yellow';
          
          // Draw battery icon with lightning
          const size = 0.5 * Math.min(cellWidth, cellHeight);
          const batteryX = offsetX + x * cellWidth;
          const batteryY = offsetY + (y - 0.5) * cellHeight;
          
          // Draw lightning bolt
          ctx.beginPath();
          ctx.moveTo(batteryX, batteryY - size);
          ctx.lineTo(batteryX + size * 0.5, batteryY);
          ctx.lineTo(batteryX, batteryY + size * 0.5);
          ctx.lineTo(batteryX - size * 0.3, batteryY - size * 0.3);
          ctx.closePath();
          ctx.fill();
          
          // Show recharge time remaining
          ctx.fillStyle = 'white';
          ctx.font = `${Math.max(10 * zoomLevel, 8)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            `${robot.rechargeTimeRemaining > 0 
              ? `${Math.ceil(robot.rechargeTimeRemaining / 60)}m ${Math.ceil(robot.rechargeTimeRemaining % 60)}s` 
              : 'Complete'}`,
            offsetX + x * cellWidth,
            offsetY + (y + 0.6) * cellHeight
          );
        }
      }
      
      // Draw robot ID
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(14 * zoomLevel, 12)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        robot.robotId,
        offsetX + x * cellWidth,
        offsetY + y * cellHeight
      );
      
      // Draw the current task info if available
      if (robot.task) {
        // Draw a small label above the robot
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = `${Math.max(10 * zoomLevel, 8)}px Inter, sans-serif`;
        ctx.fillText(
          `${robot.task.pickup} → ${robot.task.dropoff}`,
          offsetX + x * cellWidth,
          offsetY + (y - 0.3) * cellHeight - 15 * zoomLevel
        );
      }
    });
    
    ctx.restore();
  }, [environment, robotStates, zoomLevel, panOffset]);
  
  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2.5));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };
  
  // Pan handler functions
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState<{x: number, y: number} | null>(null);
  
  const handlePanStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setLastPanPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handlePanMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning || !lastPanPosition) return;
    
    const deltaX = e.clientX - lastPanPosition.x;
    const deltaY = e.clientY - lastPanPosition.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handlePanEnd = () => {
    setIsPanning(false);
    setLastPanPosition(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {isPlaying ? (
            <button 
              onClick={stopAnimation} 
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Pause
            </button>
          ) : (
            <button 
              onClick={startAnimation} 
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Play
            </button>
          )}
          <button 
            onClick={resetAnimation} 
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
        
        {/* <div className="text-sm text-gray-600">
          Step {currentStep} of {maxSteps}
        </div> */}
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm whitespace-nowrap">Speed:</span>
            <select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="p-1 text-sm border rounded"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </div>
          
          <div className="space-x-2">
            <button 
              onClick={handleZoomOut} 
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              -
            </button>
            <span className="text-sm">Zoom: {Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={handleZoomIn} 
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
          
          <div>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-2 py-1 rounded ${debugMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Debug {debugMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Physics Controls */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Speed (m/s)
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={maxSpeed}
            onChange={(e) => {
              // Parse the new max speed value
              const newMaxSpeed = parseFloat(e.target.value);
              // Update the max speed state
              setMaxSpeed(newMaxSpeed);
              // Update robot speeds if needed
              setRobotStates(prevStates => {
                return prevStates.map(state => ({
                  ...state,
                  // If current speed is higher than new max, cap it
                  currentSpeed: Math.min(state.currentSpeed, newMaxSpeed)
                }));
              });
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.1</span>
            <span>{maxSpeed.toFixed(1)}</span>
            <span>5.0</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Acceleration (m/s²)
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={acceleration}
            onChange={(e) => {
              // Parse the new acceleration value
              const newAcceleration = parseFloat(e.target.value);
              // Update the acceleration state with the new value
              setAcceleration(newAcceleration);
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.1</span>
            <span>{acceleration.toFixed(1)}</span>
            <span>3.0</span>
          </div>
        </div>
      </div>
      
      {/* Metrics Display */}
      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-md">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">Elapsed Time</div>
          <div className="text-xl font-semibold">{metrics.elapsedTime.toFixed(1)}s</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">Total Distance</div>
          <div className="text-xl font-semibold">{metrics.totalDistance.toFixed(1)}m</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700">Avg. Speed</div>
          <div className="text-xl font-semibold">
            {metrics.elapsedTime > 0 
              ? (metrics.totalDistance / metrics.elapsedTime).toFixed(1) 
              : '0.0'} m/s
          </div>
        </div>
      </div>
      
      {/* Task Metrics */}
      <div className="p-3 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Task Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500">Task Completion</div>
            <div className="text-lg font-semibold">
              {metrics.completedTasks} / {metrics.totalTasks}
              <span className="text-sm text-gray-500 ml-1">
                ({metrics.totalTasks > 0 
                  ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) 
                  : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
              <div 
                className="h-full bg-blue-600 rounded-full"
                style={{ 
                  width: `${metrics.totalTasks > 0 
                    ? (metrics.completedTasks / metrics.totalTasks) * 100
                    : 0}%` 
                }}
              />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500">Avg. Task Time</div>
            <div className="text-lg font-semibold">
              {metrics.avgTaskTime > 0 
                ? metrics.avgTaskTime.toFixed(1) 
                : '-'} s
            </div>
          </div>
          
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500">Last Task Completed</div>
            <div className="text-lg font-semibold">
              {metrics.lastTaskCompletionTime > 0 
                ? metrics.lastTaskCompletionTime.toFixed(1) 
                : '-'} s
            </div>
          </div>
          
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500">Estimated Finish</div>
            <div className="text-lg font-semibold">
              {metrics.completedTasks > 0 && metrics.totalTasks > metrics.completedTasks
                ? (metrics.avgTaskTime * metrics.totalTasks).toFixed(1)
                : '-'} s
            </div>
          </div>
        </div>
      </div>
      
      {/* Robot Metrics */}
      <div className="p-3 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Robot Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {robotStates.map(robot => (
            <div key={robot.robotId} className="p-2 bg-white rounded shadow-sm border" style={{ borderColor: robot.color }}>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: robot.color }}></div>
                <span className="text-sm font-medium">{robot.robotId}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-600">
                <div>Distance:</div>
                <div className="text-right font-medium">{robot.totalDistance.toFixed(1)}m</div>
                <div>Current Speed:</div>
                <div className="text-right font-medium">{robot.currentSpeed.toFixed(1)} m/s</div>
                <div>Battery Level:</div>
                <div className="text-right font-medium">
                  <div className="flex items-center justify-end">
                    <div className="w-8 h-2 bg-gray-200 rounded-full mr-1">
                      <div 
                        className={`h-2 rounded-full ${
                          robot.battery_remaining > 70 ? 'bg-green-500' : 
                          robot.battery_remaining > 30 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, robot.battery_remaining))}%` }}
                      />
                    </div>
                    <span>{robot.battery_remaining.toFixed(1)}%</span>
                  </div>
                </div>
                <div>State:</div>
                <div className="text-right font-medium">
                  {robot.isAccelerating ? 'Accelerating' : 
                   robot.isDecelerating ? 'Decelerating' : 
                   robot.isRecharging ? (
                     <span className="flex items-center justify-end text-purple-500">
                       Recharging
                       <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">
                         {robot.rechargeTimeRemaining > 0 
                           ? `${Math.ceil(robot.rechargeTimeRemaining / 60)}m ${Math.ceil(robot.rechargeTimeRemaining % 60)}s` 
                           : 'Complete'}
                       </span>
                     </span>
                   ) : 
                   robot.currentSpeed > 0 ? 'Cruising' : 'Stopped'}
                  {robot.atDropoff && !robot.isRecharging && 
                    <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                      Completed
                    </span>
                  }
                </div>
                <div>Tasks:</div>
                <div className="text-right font-medium">
                  {robot.tasksCompleted} / {metrics.tasksPerRobot[robot.robotId]?.total || 0}
                </div>
                <div>Status:</div>
                <div className="text-right font-medium">
                  {robot.atPickup ? <span className="text-pink-500">At Pickup</span> : 
                   robot.atDropoff ? <span className="text-green-500">At Dropoff</span> : 
                   robot.task ? <span className="text-blue-500">In Transit</span> : 
                   <span>Idle</span>}
                </div>
                {debugMode && robot.task && (
                  <>
                    <div>Current Task:</div>
                    <div className="text-right font-medium">
                      {robot.task.pickup} → {robot.task.dropoff}
                    </div>
                    <div>At Location:</div>
                    <div className="text-right font-medium">
                      {robot.nextNodeId || 'None'}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Task State Debug Info */}
      {debugMode && (
        <div className="p-3 bg-red-50 rounded-md border border-red-200">
          <h3 className="text-sm font-medium text-red-700 mb-2">Task Debug Info</h3>
          <div className="grid grid-cols-1 gap-2 text-xs font-mono">
            {robotStates.map(robot => (
              <div key={robot.robotId} className="p-2 bg-white rounded shadow-sm">
                <div className="font-semibold mb-1">{robot.robotId}</div>
                <div><span className="text-gray-500">Task Index:</span> {robot.currentTaskIndex}</div>
                <div><span className="text-gray-500">Path Index:</span> {robot.currentPathIndex}</div>
                <div><span className="text-gray-500">Current Task:</span> {robot.task ? `${robot.task.pickup} → ${robot.task.dropoff}` : 'None'}</div>
                <div><span className="text-gray-500">At Node:</span> {robot.nextNodeId || 'None'}</div>
                <div className="mt-1">
                  <span className={`px-1 py-0.5 rounded ${robot.atPickup ? 'bg-pink-100 text-pink-800' : 'bg-gray-100'}`}>
                    atPickup: {robot.atPickup ? 'true' : 'false'}
                  </span>
                  <span className={`ml-2 px-1 py-0.5 rounded ${robot.atDropoff ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                    atDropoff: {robot.atDropoff ? 'true' : 'false'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tasks Completed:</span> {robot.tasksCompleted}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="border rounded-md bg-white h-96 relative overflow-hidden"
      >
        <canvas 
          ref={canvasRef}
          className="absolute inset-0"
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        />
        
        <div className="absolute bottom-3 left-3 bg-white bg-opacity-80 p-2 rounded text-xs text-gray-600">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span>
              <span>Shelves</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
              <span>Dropoff</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-pink-500 mr-1"></span>
              <span>Pickup</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 transform rotate-45 bg-amber-500 mr-1"></span>
              <span>Station</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${(currentStep / maxSteps) * 100}%` }}
        />
      </div> */}
      
      {/* <input
        type="range"
        min="0"
        max={maxSteps}
        value={currentStep}
        onChange={(e) => {
          const newStep = parseInt(e.target.value);
          setCurrentStep(newStep);
          
          // If manually moving the slider, update robot positions
          // This would require calculating the exact state at that step
          // For simplicity, just reset and restart from beginning
          if (Math.abs(newStep - currentStep) > 5) {
            resetAnimation();
          }
        }}
        className="w-full"
      /> */}
    </div>
  );
}; 