// api.js
export const API_BASE_URL = 'http://localhost:5000';

export async function sendPrompt(prompt) {
  console.log('🚀 [API] Sending prompt:', prompt);
  
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  
  const data = await res.json();
  console.log('📥 [API] Response received:', data);
  
  // Flask already processed the MCP response, so data is ready to use
  console.log('🎬 [API] UI Actions found:', data.ui_actions?.length || 0);
  if (data.ui_actions) {
    data.ui_actions.forEach((action, i) => {
      console.log(`   Action ${i + 1}: ${action.type} - ${action.reasoning}`);
    });
  }
  
  // Mark as using intelligent selection and return
  const result = {
    ...data,
    intelligent_selection: true
  };
  
  console.log('📤 [API] Returning result with UI actions:', {
    ...result,
    ui_actions_count: result.ui_actions?.length || 0
  });
  
  return result;
}

// Legacy function for backward compatibility
export async function sendPromptLegacy(prompt) {
  const res = await fetch(`${API_BASE_URL}/generate/legacy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.code && !data.video_url) {
    throw new Error('Invalid response from server');
  }
  return {
    ...data,
    intelligent_selection: false
  };
}

// Get server capabilities and available tools
export const getCapabilities = async () => {
  const res = await fetch(`${API_BASE_URL}/capabilities`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch capabilities');
  }
  return res.json();
};

// Video management functions
export const getVideos = async () => {
  const res = await fetch(`${API_BASE_URL}/videos`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to fetch videos');
  }
  return res.json();
};

export const deleteVideo = async (id) => {
  const res = await fetch(`${API_BASE_URL}/videos/${id}.mp4`, { method: 'DELETE' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to delete video');
  }
  return res.text();
};

export const deleteAllVideos = async () => {
  const res = await fetch(`${API_BASE_URL}/videos`, { method: 'DELETE' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to delete all videos');
  }
  return res.text();
};

export const trimVideo = async (id, startTime, endTime) => {
  const res = await fetch(`${API_BASE_URL}/videos/${id}/trim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      startTime: parseFloat(startTime), 
      endTime: parseFloat(endTime) 
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || `HTTP ${res.status}: Failed to trim video`);
  }
  
  return res.json();
};

export const mergeVideos = async (videoIds) => {
  if (!Array.isArray(videoIds) || videoIds.length < 2) {
    throw new Error('At least 2 videos are required for merging');
  }
  
  const res = await fetch(`${API_BASE_URL}/videos/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || `HTTP ${res.status}: Failed to merge videos`);
  }
  
  return res.json(); // { video_url: "/videos/merged.mp4", merged_id: "uuid" }
};

// UI Action handlers
export const handleUIActions = (uiActions, callbacks = {}) => {
  if (!Array.isArray(uiActions) || uiActions.length === 0) {
    return [];
  }

  const executedActions = [];

  uiActions.forEach((action, index) => {
    const { type, parameters, reasoning } = action;
    
    console.log(`Executing UI action ${index + 1}: ${type} - ${reasoning}`);
    
    switch (type) {
      case 'open_burger_menu':
        if (callbacks.openBurgerMenu) {
          callbacks.openBurgerMenu(parameters?.reason || reasoning);
          executedActions.push({
            type,
            executed: true,
            reason: parameters?.reason || reasoning
          });
        } else {
          console.warn('openBurgerMenu callback not provided');
          executedActions.push({
            type,
            executed: false,
            error: 'Callback not available'
          });
        }
        break;

      case 'open_video_editor':
        if (callbacks.openVideoEditor) {
          callbacks.openVideoEditor(
            parameters?.reason || reasoning,
            parameters?.suggested_videos || []
          );
          executedActions.push({
            type,
            executed: true,
            reason: parameters?.reason || reasoning,
            suggestedVideos: parameters?.suggested_videos || []
          });
        } else {
          console.warn('openVideoEditor callback not provided');
          executedActions.push({
            type,
            executed: false,
            error: 'Callback not available'
          });
        }
        break;

      default:
        console.warn(`Unknown UI action type: ${type}`);
        executedActions.push({
          type,
          executed: false,
          error: 'Unknown action type'
        });
    }
  });

  return executedActions;
};

// Utility function to display tool selection information
export const formatToolSelectionInfo = (data) => {
  if (!data.intelligent_selection) {
    return "Used direct tool routing";
  }
  
  const tools = data.tools_used || [];
  const reasoning = data.reasoning || [];
  const log = data.tool_selection_log || [];
  const uiActions = data.ui_actions || [];
  
  return {
    summary: `LLM selected ${tools.length} tools: ${tools.join(' → ')}`,
    details: tools.map((tool, index) => ({
      tool,
      reasoning: reasoning[index] || 'No reasoning provided',
      step: log[index] || `Step ${index + 1}`
    })),
    fullLog: log,
    uiActions: uiActions.map(action => ({
      type: action.type,
      reason: action.reasoning,
      parameters: action.parameters
    }))
  };
};

// Helper function to check if response contains UI actions
export const hasUIActions = (data) => {
  return data.ui_actions && Array.isArray(data.ui_actions) && data.ui_actions.length > 0;
};

// Helper function to get UI action summary
export const getUIActionSummary = (data) => {
  if (!hasUIActions(data)) {
    return null;
  }

  const actions = data.ui_actions;
  const actionTypes = actions.map(a => a.type.replace('open_', '').replace('_', ' '));
  
  return {
    count: actions.length,
    types: actionTypes,
    summary: `Will ${actionTypes.join(' and ')}`
  };
};