import React, { useState, useCallback } from 'react';
import './App.css';

// Pre-defined testing dataset - PLAIN TEXT ONLY
const SAMPLE_TEST_DATA = 'A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->';
const BACKEND_ENDPOINT = (process.env.REACT_APP_API_URL || '') + '/bfhl';

// Utility to clean and split the raw text box
const processRawText = (textBlob) => {
  return textBlob
    .split(/[\n,]+/) // Split by commas AND newlines
    .map((str) => str.trim()) // Trim whitespace from each item
    .filter((str) => str.length > 0); // Remove empty strings
};

// Generates a local timestamp for the UI
const getFormattedTime = () => {
  const t = new Date();
  return t.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(t.getMilliseconds()).padStart(3, '0');
};

/* --- UI COMPONENTS --- */

// Recursively renders the branches of a tree
const RecursiveBranch = ({ nodeMap, mode }) => {
  const branchStyle = mode === 'cycle' ? 'cyclic-mode' : 'valid-mode';
  const sortedKeys = Object.keys(nodeMap).sort();

  return sortedKeys.map((nodeName, index) => {
    const isFinalNode = index === sortedKeys.length - 1;
    const subNodes = nodeMap[nodeName];
    const containsSubNodes = Object.keys(subNodes).length > 0;

    return (
      <div key={nodeName} className={`branch-row ${branchStyle}`}>
        <div className="branch-content">
          <span className="branch-line">{isFinalNode ? '└── ' : '├── '}</span>
          <span className="branch-label">{nodeName}</span>
        </div>
        {containsSubNodes && (
          <div style={{ paddingLeft: '1.4rem' }}>
            <RecursiveBranch nodeMap={subNodes} mode={mode} />
          </div>
        )}
      </div>
    );
  });
};

