import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return Response.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return Response.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.verified) {
      return Response.json(
        { message: 'Email already verified', user: user.toJSON() },
        { status: 200 }
      );
    }

    // Update user as verified
    user.verified = true;
    user.verificationToken = null; // Clear the token
    await user.save();

    // Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    return Response.json({
      message: 'Email verified successfully',
      user: user.toJSON(),
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json(
      { error: 'Email verification failed', details: error.message },
      { status: 500 }
    );
  }
}
