import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import { GridEditor } from '../components/environment/GridEditor';
import { Dimensions, EnvironmentElements, Graph, Pickup, Shelf, Robot, NavigationPoint } from '../types';
import apiClient from '../api/client';

export const EnvironmentGridEditorPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 20, height: 20 });
  const [elements, setElements] = useState<EnvironmentElements>({
    shelves: [],
    dropoffs: [],
    robot_stations: [],
    pickups: [],
    robots: [],
    navigation_points: []
  });
  const [allPickupPoints, setAllPickupPoints] = useState<Pickup[]>([]);
  const [selectedPickupIds, setSelectedPickupIds] = useState<Set<string>>(new Set());
  const [robotCounts, setRobotCounts] = useState<Record<string, number>>({});
  const [resultJson, setResultJson] = useState<string>('');
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [showGraph, setShowGraph] = useState(false);

  // Function to update robot count for a specific station
  const handleRobotCountChange = (stationId: string, count: number) => {
    setRobotCounts(prev => ({
      ...prev,
      [stationId]: count
    }));
  };

  // Toggle selection of a pickup point
  const togglePickupSelection = (pickupId: string) => {
    setSelectedPickupIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pickupId)) {
        newSet.delete(pickupId);
      } else {
        newSet.add(pickupId);
      }
      return newSet;
    });
  };

  // Generate pickup points around shelf edges
  const generatePickupPoints = (shelves: Shelf[]) => {
    const pickups: Pickup[] = [];
    let pickupId = 1;

    shelves.forEach(shelf => {
      const [x, y] = shelf.position;
      const [width, height] = shelf.size;
      
      // Top edge - place points on the top grid line
      for (let i = 0; i < width; i++) {
        pickups.push({
          id: `P${pickupId++}`,
          position: [x + i + 0.5, y],
          shelf_id: shelf.id,
          side: 'top'
        });
      }
      
      // Right edge - place points on the right grid line
      for (let i = 0; i < height; i++) {
        pickups.push({
          id: `P${pickupId++}`,
          position: [x + width, y + i + 0.5],
          shelf_id: shelf.id,
          side: 'right'
        });
      }
      
      // Bottom edge - place points on the bottom grid line
      for (let i = width - 1; i >= 0; i--) {
        pickups.push({
          id: `P${pickupId++}`,
          position: [x + i + 0.5, y + height],
          shelf_id: shelf.id,
          side: 'bottom'
        });
      }
      
      // Left edge - place points on the left grid line
      for (let i = height - 1; i >= 0; i--) {
        pickups.push({
          id: `P${pickupId++}`,
          position: [x, y + i + 0.5],
          shelf_id: shelf.id,
          side: 'left'
        });
      }
    });
    
    // Filter out duplicate pickup points and those outside grid bounds
    const uniquePickups: Pickup[] = [];
    const positionSet = new Set<string>();
    
    pickups.forEach(pickup => {
      const [px, py] = pickup.position;
      
      // Check if position is within grid bounds
      if (px < 0 || px > dimensions.width || py < 0 || py > dimensions.height) {
        return; // Skip this pickup point
      }
      
      const posKey = `${px},${py}`;
      if (!positionSet.has(posKey)) {
        positionSet.add(posKey);
        uniquePickups.push(pickup);
      }
    });
    
    return uniquePickups;
  };

  // Generate navigation points at shelf corners
  const generateNavigationPoints = (shelves: Shelf[]) => {
    const navigationPoints: NavigationPoint[] = [];
    let navPointId = 1;

    shelves.forEach(shelf => {
      const [x, y] = shelf.position;
      const [width, height] = shelf.size;
      
      // Top-Left corner
      navigationPoints.push({
        id: `N${navPointId++}`,
        position: [x - 0.5, y - 0.5],
        shelf_id: shelf.id
      });
      
      // Top-Right corner
      navigationPoints.push({
        id: `N${navPointId++}`,
        position: [x + width + 0.5, y - 0.5],
        shelf_id: shelf.id
      });
      
      // Bottom-Right corner
      navigationPoints.push({
        id: `N${navPointId++}`,
        position: [x + width + 0.5, y + height + 0.5],
        shelf_id: shelf.id
      });
      
      // Bottom-Left corner
      navigationPoints.push({
        id: `N${navPointId++}`,
        position: [x - 0.5, y + height + 0.5],
        shelf_id: shelf.id
      });
    });
    
    // Filter out duplicate navigation points, those outside grid bounds, 
    // and those that overlap with other shelves
    const uniqueNavPoints: NavigationPoint[] = [];
    const positionSet = new Set<string>();
    
    navigationPoints.forEach(navPoint => {
      const [nx, ny] = navPoint.position;
      
      // Check if position is within grid bounds
      if (nx < 0 || nx > dimensions.width || ny < 0 || ny > dimensions.height) {
        return; // Skip this navigation point
      }
      
      // Check if navigation point is on any shelf
      const isOnShelf = shelves.some(shelf => {
        const [sx, sy] = shelf.position;
        const [sw, sh] = shelf.size;
        
        // If the navPoint position is inside this shelf
        return (
          nx >= sx && nx <= sx + sw &&
          ny >= sy && ny <= sy + sh
        );
      });
      
      // Skip if the navigation point is on a shelf
      if (isOnShelf) {
        return;
      }
      
      const posKey = `${nx},${ny}`;
      if (!positionSet.has(posKey)) {
        positionSet.add(posKey);
        uniqueNavPoints.push(navPoint);
      }
    });
    
    return uniqueNavPoints;
  };

  // Update navigation points when shelves change
  useEffect(() => {
    // Generate pickup points
    const pickups = generatePickupPoints(elements.shelves);
    setAllPickupPoints(pickups);
    
    // Generate navigation points
    const navPoints = generateNavigationPoints(elements.shelves);
    
    // Clear selection when shelves change
    setSelectedPickupIds(new Set());
    
    // Update elements with the selected pickup points and all navigation points
    const selectedPickups = pickups.filter(p => selectedPickupIds.has(p.id));
    setElements(prev => ({
      ...prev,
      pickups: selectedPickups,
      navigation_points: navPoints
    }));
  }, [elements.shelves, dimensions]);

  // Update elements when selected pickup points change
  useEffect(() => {
    const selectedPickups = allPickupPoints.filter(p => selectedPickupIds.has(p.id));
    setElements(prev => ({
      ...prev,
      pickups: selectedPickups
    }));
  }, [selectedPickupIds, allPickupPoints]);

  // Generate individual robots from robot stations and their counts
  const generateRobots = () => {
    const robots: Robot[] = [];

    elements.robot_stations.forEach(station => {
      const count = robotCounts[station.id] || 1;
      
      // Create multiple robots for this station based on the count
      for (let i = 0; i < count; i++) {
        robots.push({
          id: `R${station.id.substring(1)}_${i + 1}`, // Format: R{station_number}_{robot_number}
          station_id: station.id,
          position: [...station.position] as [number, number] // Copy the position from the station
        });
      }
    });

    return robots;
  };

  // Function to generate the graph from the current elements
  const generateGraph = () => {
    // Create a new graph representation with nodes and edges arrays
    const graph: Graph = {
      nodes: [],
      edges: []
    };
    
    // Generate robots
    const robots = generateRobots();
    
    // Store all nodes for easier iteration
    const allNodes: {id: string, position: [number, number], type: 'pickup' | 'dropoff' | 'robot' | 'navigation', side?: 'left' | 'right' | 'top' | 'bottom', shelf_id?: string}[] = [
      ...elements.pickups.map(p => ({ ...p, type: 'pickup' as const })),
      ...elements.dropoffs.map(d => ({ ...d, type: 'dropoff' as const })),
      ...elements.navigation_points.map(n => ({ ...n, type: 'navigation' as const })),
      ...robots.map(r => ({ ...r, type: 'robot' as const }))
    ];
    
    // Add nodes to the graph
    graph.nodes = allNodes.map(node => ({
      id: node.id,
      type: node.type,
      x: node.position[0],
      y: node.position[1],
      side: node.side,
      shelf_id: node.shelf_id
    }));
    
    // Check if a line segment intersects with any shelf
    const doesLineIntersectShelf = (x1: number, y1: number, x2: number, y2: number): boolean => {
      return elements.shelves.some(shelf => {
        const [sx, sy] = shelf.position;
        const [width, height] = shelf.size;
        
        // Shelf boundaries
        const shelfLeft = sx;
        const shelfRight = sx + width;
        const shelfTop = sy;
        const shelfBottom = sy + height;
        
        // Line equation: y = mx + b
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Handle vertical lines separately
        if (Math.abs(dx) < 0.001) {
          // If vertical line is outside shelf x-bounds, no intersection
          if (x1 < shelfLeft || x1 > shelfRight) return false;
          
          // Check if line segment passes through shelf's y-bounds
          const minY = Math.min(y1, y2);
          const maxY = Math.max(y1, y2);
          return !(maxY < shelfTop || minY > shelfBottom);
        }
        
        const m = dy / dx;
        const b = y1 - m * x1;
        
        // Find intersections with each edge of the shelf
        // Left edge (x = shelfLeft)
        const leftY = m * shelfLeft + b;
        if (leftY >= shelfTop && leftY <= shelfBottom && 
            ((x1 <= shelfLeft && x2 >= shelfLeft) || (x2 <= shelfLeft && x1 >= shelfLeft))) {
          return true;
        }
        
        // Right edge (x = shelfRight)
        const rightY = m * shelfRight + b;
        if (rightY >= shelfTop && rightY <= shelfBottom && 
            ((x1 <= shelfRight && x2 >= shelfRight) || (x2 <= shelfRight && x1 >= shelfRight))) {
          return true;
        }
        
        // Top edge (y = shelfTop)
        const topX = (shelfTop - b) / m;
        if (topX >= shelfLeft && topX <= shelfRight && 
            ((y1 <= shelfTop && y2 >= shelfTop) || (y2 <= shelfTop && y1 >= shelfTop))) {
          return true;
        }
        
        // Bottom edge (y = shelfBottom)
        const bottomX = (shelfBottom - b) / m;
        if (bottomX >= shelfLeft && bottomX <= shelfRight && 
            ((y1 <= shelfBottom && y2 >= shelfBottom) || (y2 <= shelfBottom && y1 >= shelfBottom))) {
          return true;
        }
        
        return false;
      });
    };
    
    // Connect all nodes to each other if the path doesn't intersect with shelves
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const nodeA = allNodes[i];
        const nodeB = allNodes[j];

        let [x1, y1] = nodeA.position;
        let [x2, y2] = nodeB.position;

        if (nodeA.type === 'pickup') {
            if (nodeA.side === 'top') {
                y1 -= 0.05;
            } else if (nodeA.side === 'right') {
                x1 += 0.05;
            } else if (nodeA.side === 'bottom') {
                y1 += 0.05;
            } else if (nodeA.side === 'left') {
                x1 -= 0.05;
            }
        }

        if (nodeB.type === 'pickup') {
            if (nodeB.side === 'top') {
                y2 -= 0.05;
            } else if (nodeB.side === 'right') {
                x2 += 0.05;
            } else if (nodeB.side === 'bottom') {
                y2 += 0.05;
            } else if (nodeB.side === 'left') {
                x2 -= 0.05;
            }
        }

        if (nodeA.type === 'pickup' && nodeB.type === 'pickup') {
            if (nodeA.shelf_id === nodeB.shelf_id) {
                //skip edge
                continue;
            }

            if (nodeA.side === nodeB.side && (nodeA.side === 'top' || nodeA.side === 'bottom')) {
                if (y1 === y2) {
                    //skip edge
                    continue;
                }
            }

            if (nodeA.side === nodeB.side && (nodeA.side === 'left' || nodeA.side === 'right')) {
                if (x1 === x2) {
                    //skip edge
                    continue;
                }
            }

            if ((nodeA.side === 'top' && nodeB.side === 'bottom') || (nodeA.side === 'bottom' && nodeB.side === 'top')) {
                if (y1 === y2) {
                    //skip edge
                    continue;
                }
            }

            
            if ((nodeA.side === 'left' && nodeB.side === 'right') || (nodeA.side === 'right' && nodeB.side === 'left')) {
                if (x1 === x2) {
                    //skip edge
                    continue;
                }
            }

        }
        // Calculate distance for weight
        const weight = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        // Check if the direct path between the nodes intersects any shelf
        if (!doesLineIntersectShelf(x1, y1, x2, y2)) {
          // Add edges in both directions
          graph.edges.push({
            from: nodeA.id,
            to: nodeB.id,
            weight: Math.round(weight * 100) / 100 // Round to 2 decimal places
          });
          
          graph.edges.push({
            from: nodeB.id,
            to: nodeA.id,
            weight: Math.round(weight * 100) / 100 // Round to 2 decimal places
          });
        }
      }
    }

    setGraph(graph);
    return { graph, robots };
  };
  
  // Toggle graph visualization
  const toggleGraphVisualization = () => {
    if (!showGraph) {
      // If we're showing the graph, make sure it's generated
      generateGraph();
    }
    setShowGraph(prev => !prev);
  };

  // Generate JSON output from the current state
  const generateJson = () => {
    const { graph, robots } = generateGraph();
    
    const environmentData = {
      name,
      description,
      dimensions,
      elements: {
        ...elements,
        robots,
        robot_stations: elements.robot_stations.map(station => ({
          ...station,
          robot_count: robotCounts[station.id] || 1 
        }))
      },
      graph
    };
    
    setResultJson(JSON.stringify(environmentData, null, 2));
    return environmentData;
  };

  // Handle dimension changes
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value) || 10;
    setDimensions(prev => ({ ...prev, width }));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value) || 10;
    setDimensions(prev => ({ ...prev, height }));
  };

  // Update elements without triggering the useEffect loop
  const handleElementsChange = (newElements: EnvironmentElements) => {
    if (newElements.shelves !== elements.shelves) {
      // If shelves changed, this will trigger the useEffect to regenerate points
      setElements({
        ...newElements,
        pickups: elements.pickups // Keep the current selected pickups
      });
    } else {
      // If other elements changed, just update the elements
      setElements(newElements);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const environmentData = generateJson();
      
      // Prepare the request payload with required fields
      const payload = {
        name: environmentData.name,
        description: environmentData.description,
        elements: environmentData.elements,
        graph: environmentData.graph,
        dimensions: environmentData.dimensions
      };
      
      console.log('Environment data to submit:', payload);
      
      // Send API request using the apiClient instead of fetch
      const response = await apiClient.post('/environments', payload);
      console.log('API response:', response.data);
      
      // Navigate to the specific environment page after successful creation
      setIsLoading(false);
      navigate(`/environments/${response.data.id}`);
    } catch (error) {
      setError('Failed to create environment. Please try again.');
      console.error('Environment creation error:', error);
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Create Environment with Grid Editor</h1>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
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
                        placeholder="Name of this environment"
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
                        placeholder="Description of this environment"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="width" className="block text-sm font-medium text-gray-300 mb-1">
                          Width <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="width"
                          className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                          value={dimensions.width}
                          onChange={handleWidthChange}
                          min="5"
                          max="50"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-1">
                          Height <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="height"
                          className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                          value={dimensions.height}
                          onChange={handleHeightChange}
                          min="5"
                          max="50"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        type="button"
                        className={`w-full py-2 px-4 rounded-md transition-colors ${showGraph ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                        onClick={toggleGraphVisualization}
                      >
                        {showGraph ? 'Hide Graph' : 'Show Graph'}
                      </button>
                    </div>
                  </div>

                  {elements.robot_stations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-300 mb-2">Robot Stations</h3>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {elements.robot_stations.map(station => (
                          <div key={station.id} className="p-3 border border-gray-700 bg-gray-800/70 rounded-md">
                            <h4 className="font-medium text-gray-200">{station.id}</h4>
                            <p className="text-xs text-gray-400">
                              Position: ({station.position[0]}, {station.position[1]})
                            </p>
                            <div className="mt-2">
                              <label htmlFor={`robots-${station.id}`} className="block text-xs font-medium text-gray-300 mb-1">
                                Robots
                              </label>
                              <input
                                type="number"
                                id={`robots-${station.id}`}
                                className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-1 px-2 text-white text-sm"
                                value={robotCounts[station.id] || 1}
                                onChange={(e) => handleRobotCountChange(station.id, parseInt(e.target.value) || 1)}
                                min="1"
                                max="10"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="h-[calc(100vh-320px)] min-h-[600px] border border-black rounded-lg overflow-hidden bg-gray-400/70 text-gray-900">
                  <GridEditor 
                    dimensions={dimensions}
                    elements={{
                      ...elements,
                      // Pass all pickup points but mark which ones are selected
                      allPickupPoints,
                      selectedPickupIds
                    } as any}
                    onElementsChange={handleElementsChange}
                    onPickupToggle={togglePickupSelection}
                    showGraph={showGraph}
                    graph={graph}
                  />
                </div>
              </div>
              
              {/* Pickup Points Display */}
              {allPickupPoints.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-300">Pickup Points</h3>
                    <span className="text-sm text-gray-400">
                      {selectedPickupIds.size} of {allPickupPoints.length} points selected
                    </span>
                  </div>
                  <div className="p-4 bg-gray-800/70 border border-gray-700/50 rounded-md">
                    <p className="text-sm text-gray-400 mb-2">
                      Click on pickup points around shelves to select/deselect them. 
                      Only selected pickup points will be included in the environment.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-xs transition-colors"
                        onClick={() => setSelectedPickupIds(new Set(allPickupPoints.map(p => p.id)))}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-xs transition-colors"
                        onClick={() => setSelectedPickupIds(new Set())}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* <div className="mt-6">
                <button
                  type="button"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                  onClick={generateJson}
                >
                  Generate JSON & Graph
                </button>
              </div> */}
              
              {resultJson && (
                <div className="mt-4">
                  <label htmlFor="result" className="block text-sm font-medium text-gray-300 mb-1 hidden">
                    Environment JSON
                  </label>
                  <textarea
                    id="result"
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md py-2 px-4 text-white font-mono h-64 hidden"
                    value={resultJson}
                    readOnly
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => navigate('/environments')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors relative overflow-hidden group"
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
                        Creating...
                      </span>
                    ) : 'Create Environment'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}; 