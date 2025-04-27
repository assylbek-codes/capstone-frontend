import { useState, useRef, useEffect } from 'react';
import { Dimensions, EnvironmentElements, Graph, Pickup } from '../../types';

interface GridEditorProps {
  dimensions: Dimensions;
  elements: EnvironmentElements & {
    allPickupPoints?: Pickup[];
    selectedPickupIds?: Set<string>;
  };
  onElementsChange: (elements: EnvironmentElements) => void;
  onPickupToggle?: (pickupId: string) => void;
  showGraph?: boolean;
  graph?: Graph;
  isReadOnly?: boolean;
  initialZoom?: number;
}

// Define tool types for the editor
type ToolType = 'select' | 'shelf' | 'dropoff' | 'robot_station' | 'erase' | 'pickup_select';

export const GridEditor = ({ 
  dimensions, 
  elements, 
  onElementsChange, 
  onPickupToggle,
  showGraph = false,
  graph = { nodes: [], edges: [] },
  isReadOnly = false,
  initialZoom = 1
}: GridEditorProps) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [gridSize, setGridSize] = useState({ width: 20, height: 20 }); // Pixels per grid cell
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState<[number, number] | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for panning (used both in read-only mode and with select tool)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState<{ x: number, y: number } | null>(null);
  
  // State for zooming
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const minZoom = 0.5;
  const maxZoom = 2.5;
  const zoomStep = 0.1;
  
  // Initialize zoomLevel from initialZoom prop when it changes
  useEffect(() => {
    setZoomLevel(initialZoom);
  }, [initialZoom]);
  
  // Initialize the canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas width and height to match container dimensions
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Calculate grid size based on dimensions and canvas size
    const cellWidth = canvas.width / dimensions.width;
    const cellHeight = canvas.height / dimensions.height;
    
    // Set a minimum size for grid cells
    const minSize = 25; // Minimum 25px per grid cell
    const newGridSize = {
      width: Math.max(cellWidth, minSize) * zoomLevel,
      height: Math.max(cellHeight, minSize) * zoomLevel
    };
    setGridSize(newGridSize);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply pan transformations (in both modes)
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    // Calculate total grid dimensions
    const totalGridWidth = dimensions.width * newGridSize.width;
    const totalGridHeight = dimensions.height * newGridSize.height;
    
    // Center the grid in the available canvas space
    const offsetX = (canvas.width - totalGridWidth) / 2;
    const offsetY = (canvas.height - totalGridHeight) / 2;
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= dimensions.width; x++) {
      const xPos = offsetX + x * newGridSize.width;
      ctx.beginPath();
      ctx.moveTo(xPos, offsetY);
      ctx.lineTo(xPos, offsetY + totalGridHeight);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= dimensions.height; y++) {
      const yPos = offsetY + y * newGridSize.height;
      ctx.beginPath();
      ctx.moveTo(offsetX, yPos);
      ctx.lineTo(offsetX + totalGridWidth, yPos);
      ctx.stroke();
    }
    
    // Draw elements
    
    // Draw shelves
    ctx.fillStyle = '#3B82F6'; // Primary blue
    elements.shelves.forEach((shelf) => {
      const [x, y] = shelf.position;
      const [width, height] = shelf.size;
      ctx.fillRect(
        offsetX + x * newGridSize.width,
        offsetY + y * newGridSize.height,
        width * newGridSize.width,
        height * newGridSize.height
      );
      
      // Draw shelf label
      ctx.fillStyle = 'white';
      ctx.font = `12px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        shelf.id,
        offsetX + (x + width / 2) * newGridSize.width,
        offsetY + (y + height / 2) * newGridSize.height
      );
      ctx.fillStyle = '#3B82F6'; // Reset fill color
    });
    
    // Draw dropoffs
    ctx.fillStyle = '#10B981'; // Secondary green
    elements.dropoffs.forEach((dropoff) => {
      const [x, y] = dropoff.position;
      const radius = 0.4 * Math.min(newGridSize.width, newGridSize.height);
      
      ctx.beginPath();
      ctx.arc(
        offsetX + (x + 0.5) * newGridSize.width,
        offsetY + (y + 0.5) * newGridSize.height,
        radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      // Draw dropoff label
      ctx.fillStyle = 'white';
      ctx.font = `12px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        dropoff.id,
        offsetX + (x + 0.5) * newGridSize.width,
        offsetY + (y + 0.5) * newGridSize.height
      );
      ctx.fillStyle = '#10B981'; // Reset fill color
    });
    
    // Draw all pickup points (both selected and unselected)
    const { allPickupPoints, selectedPickupIds } = elements;
    if (allPickupPoints && allPickupPoints.length > 0) {
      allPickupPoints.forEach((pickup) => {
        const [x, y] = pickup.position;
        const size = 0.2 * Math.min(newGridSize.width, newGridSize.height);
        
        // Use different colors for selected vs unselected pickup points
        // Check if selectedPickupIds is a Set, array, or single value
        let isSelected = false;
        
        if (selectedPickupIds) {
          if (selectedPickupIds instanceof Set) {
            isSelected = selectedPickupIds.has(pickup.id);
          } else if (typeof selectedPickupIds === 'string') {
            isSelected = selectedPickupIds === pickup.id;
          }
        }
            
        if (isSelected) {
          // Selected points - bright pink
          ctx.fillStyle = '#EC4899';
        } else {
          // Unselected points - lighter pink with transparency
          ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
        }
        
        // Draw at the grid intersection point
        ctx.beginPath();
        ctx.arc(
          offsetX + x * newGridSize.width,
          offsetY + y * newGridSize.height,
          size,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });
    }
    
    // Draw robot stations
    ctx.fillStyle = '#F59E0B'; // Accent amber
    elements.robot_stations.forEach((station) => {
      const [x, y] = station.position;
      const cellWidth = newGridSize.width;
      const cellHeight = newGridSize.height;
      
      ctx.beginPath();
      ctx.moveTo(offsetX + (x + 0.5) * cellWidth, offsetY + (y + 0.1) * cellHeight);
      ctx.lineTo(offsetX + (x + 0.9) * cellWidth, offsetY + (y + 0.5) * cellHeight);
      ctx.lineTo(offsetX + (x + 0.5) * cellWidth, offsetY + (y + 0.9) * cellHeight);
      ctx.lineTo(offsetX + (x + 0.1) * cellWidth, offsetY + (y + 0.5) * cellHeight);
      ctx.closePath();
      ctx.fill();
      
      // Draw station label
      ctx.fillStyle = 'white';
      ctx.font = `12px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Show station ID and robot count if available
      const robotCount = station.robot_count || 1;
      ctx.fillText(
        `${station.id} (${robotCount})`,
        offsetX + (x + 0.5) * cellWidth,
        offsetY + (y + 0.5) * cellHeight
      );
      ctx.fillStyle = '#F59E0B'; // Reset fill color
    });
    
    // Draw navigation points
    ctx.fillStyle = '#4F46E5'; // Indigo color for navigation points
    elements.navigation_points?.forEach((navPoint) => {
      const [x, y] = navPoint.position;
      const size = 0.2 * Math.min(newGridSize.width, newGridSize.height);
      
      // Draw as circles
      ctx.beginPath();
      ctx.arc(
        offsetX + x * newGridSize.width,
        offsetY + y * newGridSize.height,
        size,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
    
    // Draw graph connections if showGraph is true
    if (showGraph && graph.nodes && graph.edges) {
      // Draw edges first so they appear behind nodes
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.7)'; // Gray with transparency
      ctx.lineWidth = 1.5;
      
      graph.edges.forEach(edge => {
        // Find the source and target nodes
        const sourceNode = graph.nodes.find(node => node.id === edge.from);
        const targetNode = graph.nodes.find(node => node.id === edge.to);
        
        if (sourceNode && targetNode) {
          // Draw a line between the nodes
          ctx.beginPath();
          ctx.moveTo(
            offsetX + sourceNode.x * newGridSize.width,
            offsetY + sourceNode.y * newGridSize.height
          );
          ctx.lineTo(
            offsetX + targetNode.x * newGridSize.width,
            offsetY + targetNode.y * newGridSize.height
          );
          ctx.stroke();
          
          // Draw the weight value at the middle of the edge
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.font = `10px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            edge.weight.toString(),
            offsetX + midX * newGridSize.width,
            offsetY + midY * newGridSize.height
          );
        }
      });
    }
    
    // Draw current selection if dragging
    if (isDragging && startPosition && currentPosition) {
      // Determine stroke color based on placement validity
      ctx.strokeStyle = isValidPlacement ? '#3B82F6' : '#EF4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      const minX = Math.min(startPosition[0], currentPosition[0]);
      const minY = Math.min(startPosition[1], currentPosition[1]);
      const width = Math.abs(currentPosition[0] - startPosition[0]);
      const height = Math.abs(currentPosition[1] - startPosition[1]);
      
      const startX = offsetX + minX * newGridSize.width;
      const startY = offsetY + minY * newGridSize.height;
      const rectWidth = width * newGridSize.width;
      const rectHeight = height * newGridSize.height;
      
      ctx.strokeRect(startX, startY, rectWidth, rectHeight);
      
      // Add semi-transparent fill for invalid placements
      if (!isValidPlacement) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(startX, startY, rectWidth, rectHeight);
      }
      
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  }, [dimensions, elements, isDragging, startPosition, currentPosition, showGraph, graph, panOffset, isReadOnly, isValidPlacement, zoomLevel]);
  
  // Apply pan offset in both edit and read-only modes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas width and height to match container dimensions
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Calculate grid size based on dimensions and canvas size
    const cellWidth = canvas.width / dimensions.width;
    const cellHeight = canvas.height / dimensions.height;
    
    // Set a minimum size for grid cells
    const minSize = 25; // Minimum 25px per grid cell
    const newGridSize = {
      width: Math.max(cellWidth, minSize) * zoomLevel,
      height: Math.max(cellHeight, minSize) * zoomLevel
    };
    setGridSize(newGridSize);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply pan transformations (in both modes)
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    // Calculate total grid dimensions
    const totalGridWidth = dimensions.width * newGridSize.width;
    const totalGridHeight = dimensions.height * newGridSize.height;
    
    // Center the grid in the available canvas space
    const offsetX = (canvas.width - totalGridWidth) / 2;
    const offsetY = (canvas.height - totalGridHeight) / 2;
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= dimensions.width; x++) {
      const xPos = offsetX + x * newGridSize.width;
      ctx.beginPath();
      ctx.moveTo(xPos, offsetY);
      ctx.lineTo(xPos, offsetY + totalGridHeight);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= dimensions.height; y++) {
      const yPos = offsetY + y * newGridSize.height;
      ctx.beginPath();
      ctx.moveTo(offsetX, yPos);
      ctx.lineTo(offsetX + totalGridWidth, yPos);
      ctx.stroke();
    }
    
    // Draw elements
    
    // Draw shelves
    ctx.fillStyle = '#3B82F6'; // Primary blue
    elements.shelves.forEach((shelf) => {
      const [x, y] = shelf.position;
      const [width, height] = shelf.size;
      ctx.fillRect(
        offsetX + x * newGridSize.width,
        offsetY + y * newGridSize.height,
        width * newGridSize.width,
        height * newGridSize.height
      );
      
      // Draw shelf label
      ctx.fillStyle = 'white';
      ctx.font = `12px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        shelf.id,
        offsetX + (x + width / 2) * newGridSize.width,
        offsetY + (y + height / 2) * newGridSize.height
      );
      ctx.fillStyle = '#3B82F6'; // Reset fill color
    });
    
    // Draw dropoffs
    ctx.fillStyle = '#10B981'; // Secondary green
    elements.dropoffs.forEach((dropoff) => {
      const [x, y] = dropoff.position;
      const radius = 0.4 * Math.min(newGridSize.width, newGridSize.height);
      
      ctx.beginPath();
      ctx.arc(
        offsetX + (x) * newGridSize.width,
        offsetY + (y) * newGridSize.height,
        radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      // Draw dropoff label
      ctx.fillStyle = 'white';
      ctx.font = `12px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        dropoff.id,
        offsetX + (x) * newGridSize.width,
        offsetY + (y) * newGridSize.height
      );
      ctx.fillStyle = '#10B981'; // Reset fill color
    });
    
    // Draw all pickup points (both selected and unselected)
    const { allPickupPoints, selectedPickupIds } = elements;
    if (allPickupPoints && allPickupPoints.length > 0) {
      allPickupPoints.forEach((pickup) => {
        const [x, y] = pickup.position;
        const size = 0.2 * Math.min(newGridSize.width, newGridSize.height);
        
        // Use different colors for selected vs unselected pickup points
        // Check if selectedPickupIds is a Set, array, or single value
        let isSelected = false;
        
        if (selectedPickupIds) {
          if (selectedPickupIds instanceof Set) {
            isSelected = selectedPickupIds.has(pickup.id);
          } else if (typeof selectedPickupIds === 'string') {
            isSelected = selectedPickupIds === pickup.id;
          }
        }
            
        if (isSelected) {
          // Selected points - bright pink
          ctx.fillStyle = '#EC4899';
        } else {
          // Unselected points - lighter pink with transparency
          ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
        }
        
        // Draw at the grid intersection point
        ctx.beginPath();
        ctx.arc(
          offsetX + x * newGridSize.width,
          offsetY + y * newGridSize.height,
          size,
          0,
          2 * Math.PI
        );
        ctx.fill();
      });
    }
    
    // Draw robot stations
    ctx.fillStyle = '#F59E0B'; // Accent amber
    elements.robot_stations.forEach((station) => {
      const [x, y] = station.position;
      const cellWidth = newGridSize.width;
      const cellHeight = newGridSize.height;
      
      ctx.beginPath();
      ctx.moveTo(offsetX + (x) * cellWidth, offsetY + (y - 0.4) * cellHeight);
      ctx.lineTo(offsetX + (x + 0.4) * cellWidth, offsetY + (y) * cellHeight);
      ctx.lineTo(offsetX + (x) * cellWidth, offsetY + (y + 0.4) * cellHeight);
      ctx.lineTo(offsetX + (x - 0.4) * cellWidth, offsetY + (y) * cellHeight);
      ctx.closePath();
      ctx.fill();
      
      // Draw station label
      ctx.fillStyle = 'white';
      ctx.font = `12px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Show station ID and robot count if available
      const robotCount = station.robot_count || 1;
      ctx.fillText(
        `${station.id} (${robotCount})`,
        offsetX + (x) * cellWidth,
        offsetY + (y) * cellHeight
      );
      ctx.fillStyle = '#F59E0B'; // Reset fill color
    });
    
    // Draw navigation points
    ctx.fillStyle = '#4F46E5'; // Indigo color for navigation points
    elements.navigation_points?.forEach((navPoint) => {
      const [x, y] = navPoint.position;
      const size = 0.2 * Math.min(newGridSize.width, newGridSize.height);
      
      // Draw as circles
      ctx.beginPath();
      ctx.arc(
        offsetX + x * newGridSize.width,
        offsetY + y * newGridSize.height,
        size,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
    
    // Draw graph connections if showGraph is true
    if (showGraph && graph.nodes && graph.edges) {
      // Draw edges first so they appear behind nodes
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.7)'; // Gray with transparency
      ctx.lineWidth = 1.5;
      
      graph.edges.forEach(edge => {
        // Find the source and target nodes
        const sourceNode = graph.nodes.find(node => node.id === edge.from);
        const targetNode = graph.nodes.find(node => node.id === edge.to);
        
        if (sourceNode && targetNode) {
          // Draw a line between the nodes
          ctx.beginPath();
          ctx.moveTo(
            offsetX + sourceNode.x * newGridSize.width,
            offsetY + sourceNode.y * newGridSize.height
          );
          ctx.lineTo(
            offsetX + targetNode.x * newGridSize.width,
            offsetY + targetNode.y * newGridSize.height
          );
          ctx.stroke();
          
          // Draw the weight value at the middle of the edge
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.font = `10px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            edge.weight.toString(),
            offsetX + midX * newGridSize.width,
            offsetY + midY * newGridSize.height
          );
        }
      });
    }
    
    // Draw current selection if dragging
    if (isDragging && startPosition && currentPosition) {
      // Determine stroke color based on placement validity
      ctx.strokeStyle = isValidPlacement ? '#3B82F6' : '#EF4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      const minX = Math.min(startPosition[0], currentPosition[0]);
      const minY = Math.min(startPosition[1], currentPosition[1]);
      const width = Math.abs(currentPosition[0] - startPosition[0]);
      const height = Math.abs(currentPosition[1] - startPosition[1]);
      
      const startX = offsetX + minX * newGridSize.width;
      const startY = offsetY + minY * newGridSize.height;
      const rectWidth = width * newGridSize.width;
      const rectHeight = height * newGridSize.height;
      
      ctx.strokeRect(startX, startY, rectWidth, rectHeight);
      
      // Add semi-transparent fill for invalid placements
      if (!isValidPlacement) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(startX, startY, rectWidth, rectHeight);
      }
      
      ctx.setLineDash([]);
    }
    
    ctx.restore();
  }, [dimensions, elements, isDragging, startPosition, currentPosition, showGraph, graph, panOffset, isReadOnly, isValidPlacement, zoomLevel]);
  
  // Modify the canvasToGrid function to account for panning in both modes
  const canvasToGrid = (canvasX: number, canvasY: number): [number, number] => {
    if (!canvasRef.current) return [0, 0];
    
    const canvas = canvasRef.current;
    
    // Calculate grid dimensions and offset
    const totalGridWidth = dimensions.width * gridSize.width;
    const totalGridHeight = dimensions.height * gridSize.height;
    const offsetX = (canvas.width - totalGridWidth) / 2;
    const offsetY = (canvas.height - totalGridHeight) / 2;
    
    // Always adjust for pan offset (in both modes)
    const adjustedX = canvasX - panOffset.x;
    const adjustedY = canvasY - panOffset.y;
    
    // Convert to grid coordinates
    const gridX = Math.floor((adjustedX - offsetX) / gridSize.width);
    const gridY = Math.floor((adjustedY - offsetY) / gridSize.height);
    
    return [gridX, gridY];
  };
  
  // Update the handlePickupClick to work with pan offset in both modes
  const handlePickupClick = (clickX: number, clickY: number) => {
    if (!canvasRef.current || !onPickupToggle) return;
    
    const canvas = canvasRef.current;
    
    // Calculate grid dimensions and offset
    const totalGridWidth = dimensions.width * gridSize.width;
    const totalGridHeight = dimensions.height * gridSize.height;
    const offsetX = (canvas.width - totalGridWidth) / 2;
    const offsetY = (canvas.height - totalGridHeight) / 2;
    
    // Always adjust for pan offset
    const adjustedX = clickX - panOffset.x;
    const adjustedY = clickY - panOffset.y;
    
    const { allPickupPoints } = elements;
    if (!allPickupPoints) return;
    
    // Check if click is near a pickup point
    for (const pickup of allPickupPoints) {
      const [px, py] = pickup.position;
      const canvasPickupX = offsetX + px * gridSize.width;
      const canvasPickupY = offsetY + py * gridSize.height;
      
      // Calculate distance from click to pickup
      const distance = Math.sqrt(
        Math.pow(adjustedX - canvasPickupX, 2) + 
        Math.pow(adjustedY - canvasPickupY, 2)
      );
      
      // If click is close enough to a pickup point, toggle it
      const clickThreshold = 0.3 * Math.min(gridSize.width, gridSize.height);
      if (distance <= clickThreshold) {
        onPickupToggle(pickup.id);
        return;
      }
    }
  };
  
  // Handle starting panning in both modes
  const handlePanStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsPanning(true);
    setLastPanPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  
  // Handle panning in both modes
  const handlePanMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isPanning || !lastPanPosition) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // Calculate the amount to pan
    const dx = currentX - lastPanPosition.x;
    const dy = currentY - lastPanPosition.y;
    
    // Update pan offset
    setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    
    // Update last position
    setLastPanPosition({ x: currentX, y: currentY });
  };
  
  // Handle ending panning in both modes
  const handlePanEnd = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsPanning(false);
    setLastPanPosition(null);
  };
  
  // Modify the mouse event handlers to handle the select tool for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isReadOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // If select tool is active, use it for panning
    if (selectedTool === 'select') {
      handlePanStart(e);
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (selectedTool === 'pickup_select') {
      handlePickupClick(mouseX, mouseY);
      return;
    }
    
    // Get grid coordinates for the click
    const [gridX, gridY] = canvasToGrid(mouseX, mouseY);
    
    // Start dragging if within grid bounds
    if (gridX >= 0 && gridX < dimensions.width && gridY >= 0 && gridY < dimensions.height) {
      setIsDragging(true);
      setStartPosition([gridX, gridY]);
      setCurrentPosition([gridX, gridY]);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isReadOnly) return;
    
    // If panning with select tool
    if (selectedTool === 'select' && isPanning) {
      handlePanMove(e);
      return;
    }
    
    if (!isDragging || !startPosition) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Get grid coordinates for the current mouse position
    const [gridX, gridY] = canvasToGrid(mouseX, mouseY);
    
    // Update current position if within grid bounds
    if (gridX >= 0 && gridX < dimensions.width && gridY >= 0 && gridY < dimensions.height) {
      setCurrentPosition([gridX, gridY]);
      
      // Check if the current placement is valid
      if (selectedTool === 'shelf') {
        const minX = Math.min(startPosition[0], gridX);
        const minY = Math.min(startPosition[1], gridY);
        const width = Math.abs(gridX - startPosition[0]);
        const height = Math.abs(gridY - startPosition[1]);
        
        setIsValidPlacement(
          width > 0 && 
          height > 0 && 
          isPositionValid(minX, minY, width, height)
        );
      } else if (selectedTool === 'dropoff' || selectedTool === 'robot_station') {
        setIsValidPlacement(isPositionValid(gridX, gridY));
      } else {
        setIsValidPlacement(true);
      }
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If panning with select tool
    if (selectedTool === 'select' || isReadOnly) {
      handlePanEnd(e);
      return;
    }
    
    if (!isDragging || !startPosition || !currentPosition) {
      setIsDragging(false);
      return;
    }
    
    // Create new element based on selected tool
    if (selectedTool === 'shelf') {
      // Create a new shelf
      const minX = Math.min(startPosition[0], currentPosition[0]);
      const minY = Math.min(startPosition[1], currentPosition[1]);
      const width = Math.abs(currentPosition[0] - startPosition[0]);
      const height = Math.abs(currentPosition[1] - startPosition[1]);

      if (width === 0 || height === 0 || !isValidPlacement) {
        setIsDragging(false);
        setStartPosition(null);
        setCurrentPosition(null);
        return;
      }
      
      const newShelf = {
        id: `S${elements.shelves.length + 1}`,
        position: [minX, minY] as [number, number],
        size: [width, height] as [number, number]
      };
      
      onElementsChange({
        ...elements,
        shelves: [...elements.shelves, newShelf],
        robots: elements.robots || [],
        navigation_points: elements.navigation_points || []
      });
    } else if (selectedTool === 'dropoff') {
      // Get the target position
      const [x, y] = [currentPosition[0] + 0.5, currentPosition[1] + 0.5];
      
      if (!isValidPlacement) {
        setIsDragging(false);
        setStartPosition(null);
        setCurrentPosition(null);
        return;
      }
      
      // Create a new dropoff at the current position
      const newDropoff = {
        id: `D${elements.dropoffs.length + 1}`,
        position: [x, y] as [number, number]
      };
      
      onElementsChange({
        ...elements,
        dropoffs: [...elements.dropoffs, newDropoff],
        robots: elements.robots || [],
        navigation_points: elements.navigation_points || []
      });
    } else if (selectedTool === 'robot_station') {
      // Get the target position
      const [x, y] = [currentPosition[0] + 0.5, currentPosition[1] + 0.5];
      
      if (!isValidPlacement) {
        setIsDragging(false);
        setStartPosition(null);
        setCurrentPosition(null);
        return;
      }
      
      // Create a new robot station at the current position
      const newStation = {
        id: `R${elements.robot_stations.length + 1}`,
        position: [x, y] as [number, number]
      };
      
      onElementsChange({
        ...elements,
        robot_stations: [...elements.robot_stations, newStation],
        robots: elements.robots || [],
        navigation_points: elements.navigation_points || []
      });
    } else if (selectedTool === 'erase') {
      // Implement erasing elements (simplified version)
      const minX = Math.min(startPosition[0], currentPosition[0]);
      const minY = Math.min(startPosition[1], currentPosition[1]);
      const maxX = Math.max(startPosition[0], currentPosition[0]);
      const maxY = Math.max(startPosition[1], currentPosition[1]);
      
      // Filter out elements that intersect with the eraser rectangle
      const newShelves = elements.shelves.filter((shelf) => {
        const [x, y] = shelf.position;
        const [width, height] = shelf.size;
        return (
          x + width <= minX ||
          x >= maxX + 1 ||
          y + height <= minY ||
          y >= maxY + 1
        );
      });
      
      const newDropoffs = elements.dropoffs.filter((dropoff) => {
        const [x, y] = dropoff.position;
        return x < minX || x > maxX || y < minY || y > maxY;
      });
      
      const newStations = elements.robot_stations.filter((station) => {
        const [x, y] = station.position;
        return x < minX || x > maxX || y < minY || y > maxY;
      });
      
      onElementsChange({
        shelves: newShelves,
        dropoffs: newDropoffs,
        robot_stations: newStations,
        pickups: [],
        robots: [],
        navigation_points: []
      });
    }
    
    setIsDragging(false);
    setStartPosition(null);
    setCurrentPosition(null);
    setIsValidPlacement(true);
  };
  
  // Check if a position is valid for placement
  const isPositionValid = (x: number, y: number, width = 1, height = 1): boolean => {
    // For dropoff and robot station
    if (width === 1 && height === 1) {
      return !elements.shelves.some(shelf => {
        const [sx, sy] = shelf.position;
        const [sw, sh] = shelf.size;
        return (
          x >= sx && x < sx + sw &&
          y >= sy && y < sy + sh
        );
      });
    }
    
    // For shelves
    return !elements.shelves.some(shelf => {
      const [sx, sy] = shelf.position;
      const [sw, sh] = shelf.size;
      
      // Check for intersection between rectangles
      return !(
        x + width <= sx || // New shelf is to the left of existing shelf
        x >= sx + sw ||    // New shelf is to the right of existing shelf
        y + height <= sy || // New shelf is above existing shelf
        y >= sy + sh        // New shelf is below existing shelf
      );
    });
  };
  
  // Handle zooming in
  const handleZoomIn = () => {
    if (zoomLevel < maxZoom) {
      setZoomLevel(prev => {
        const newZoom = Math.min(prev + zoomStep, maxZoom);
        console.log(`Zooming in: ${prev} → ${newZoom}`);
        return newZoom;
      });
    }
  };

  // Handle zooming out
  const handleZoomOut = () => {
    if (zoomLevel > minZoom) {
      setZoomLevel(prev => {
        const newZoom = Math.max(prev - zoomStep, minZoom);
        console.log(`Zooming out: ${prev} → ${newZoom}`);
        return newZoom;
      });
    }
  };
  
  return (
    <div 
      className="relative w-full h-full overflow-hidden border rounded-md" 
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      {!isReadOnly && (
        <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 p-3 rounded-md shadow-sm">
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              className={`p-2 rounded-md flex items-center ${selectedTool === 'select' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTool('select');
              }}
              title="Pan Tool"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5l0 14M5 12l14 0" />
                <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
              </svg>
              <span className="text-sm">Pan View</span>
            </button>
            
            <button
            type="button"
              className={`p-2 rounded-md flex items-center ${selectedTool === 'shelf' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTool('shelf');
              }}
              title="Add Shelf"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <span className="text-sm">Add Shelf</span>
            </button>
            
            <button
              type="button"
              className={`p-2 rounded-md flex items-center ${selectedTool === 'dropoff' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTool('dropoff');
              }}
              title="Add Dropoff Point"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-sm">Add Dropoff</span>
            </button>
            
            <button
              type="button"
              className={`p-2 rounded-md flex items-center ${selectedTool === 'robot_station' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTool('robot_station');
              }}
              title="Add Robot Station"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4L20 12L12 20L4 12L12 4Z" />
              </svg>
              <span className="text-sm">Add Robot Station</span>
            </button>
            
            <button
              type="button"
              className={`p-2 rounded-md flex items-center ${selectedTool === 'pickup_select' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTool('pickup_select');
              }}
              title="Select Pickup Points"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span className="text-sm">Select Pickups</span>
            </button>
            
            <button
              type="button"
              className={`p-2 rounded-md flex items-center ${selectedTool === 'erase' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTool('erase');
              }}
              title="Erase"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 14l4-4l-8-8l-9 9l8 8" />
                <path d="M4 20h16" />
              </svg>
              <span className="text-sm">Erase</span>
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="absolute bottom-4 right-4 z-10 bg-white bg-opacity-80 p-2 rounded-md shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-2">
          <button
            className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              setPanOffset({ x: 0, y: 0 });
              setZoomLevel(1);
            }}
            title="Reset View"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
              <path d="M12 8v4l2 2" />
            </svg>
          </button>
          
          <button
            type="button"
            className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            title="Zoom Out"
            disabled={zoomLevel <= minZoom}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
          
          <div className="text-xs text-gray-600">
            {Math.round(zoomLevel * 100)}%
          </div>
          
          <button
            type="button"
            className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            title="Zoom In"
            disabled={zoomLevel >= maxZoom}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={isReadOnly || selectedTool === 'select' ? handlePanStart : handleMouseDown}
        onMouseMove={isReadOnly || selectedTool === 'select' ? handlePanMove : handleMouseMove}
        onMouseUp={isReadOnly || selectedTool === 'select' ? handlePanEnd : handleMouseUp}
        onMouseLeave={isReadOnly || selectedTool === 'select' ? handlePanEnd : handleMouseUp}
        className={`w-full h-full ${isReadOnly || selectedTool === 'select' ? 'cursor-move' : 'cursor-crosshair'}`}
      />
    </div>
  );
}; 