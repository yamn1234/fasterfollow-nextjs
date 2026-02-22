import { useCallback } from 'react';

const BASE_URL = 'https://fasterfollow.net';

interface NotifyIndexNowParams {
  urls: string[];
}

interface NotifyBingParams {
  urls: string[];
}

// IndexNow API for instant indexing (Bing, Yandex, Seznam, Naver)
export const useIndexNow = () => {
  const notifyIndexNow = useCallback(async ({ urls }: NotifyIndexNowParams) => {
    // IndexNow requires a key file at /.well-known/indexnow or /indexnow-key.txt
    // For now, we'll store the key and make the API call
    const indexNowKey = 'fasterfollow2025seokey'; // This should match the key file
    
    const fullUrls = urls.map(url => 
      url.startsWith('http') ? url : `${BASE_URL}${url}`
    );

    try {
      // IndexNow API endpoint
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: 'fasterfollow.net',
          key: indexNowKey,
          keyLocation: `${BASE_URL}/${indexNowKey}.txt`,
          urlList: fullUrls,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('IndexNow notification failed:', error);
      return false;
    }
  }, []);

  return { notifyIndexNow };
};

// Bing Content Submission API
export const useBingSubmission = () => {
  const notifyBing = useCallback(async ({ urls }: NotifyBingParams) => {
    const fullUrls = urls.map(url => 
      url.startsWith('http') ? url : `${BASE_URL}${url}`
    );

    try {
      // This would typically be called from an Edge Function with API key
      // For client-side, we use IndexNow which Bing supports
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: 'fasterfollow.net',
          key: 'fasterfollow2025seokey',
          urlList: fullUrls,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Bing submission failed:', error);
      return false;
    }
  }, []);

  return { notifyBing };
};

// Combined hook for all SEO submission APIs
export const useSEOSubmission = () => {
  const { notifyIndexNow } = useIndexNow();
  const { notifyBing } = useBingSubmission();

  const notifySearchEngines = useCallback(async (urls: string[]) => {
    const results = await Promise.allSettled([
      notifyIndexNow({ urls }),
      notifyBing({ urls }),
    ]);

    return {
      indexNow: results[0].status === 'fulfilled' ? results[0].value : false,
      bing: results[1].status === 'fulfilled' ? results[1].value : false,
    };
  }, [notifyIndexNow, notifyBing]);

  return { notifySearchEngines };
};

export default useSEOSubmission;
