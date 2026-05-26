/**
 * Sends a service-layer result through Express response.
 */
export const sendServiceResult = (res, result) => {
  if (result.cacheControl) {
    res.set('Cache-Control', result.cacheControl);
  }
  return res.status(result.status).json(result.body);
};
