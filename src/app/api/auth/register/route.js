import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, password } = await request.json();

    // Basic validation
    if (!name || !email || !password) {
      return Response.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return Response.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password, // Will be hashed by the pre-save middleware
      skills: [], // Empty skills array - will be managed by admin
      verificationToken,
      verified: false,
      approved: false,
    });

    await newUser.save();

    // Send verification email (non-blocking)
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    return Response.json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        skills: newUser.skills,
        verified: newUser.verified,
        approved: newUser.approved,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return Response.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      );
    }

    // Handle duplicate key error (email)
    if (error.code === 11000) {
      return Response.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    return Response.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}
