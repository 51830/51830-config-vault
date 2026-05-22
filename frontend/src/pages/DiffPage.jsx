import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import DiffViewer from '../components/DiffViewer';

function mapConfigData(config) {
  if (!config) return null;
  return {
    version: config.version,
    items: (config.items || []).map((item) => ({
      key: item.key_path,
      value: item.value_preview ?? '',
    })),
  };
}

export default function DiffPage() {
  const { id: appId, configId } = useParams();
  const [searchParams] = useSearchParams();
  const compareVersion = searchParams.get('compare');
  const navigate = useNavigate();
  const { fetchConfigFiles, fetchItemsForDiff } = useAppStore();

  const [currentVersion, setCurrentVersion] = useState(null);
  const [compareVersionData, setCompareVersionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [splitView, setSplitView] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchConfigFiles(appId, 1, 100);
        const cfList = useAppStore.getState().configFiles;
        const currentConfig = cfList.find((cf) => cf.id === parseInt(configId));

        const currentResult = await fetchItemsForDiff(configId);
        setCurrentVersion({ version: currentConfig?.version || '?', items: currentResult.items });

        if (compareVersion) {
          const vNum = parseInt(compareVersion.replace('v', ''));
          const compareConfig = cfList.find((cf) => cf.version === vNum);
          if (compareConfig) {
            const compareResult = await fetchItemsForDiff(compareConfig.id);
            setCompareVersionData({ version: vNum, items: compareResult.items });
          } else {
            setCompareVersionData({ version: vNum, items: [] });
          }
        } else {
          setCompareVersionData(null);
        }
      } catch (err) {
        console.error('Failed to load diff:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [configId, appId, compareVersion, fetchConfigFiles, fetchItemsForDiff]);

  if (loading) return <div className="loading">Loading diff...</div>;

  const oldConfig = mapConfigData(compareVersionData);
  const newConfig = mapConfigData(currentVersion);

  return (
    <div className="diff-page">
      <div className="page-header">
        <div>
          <button className="btn-link" onClick={() => navigate(`/apps/${appId}`)}>
            &larr; Back to App
          </button>
          <h1>Version Diff</h1>
        </div>
      </div>

      <div className="diff-info">
        <span className="version-badge">Current: v{currentVersion?.version || '?'}</span>
        {compareVersionData && (
          <span className="version-badge compare">Comparing with: v{compareVersionData.version}</span>
        )}
      </div>

      <div className="diff-controls">
        <label className="diff-toggle">
          <input
            type="checkbox"
            checked={showOnlyChanges}
            onChange={(e) => setShowOnlyChanges(e.target.checked)}
          />
          Show only changes
        </label>
        <label className="diff-toggle">
          <input
            type="checkbox"
            checked={splitView}
            onChange={(e) => setSplitView(e.target.checked)}
          />
          Split view
        </label>
      </div>

      {newConfig ? (
        <DiffViewer
          oldConfig={oldConfig || { version: '-', items: [] }}
          newConfig={newConfig}
          showOnlyChanges={showOnlyChanges}
          splitView={splitView}
        />
      ) : (
        <div className="empty-state">No data to compare.</div>
      )}
    </div>
  );
}
