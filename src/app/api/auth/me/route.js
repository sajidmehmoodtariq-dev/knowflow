import { withAuth } from '@/lib/auth-middleware';

async function getUserProfile(request) {
  try {
    // User is already available from middleware
    const user = request.user;

    return Response.json({
      user: user.toJSON(),
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json(
      { error: 'Failed to get user profile', details: error.message },
      { status: 500 }
    );
  }
}

// Export protected route
export const GET = withAuth(getUserProfile);
