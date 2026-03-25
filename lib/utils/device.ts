
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      device: 'desktop', // Default for SSR
      os: 'unknown',
      browser: 'unknown'
    };
  }

  const ua = navigator.userAgent;
  let device = 'desktop';
  let os = 'unknown';
  let browser = 'unknown';
  let deviceModel: string | undefined;

  // Device Type
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    device = 'mobile';
  }

  // OS
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'MacOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

  // Browser
  if (ua.indexOf('Firefox') !== -1 || ua.indexOf('FxiOS') !== -1) browser = 'Firefox';
  else if (ua.indexOf('SamsungBrowser') !== -1) browser = 'Samsung Browser';
  else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) browser = 'Opera';
  else if (ua.indexOf('Trident') !== -1) browser = 'Internet Explorer';
  else if (ua.indexOf('Edge') !== -1) browser = 'Edge';
  else if (ua.indexOf('Chrome') !== -1 || ua.indexOf('CriOS') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';

  const iosMatch = ua.match(/\((iPhone|iPad|iPod)[^)]*\)/i);
  if (iosMatch?.[1]) {
    deviceModel = iosMatch[1];
  } else {
    const androidBuildMatch = ua.match(/Android[^;)]*;\s*([^;)]+?)\s*Build\//i);
    if (androidBuildMatch?.[1]) {
      deviceModel = androidBuildMatch[1].trim();
    } else {
      const androidGenericMatch = ua.match(/Android[^;)]*;\s*([^;)]+?)\)/i);
      if (androidGenericMatch?.[1]) {
        deviceModel = androidGenericMatch[1].trim();
      }
    }
  }

  return {
    device,
    os,
    browser,
    userAgent: ua,
    ...(deviceModel ? { deviceModel } : {}),
  };
};
