'use server';

import pool from '@/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secure_fallback_secret_key_32_characters_long'
);

export async function register(formData) {
  const username = formData.get('username')?.trim();
  const password = formData.get('password');

  console.log("Attempting to register user:", username); // ADD THIS

  if (!username || !password) {
    return { error: 'All fields are required.' };
  }

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (userCheck.rows.length > 0) {
      return { error: 'Username is already taken.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ADD THIS LOG
    console.log("Querying database to insert user..."); 
    
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    
    console.log("User inserted successfully!"); // ADD THIS

  } catch (err) {
    console.error("DATABASE REGISTRATION ERROR:", err); // MAKE THIS VERY CLEAR
    return { error: 'An error occurred: ' + err.message };
  }

  redirect('/login');
}

export async function login(formData) {
  const username = formData.get('username')?.trim();
  const password = formData.get('password');

  if (!username || !password) {
    return { error: 'All fields are required.' };
  }

  let user;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return { error: 'Invalid credentials.' };
    }
    user = result.rows[0];
  } catch (err) {
    console.error(err);
    return { error: 'Authentication failed.' };
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return { error: 'Invalid credentials.' };
  }

  const token = await new SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 2, // 2 Hours
    path: '/',
  });

  redirect('/todos');
}

export async function logout() {
  (await cookies()).delete('session');
  redirect('/login');
}