// Main card wrapper for a single hierarchy structure
const HierarchyBox = ({ graphComponent }) => {
  const detectCycle = graphComponent.has_cycle === true;
  const viewMode = detectCycle ? 'cycle' : 'valid';
  
  const rootIdentifier = graphComponent.root;
  const childBranches = graphComponent.tree[rootIdentifier] || {};

  return (
    <div className={`hierarchy-box ${viewMode}`}>
      <div className="hierarchy-header">
        <span className="icon-indicator">{detectCycle ? '🔴' : '✅'}</span>
        <span className="root-title">{rootIdentifier}</span>
        <span className="depth-badge">
          {detectCycle ? 'CYCLE' : `depth: ${graphComponent.depth}`}
        </span>
      </div>
      <div className="hierarchy-content">
        <div className={`branch-row ${viewMode === 'cycle' ? 'cyclic-mode' : 'valid-mode'}`}>
          <div className="branch-content">
            <span className="branch-label">{rootIdentifier}</span>
          </div>
          <div className="branch-children">
            <RecursiveBranch nodeMap={childBranches} mode={viewMode} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Accordion style container for grouping results
const ExpandableSection = ({ themeColor, symbol, heading, itemAmount, children, startExpanded = true, delayTimer = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  return (
    <div className="expandable-section" style={{ animationDelay: `${delayTimer}ms` }}>
      <div className={`section-top ${themeColor}`} onClick={() => setIsExpanded(!isExpanded)}>
        <span>{symbol}</span>
        <span>{heading}</span>
        <span className="amount-pill">{itemAmount}</span>
        <span className={`dropdown-arrow ${isExpanded ? 'rotated' : ''}`}>▼</span>
      </div>
      {isExpanded && <div className="section-bottom">{children}</div>}
    </div>
  );
};

// Dashboard KPI Box
const DataStatBox = ({ variant, metric, title, subtitle, glyph, delayOffset }) => {
  return (
    <div className={`stat-box ${variant}`} style={{ animationDelay: `${delayOffset}ms` }}>
      <span className="stat-glyph">{glyph}</span>
      <div className="stat-title">{title}</div>
      <div className="stat-metric">{metric}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
};

/* --- MAIN DASHBOARD VIEW --- */
export default function GraphDashboard() {
  const [rawInput, setRawInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [systemError, setSystemError] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const executeAnalysis = useCallback(async () => {
    if (!rawInput.trim()) {
      setSystemError('⚠ Cannot submit empty data.');
      return;
    }
    
    setIsFetching(true);
    setSystemError('');
    
    // Parse the input according to the rules (split by comma/newline, trim, remove empty)
    const parsedArray = processRawText(rawInput);

    try {
      // Send ONLY the clean array of strings to the API wrapped in { data: ... }
      const response = await fetch(BACKEND_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedArray }),
      });
      
      const payload = await response.json();
      if (!response.ok || !payload.is_success) {
        throw new Error(payload.message || 'Server communication failed');
      }
      
      setAnalysisData(payload);
      setLastUpdated(getFormattedTime());
    } catch (err) {
      setSystemError(`System Fault: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  }, [rawInput]);

  // Data Extraction
  const retrievedHierarchies = analysisData ? analysisData.hierarchies || [] : [];
  const correctTrees = retrievedHierarchies.filter(h => !h.has_cycle);
  const cycleLoops = retrievedHierarchies.filter(h => h.has_cycle);
  const faultyInputs = analysisData ? analysisData.invalid_entries || [] : [];
  const repeatedEdges = analysisData ? analysisData.duplicate_edges || [] : [];
  const overallStats = analysisData ? analysisData.summary || {} : {};

  return (
    <div className="dashboard-layout">
      <div className="content-wrapper">
        <header className="dashboard-head">
          <div className="hackathon-tag">SRM Engineering Assessment</div>
          <h1 className="main-heading">Hierarchy Parsing Engine</h1>
        </header>

        <section className="input-panel">
          <div className="panel-card">
            <div className="panel-tag">Raw Data Stream</div>
            <textarea
              className="code-textarea"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Enter node pairs like A->B, A->C..."
              rows={6}
            />
            <div className="action-buttons">
              <button className="primary-btn" onClick={executeAnalysis} disabled={isFetching}>
                {isFetching ? 'Processing...' : '▶ Initialize'}
              </button>
              <button className="secondary-btn" onClick={() => setRawInput(SAMPLE_TEST_DATA)}>📥 Inject Test</button>
              <button className="secondary-btn" onClick={() => { setRawInput(''); setAnalysisData(null); }}>✕ Wipe</button>
            </div>
            {systemError && <div className="alert-strip"><span>{systemError}</span></div>}
          </div>
        </section>

        {analysisData && (
          <section className="output-panel">
            <div className="output-top">
              <h2 className="output-heading">{'// Diagnostics Report'}</h2>
              <span className="time-stamp">⏱ {lastUpdated}</span>
            </div>

            <div className="kpi-grid">
              <DataStatBox variant="trees" glyph="🌲" title="Valid Trees" metric={overallStats.total_trees} subtitle="Acyclic Paths" delayOffset={0} />
              <DataStatBox variant="cycles" glyph="🔴" title="Cycle Groups" metric={overallStats.total_cycles} subtitle="Endless Loops" delayOffset={80} />
              <DataStatBox variant="root" glyph="⭐" title="Largest Root" metric={overallStats.largest_tree_root || '—'} subtitle="Deepest Origin" delayOffset={160} />
            </div>

            {correctTrees.length > 0 && (
              <ExpandableSection themeColor="green" symbol="🌲" heading="Constructed Hierarchies" itemAmount={correctTrees.length} delayTimer={0}>
                <div className="hierarchy-grid">
                  {correctTrees.map((h, idx) => <HierarchyBox key={idx} graphComponent={h} />)}
                </div>
              </ExpandableSection>
            )}

            {cycleLoops.length > 0 && (
              <ExpandableSection themeColor="red" symbol="🔴" heading="Detected Cycles" itemAmount={cycleLoops.length} delayTimer={100}>
                <div className="hierarchy-grid">
                  {cycleLoops.map((h, idx) => <HierarchyBox key={idx} graphComponent={h} />)}
                </div>
              </ExpandableSection>
            )}

            {faultyInputs.length > 0 && (
              <ExpandableSection themeColor="yellow" symbol="⚠️" heading="Faulty Inputs" itemAmount={faultyInputs.length} delayTimer={200}>
                <div className="chip-list">
                  {faultyInputs.map((e, idx) => <span key={idx} className="chip err-chip">{e}</span>)}
                </div>
              </ExpandableSection>
            )}

            {repeatedEdges.length > 0 && (
              <ExpandableSection themeColor="orange" symbol="🔁" heading="Repeated Edges" itemAmount={repeatedEdges.length} delayTimer={300}>
                <div className="chip-list">
                  {repeatedEdges.map((e, idx) => <span key={idx} className="chip dup-chip">{e}</span>)}
                </div>
              </ExpandableSection>
            )}
          </section>
        )}
      </div>
      <footer className="dashboard-foot">V1.0.0 · Core Processing Engine</footer>
    </div>
  );
}
