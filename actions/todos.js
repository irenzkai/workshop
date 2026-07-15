'use server';

import pool from '@/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secure_fallback_secret_key_32_characters_long'
);

/**
 * Decodes the JWT session cookie and retrieves the authenticated user's ID.
 */
async function getUserIdFromSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    return payload.userId;
  } catch (err) {
    return null;
  }
}

/**
 * 1. GET - Fetch todos scoped to the current user's account from Neon DB
 */
export async function getTodos() {
  const userId = await getUserIdFromSession();
  if (!userId) return [];

  try {
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error('Error fetching todos from Neon DB:', err);
    return [];
  }
}

/**
 * 2. POST - Add a new todo with a description linked to the current user's account
 */
export async function addTodo(formData) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  const title = formData.get('title')?.trim();
  const description = formData.get('description')?.trim();

  if (!title) return { error: 'To-do name cannot be empty.' };

  try {
    await pool.query(
      'INSERT INTO todos (user_id, title, description) VALUES ($1, $2, $3)',
      [userId, title, description || ""]
    );
  } catch (err) {
    console.error('Error adding todo to Neon DB:', err);
    return { error: 'Failed to save task to the database.' };
  }

  revalidatePath('/todos');
}

/**
 * 3. PATCH - Toggle completion state in Neon DB
 */
export async function toggleTodo(id, completed) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  try {
    await pool.query(
      'UPDATE todos SET completed = $1 WHERE id = $2 AND user_id = $3',
      [completed, id, userId]
    );
  } catch (err) {
    console.error('Error toggling todo in Neon DB:', err);
    return { error: 'Failed to update task completion.' };
  }

  revalidatePath('/todos');
}

/**
 * 4. PATCH - Edit task title and description in Neon DB
 */
export async function updateTodoTitle(id, title, description) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return { error: 'Title is required.' };

  try {
    await pool.query(
      'UPDATE todos SET title = $1, description = $2 WHERE id = $3 AND user_id = $4',
      [trimmedTitle, description || "", id, userId]
    );
  } catch (err) {
    console.error('Error updating todo in Neon DB:', err);
    return { error: 'Failed to update task in the database.' };
  }

  revalidatePath('/todos');
}

/**
 * 5. DELETE - Remove todo from Neon DB
 */
export async function deleteTodo(id) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  try {
    await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  } catch (err) {
    console.error('Error deleting todo from Neon DB:', err);
    return { error: 'Failed to delete task from the database.' };
  }

  revalidatePath('/todos');
}