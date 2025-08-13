export async function GET(request) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  const authRoutes = {
    register: `${baseUrl}/api/auth/register`,
    login: `${baseUrl}/api/auth/login`,
    logout: `${baseUrl}/api/auth/logout`,
    verifyEmail: `${baseUrl}/api/auth/verify-email`,
    profile: `${baseUrl}/api/auth/me`,
  };

  const examples = {
    register: {
      method: 'POST',
      url: authRoutes.register,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        skills: 'javascript, react, node.js'
      }
    },
    login: {
      method: 'POST',
      url: authRoutes.login,
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: 'john@example.com',
        password: 'password123'
      }
    },
    profile: {
      method: 'GET',
      url: authRoutes.profile,
      headers: { 
        'Authorization': 'Bearer your-jwt-token-here',
        'Content-Type': 'application/json'
      }
    },
    verifyEmail: {
      method: 'GET',
      url: `${authRoutes.verifyEmail}?token=your-verification-token`,
    }
  };

  return Response.json({
    message: 'KnowFlow Authentication API',
    version: '1.0.0',
    routes: authRoutes,
    examples,
    notes: {
      authentication: 'Use JWT tokens in Authorization header: Bearer <token>',
      registration: 'Email verification is required before login',
      skills: 'Skills should be comma-separated string',
      roles: 'Available roles: user, moderator, admin'
    }
  });
}
