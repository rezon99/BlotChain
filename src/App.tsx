import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Dashboard3D } from './components/Dashboard3D';
import { DashboardVR } from './components/DashboardVR';

function App() {
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'vr'>('2d');
  const [snapshotMode, setSnapshotMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('snapshotMode') === '1') {
      setSnapshotMode(true);
      setViewMode('2d');
    }
  }, []);

  if (viewMode === 'vr' && !snapshotMode) {
    return (
      <DashboardVR
        onViewModeSwitch={setViewMode}
      />
    );
  }

  return viewMode === '2d' || snapshotMode ? (
    <Dashboard
      viewMode="2d"
      onViewModeSwitch={setViewMode}
      snapshotMode={snapshotMode}
    />
  ) : (
    <Dashboard3D
      viewMode={viewMode}
      onViewModeSwitch={setViewMode}
    />
  );
}

export default App;
