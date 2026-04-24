// Server Setup
const express = require("express");
const app = express();
const cors = require("cors");

// Middleware
app.use(cors());
app.use(express.json());

// Main graph processing route
app.post("/bfhl", (req, res) => {
  try {
    const payload = req.body.data;
    
    // Validate payload
    if (!payload || !Array.isArray(payload)) {
      return res.status(400).json({ is_success: false, message: "Expected data array" });
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    
    const edgeHistory = new Set();
    const parentLookup = new Map();
    const adjacencyGraph = new Map();
    const uniqueVertices = new Set();

    // Iterate through inputs
    for (let i = 0; i < payload.length; i++) {
      const currentItem = payload[i];
      
      if (typeof currentItem !== "string") {
        invalid_entries.push(String(currentItem));
        continue;
      }
      
      const cleanString = currentItem.trim();
      
      // Node validation regex check
      const formatCheck = /^([A-Z])->([A-Z])$/.exec(cleanString);
      
      if (!formatCheck || formatCheck[1] === formatCheck[2]) {
        invalid_entries.push(cleanString || '""');
        continue;
      }

      const sourceNode = formatCheck[1];
      const targetNode = formatCheck[2];

      // Handle repeated edges
      if (edgeHistory.has(cleanString)) {
        if (duplicate_edges.indexOf(cleanString) === -1) {
          duplicate_edges.push(cleanString);
        }
        continue;
      }
      edgeHistory.add(cleanString);

      // Enforce single parent rule per specification
      if (parentLookup.has(targetNode)) {
        continue;
      }
      parentLookup.set(targetNode, sourceNode);

      // Build graph relationships
      if (!adjacencyGraph.has(sourceNode)) adjacencyGraph.set(sourceNode, []);
      if (!adjacencyGraph.has(targetNode)) adjacencyGraph.set(targetNode, []);
      
      adjacencyGraph.get(sourceNode).push(targetNode);
      uniqueVertices.add(sourceNode);
      uniqueVertices.add(targetNode);
    }

    const allVerticesList = Array.from(uniqueVertices);
    const rootCandidates = allVerticesList.filter((v) => !parentLookup.has(v));
    const traversed = new Set();
    const finalStructures = [];

    // Recursive depth-first search for tree exploration
    const exploreGraph = (currentNode, activePath) => {
      traversed.add(currentNode);
      activePath.add(currentNode);
      
      let cycleDetected = false;
      let deepestPath = 0;
      const branchMap = {};

      const connectedNodes = (adjacencyGraph.get(currentNode) || []).sort();
      
      connectedNodes.forEach((neighbor) => {
        if (!traversed.has(neighbor)) {
          const outcome = exploreGraph(neighbor, activePath);
          if (outcome.cycleDetected) cycleDetected = true;
          deepestPath = Math.max(deepestPath, outcome.nodeDepth);
          branchMap[neighbor] = outcome.branchMap;
        } else if (activePath.has(neighbor)) {
          cycleDetected = true;
        }
      });

      activePath.delete(currentNode);
      return { cycleDetected, nodeDepth: deepestPath + 1, branchMap };
    };

    // Analyze starting from valid roots
    rootCandidates.sort().forEach((rootVertex) => {
      if (!traversed.has(rootVertex)) {
        const exploration = exploreGraph(rootVertex, new Set());
        finalStructures.push({ rootVertex, ...exploration });
      }
    });

    // Detect isolated cyclic groups that have no roots
    let remainingNodes = allVerticesList.filter((v) => !traversed.has(v));
    while (remainingNodes.length > 0) {
      const cycleRoot = remainingNodes.sort()[0];
      const exploration = exploreGraph(cycleRoot, new Set());
      finalStructures.push({ rootVertex: cycleRoot, ...exploration, cycleDetected: true });
      remainingNodes = allVerticesList.filter((v) => !traversed.has(v));
    }

    // Format output mapping
    const hierarchies = finalStructures.map((struct) => {
      const resultObj = { root: struct.rootVertex };
      
      if (struct.cycleDetected) {
        resultObj.tree = {}; 
        resultObj.has_cycle = true;
      } else {
        resultObj.tree = { [struct.rootVertex]: struct.branchMap };
        resultObj.depth = struct.nodeDepth;
      }
      return resultObj;
    });

    const validAcyclicTrees = finalStructures.filter(s => !s.cycleDetected);
    let topRoot = null;
    let maxDepthFound = -1;

    validAcyclicTrees.forEach(treeStruct => {
      if (treeStruct.nodeDepth > maxDepthFound || (treeStruct.nodeDepth === maxDepthFound && treeStruct.rootVertex < topRoot)) {
        maxDepthFound = treeStruct.nodeDepth;
        topRoot = treeStruct.rootVertex;
      }
    });

    // Send Final JSON Payload
    return res.json({
      is_success: true,
      user_id: "AnshikaSrivastava_19082004",
      email_id: "as8327@srmist.edu.in",
      college_roll_number: "RA2311003012252",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees: validAcyclicTrees.length,
        total_cycles: finalStructures.length - validAcyclicTrees.length,
        largest_tree_root: topRoot,
      },
    });
  } catch (error) {
    return res.status(500).json({ is_success: false, msg: "Internal execution failure" });
  }
});

// Health check endpoint
app.get("/bfhl", (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

// Start listener
const SERVER_PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(SERVER_PORT, () => console.log(`API LIVE: ${SERVER_PORT}`));
}

module.exports = app;
