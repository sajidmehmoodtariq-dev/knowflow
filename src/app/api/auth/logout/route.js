export async function POST(request) {
  try {
    // For JWT-based auth, logout is mainly client-side
    // Server just acknowledges the logout request
    
    // You could add token blacklisting here if needed
    // For now, we'll just return a success response
    
    return Response.json({
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: 'Logout failed', details: error.message },
      { status: 500 }
    );
  }
}
