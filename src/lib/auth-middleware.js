import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Middleware to verify JWT token from Authorization header
 * @param {Request} request - The request object
 * @returns {Object} - { user, error } - user if valid, error if invalid
 */
export async function verifyToken(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    
    // Connect to database and get fresh user data
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password -verificationToken');
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    return { user };

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return { error: 'Invalid token', status: 401 };
    }
    if (error.name === 'TokenExpiredError') {
      return { error: 'Token expired', status: 401 };
    }
    
    console.error('Token verification error:', error);
    return { error: 'Token verification failed', status: 500 };
  }
}

/**
 * Middleware to check if user has required role
 * @param {Object} user - User object from verifyToken
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {Object} - { authorized, error }
 */
export function checkRole(user, allowedRoles = []) {
  if (!allowedRoles.includes(user.role)) {
    return { 
      authorized: false, 
      error: 'Insufficient permissions',
      status: 403
    };
  }
  
  return { authorized: true };
}

/**
 * Helper function to create protected route handler
 * @param {Function} handler - The actual route handler
 * @param {Array} allowedRoles - Array of allowed roles (optional)
 * @returns {Function} - Protected route handler
 */
export function withAuth(handler, allowedRoles = null) {
  return async function(request, context) {
    // Verify token
    const { user, error } = await verifyToken(request);
    
    if (error) {
      return Response.json({ error }, { status: 401 });
    }

    // Check role if specified
    if (allowedRoles) {
      const { authorized, error: roleError } = checkRole(user, allowedRoles);
      if (!authorized) {
        return Response.json({ error: roleError }, { status: 403 });
      }
    }

    // Add user to request context
    request.user = user;
    
    // Call the actual handler
    return handler(request, context);
  };
}
