import apiClient from './client';
import { Environment, Dimensions, EnvironmentElements, Graph, GraphNode } from '../types';

interface CreateEnvironmentData {
  name: string;
  description?: string;
  dimensions: Dimensions;
  elements: EnvironmentElements;
  graph: Graph;
}

interface UpdateEnvironmentData {
  name?: string;
  description?: string;
  dimensions?: Dimensions;
  elements?: EnvironmentElements;
  graph?: Graph;
}

export const environmentsApi = {
  getAll: async () => {
    const response = await apiClient.get<Environment[]>('/environments');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await apiClient.get<Environment>(`/environments/${id}`);
    return response.data;
  },
  
  create: async (data: CreateEnvironmentData) => {
    const response = await apiClient.post<Environment>('/environments', data);
    return response.data;
  },
  
  update: async (id: number, data: UpdateEnvironmentData) => {
    const response = await apiClient.put<Environment>(`/environments/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await apiClient.delete(`/environments/${id}`);
    return response.data;
  },
  
  // Helper method to generate a graph from environment elements
  generateGraph: (dimensions: Dimensions, elements: EnvironmentElements): Graph => {
    // Initialize graph with proper structure
    const graph: Graph = {
      nodes: [],
      edges: []
    };
    
    const { width, height } = dimensions;
    
    // Create a grid representing walkable areas
    const grid: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(true));
    
    // Mark cells occupied by shelves as non-walkable
    elements.shelves.forEach((shelf) => {
      const [x, y] = shelf.position;
      const [shelfWidth, shelfHeight] = shelf.size;
      
      for (let i = 0; i < shelfWidth; i++) {
        for (let j = 0; j < shelfHeight; j++) {
          if (x + i < width && y + j < height) {
            grid[y + j][x + i] = false;
          }
        }
      }
    });
    
    // Build the graph (connections between walkable cells)
    const nodeMap: Record<string, GraphNode> = {};
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!grid[y][x]) continue; // Skip non-walkable cells
        
        // Create a navigation node for this position
        const nodeId = `nav_${x}_${y}`;
        const node: GraphNode = {
          id: nodeId,
          type: 'navigation',
          x,
          y
        };
        
        graph.nodes.push(node);
        nodeMap[`(${x},${y})`] = node;
        
        const directions = [
          [-1, 0], // Left
          [1, 0],  // Right
          [0, -1], // Up
          [0, 1]   // Down
        ];
        
        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;
          
          // Check if the neighbor is within bounds and walkable
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx]) {
            const neighborId = `nav_${nx}_${ny}`;
            
            // Add edge to the graph (will be added if neighbor exists)
            graph.edges.push({
              from: nodeId,
              to: neighborId,
              weight: 1
            });
          }
        }
      }
    }
    
    return graph;
  }
}; 