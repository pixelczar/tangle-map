/**
 * Node Layer - Connection points with radiating lines
 * Represents key intersection and decision points in complex systems
 */

import { BaseLayer } from './BaseLayer.js';

export class NodeLayer extends BaseLayer {
  constructor() {
    super('nodes', 0);
    this.nodeColor = 'rgba(30, 80, 120, 0.8)';
    this.connectionColor = 'rgba(30, 80, 120, 1.0)';
    this.nodeLineWidth = 1;
    this.connectionLineWidth = 0.8;
  }

  generateData(params) {
    const { clusters, random, width, height, padding } = params;
    
    const data = {
      nodes: [],
      terminalPoints: []
    };

    clusters.forEach(cluster => {
      const nodeCount = Math.floor(cluster.intensity * 6); // Reduced from 12 to 6
      
      for (let i = 0; i < nodeCount; i++) {
        const angle = random.randomAngle();
        const distance = random.random() * cluster.radius * 0.7;
        const x = cluster.x + Math.cos(angle) * distance;
        const y = cluster.y + Math.sin(angle) * distance;
        const radius = (2.5 + random.random() * 4.5) * cluster.intensity; // larger nodes
        const connections = Math.floor(2 + random.random() * 3); // Reduced connections
        
        const node = {
          x, y, radius, connections, clusterId: cluster.id,
          inBounds: this.isInBounds(x, y, width, height, padding),
          connectionLines: []
        };

        // Generate connection lines for this node
        for (let j = 0; j < connections; j++) {
          const shouldDraw = random.random() > 0.6;
          const connAngle = (j / connections) * Math.PI * 2 + random.random() * 0.3;
          const length = (18 + random.random() * 42) * cluster.intensity;
          const endX = x + Math.cos(connAngle) * length;
          const endY = y + Math.sin(connAngle) * length;
          
          node.connectionLines.push({
            endX, endY, shouldDraw
          });
          
          data.terminalPoints.push({ x: endX, y: endY });
        }
        
        data.nodes.push(node);
      }
    });

    return data;
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    const nodeScale = transform3D.getScale(this.zIndex, time, is3D);
    
    data.nodes.forEach(node => {
      if (!node.inBounds) return;
      
      this.renderNode(ctx, node, { transform3D, time, is3D, nodeScale });
      this.renderNodeConnections(ctx, node, { transform3D, time, is3D, nodeScale });
    });
  }

  renderNode(ctx, node, { transform3D, time, is3D, nodeScale }) {
    const pos = transform3D.transform(node.x, node.y, this.zIndex, time, is3D);
    
    // Fill the node
    this.setFillStyle(ctx, this.nodeColor);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, node.radius * nodeScale, 0, Math.PI * 2);
    ctx.fill();
    
    // Stroke the node outline
    this.setLineStyle(ctx, this.connectionColor, this.nodeLineWidth * nodeScale);
    ctx.stroke();
  }

  renderNodeConnections(ctx, node, { transform3D, time, is3D, nodeScale }) {
    this.setLineStyle(ctx, this.connectionColor, this.connectionLineWidth * nodeScale);
    
    const nodePos = transform3D.transform(node.x, node.y, this.zIndex, time, is3D);
    
    node.connectionLines.forEach(connection => {
      if (!connection.shouldDraw) return;
      
      const endPos = transform3D.transform(connection.endX, connection.endY, this.zIndex, time, is3D);
      
      ctx.beginPath();
      ctx.moveTo(nodePos.x, nodePos.y);
      ctx.lineTo(endPos.x, endPos.y);
      ctx.stroke();
    });
  }

  // Helper method to get all nodes within a cluster
  getNodesInCluster(data, clusterId) {
    return data.nodes.filter(node => node.clusterId === clusterId);
  }

  // Helper method to find closest node to a point
  findClosestNode(data, x, y, maxDistance = 50) {
    let closest = null;
    let minDistance = Infinity;
    
    data.nodes.forEach(node => {
      if (!node.inBounds) return;
      
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance;
        closest = node;
      }
    });
    
    return closest;
  }

  // Configuration methods
  setNodeColor(color) {
    this.nodeColor = color;
  }

  setConnectionColor(color) {
    this.connectionColor = color;
  }

  setLineWidths(node, connection) {
    this.nodeLineWidth = node;
    this.connectionLineWidth = connection;
  }

  // Method to get node statistics
  getNodeStats(data) {
    return {
      totalNodes: data.nodes.length,
      totalConnections: data.nodes.reduce((sum, node) => sum + node.connections, 0),
      averageRadius: data.nodes.reduce((sum, node) => sum + node.radius, 0) / data.nodes.length || 0,
      inBoundsNodes: data.nodes.filter(node => node.inBounds).length
    };
  }
}
