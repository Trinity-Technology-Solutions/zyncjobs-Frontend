// API Key Validation Utility
export const validateApiKey = async (): Promise<{ valid: boolean; message: string }> => {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey === 'sk-or-v1-your_openrouter_api_key_here') {
    return { valid: false, message: 'API key not configured or using placeholder value' };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Trinity Jobs'
      }
    });

    if (response.ok) {
      return { valid: true, message: 'API key is valid' };
    } else {
      return { valid: false, message: `API key invalid: ${response.status} ${response.statusText}` };
    }
  } catch (error) {
    return { valid: false, message: `API validation failed: ${error}` };
  }
};