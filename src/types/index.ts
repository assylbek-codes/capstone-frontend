// User-related types
export interface User {
  id: number;
  email: string;
  username: string;
}

// Environment-related types
export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Shelf {
  id: string;
  position: [number, number];
  size: [number, number];
}

export interface Dropoff {
  id: string;
  position: [number, number];
}

export interface Pickup {
  id: string;
  position: [number, number];
  shelf_id: string;
  side: 'left' | 'right' | 'top' | 'bottom';
}

export interface NavigationPoint {
  id: string;
  position: [number, number];
  shelf_id: string;
}

export interface RobotStation {
  id: string;
  position: [number, number];
  robot_count?: number;
}

export interface Robot {
  id: string;
  station_id: string;
  position: [number, number];
}

export interface EnvironmentElements {
  shelves: Shelf[];
  dropoffs: Dropoff[];
  robot_stations: RobotStation[];
  pickups: Pickup[];
  robots: Robot[];
  navigation_points: NavigationPoint[];
}

export interface GraphNode {
  id: string;
  type: 'pickup' | 'dropoff' | 'robot' | 'navigation';
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Environment {
  id: number;
  name: string;
  description?: string;
  dimensions: Dimensions;
  elements: EnvironmentElements;
  graph: Graph;
  created_at: string;
  updated_at: string;
}

// Scenario-related types
export interface ScenarioParameters {
  order_volume: 'low' | 'medium' | 'high';
  priority_rules: string;
  robot_count: number;
  [key: string]: any;
}

export interface Scenario {
  id: number;
  name: string;
  description?: string;
  parameters: ScenarioParameters;
  environment_id: number;
  environment?: Environment;
  created_at: string;
  updated_at: string;
}

// Task-related types
export type TaskType = 'pickup' | 'delivery' | 'pickup_delivery';

export interface TaskDetails {
  start_point: [number, number];
  end_point: [number, number];
  priority: number;
  additional_details?: Record<string, any>;
  tasks?: [string, string][]; // Array of pickup-dropoff pairs
}

export interface Task {
  id: number;
  name: string;
  description?: string;
  task_type: TaskType;
  details: TaskDetails;
  scenario_id: number;
  environment_id: number;
  scenario?: Scenario;
  environment?: Environment;
  created_at: string;
  updated_at: string;
}

// Algorithm-related types
export interface Algorithm {
  id: number;
  name: string;
  description?: string;
  parameters: Record<string, any>;
}

// Solve-related types
export interface SolveParameters {
  optimization_target: 'time' | 'distance' | 'energy';
  collision_avoidance: boolean;
  [key: string]: any;
}

export interface SolveResult {
  paths: Record<string, [number, number][]>;
  stats: {
    completion_time: number;
    total_distance: number;
    collisions: number;
    [key: string]: any;
  };
}

export interface Solve {
  id: number;
  name: string;
  description?: string;
  parameters: SolveParameters;
  environment_id: number;
  scenario_id: number;
  algorithm_id: number;
  task_id: number;
  result?: SolveResult;
  status: 'pending' | 'running' | 'completed' | 'failed';
  environment?: Environment;
  scenario?: Scenario;
  algorithm?: Algorithm;
  tasks?: Task[];
  created_at: string;
  updated_at: string;
} 