import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'Okoro-Itohoowo-Nse';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  console.log("Authorization Header:", authHeader); // Debugging

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access denied. Authorization header missing or invalid.',
      success: false,
    });
  }

  const token = authHeader.split(' ')[1];
  console.log("Extracted Token:", token); // Debugging

  if (!token || token === 'null') {
    return res.status(401).json({
      message: 'Access denied. Token is missing or null.',
      success: false,
    });
  }

  jwt.verify(token, JWT_SECRET, { clockTolerance: 5 }, (err, decoded: any) => {
    if (err) {
      console.error("JWT Verification Error:", err); // Debugging
      const errorMessage =
        err.name === 'TokenExpiredError' ? 'Token expired.' :
        err.name === 'JsonWebTokenError' ? 'Invalid token.' :
        'Could not authenticate token.';

      return res.status(403).json({
        message: errorMessage,
        success: false,
      });
    }

    console.log("Decoded Token:", decoded); // Debugging

    // Attach the userId to req.user
    req.user = { userId: decoded.userId }; // Ensure userId is available
    console.log("User ID:", req.user.userId); // Debugging

    next();
  });
};

export default authenticateToken;
