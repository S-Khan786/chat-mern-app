const requests = new Map();

const rateLimit = ({ windowMs, max }) => (req, res, next) => {
  const key = `${req.ip}:${req.user?._id || "anonymous"}`;
  const now = Date.now();
  const entry = requests.get(key);
  if (!entry || now - entry.startedAt >= windowMs) {
    requests.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (entry.count >= max) {
    return res.status(429).json({ success: false, message: "Too many requests, please try again later" });
  }
  entry.count += 1;
  return next();
};

export default rateLimit;