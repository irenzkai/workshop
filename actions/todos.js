'use server';

import pool from '@/db';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secure_fallback_secret_key_32_characters_long'
);

async function getUserIdFromSession() {
  // AWAIT the cookies() function
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

export async function getTodos() {
  const userId = await getUserIdFromSession();
  if (!userId) return [];
  try {
    const result = await pool.query('SELECT * FROM todos WHERE user_id = $1 ORDER BY id DESC', [userId]);
    return result.rows;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function addTodo(formData) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  const title = formData.get('title')?.trim();
  if (!title) return { error: 'To-do name cannot be empty.' };

  try {
    await pool.query('INSERT INTO todos (user_id, title) VALUES ($1, $2)', [userId, title]);
  } catch (err) {
    console.error(err);
    return { error: 'Could not create task.' };
  }

  revalidatePath('/todos');
}

export async function toggleTodo(id, completed) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  try {
    await pool.query('UPDATE todos SET completed = $1 WHERE id = $2 AND user_id = $3', [
      completed,
      id,
      userId,
    ]);
  } catch (err) {
    console.error(err);
    return { error: 'Could not update task.' };
  }

  revalidatePath('/todos');
}

export async function deleteTodo(id) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  try {
    await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, userId]);
  } catch (err) {
    console.error(err);
    return { error: 'Could not delete task.' };
  }

  revalidatePath('/todos');
}

export async function updateTodoTitle(id, title) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: 'Unauthorized' };

  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return { error: 'Title is required.' };

  try {
    await pool.query('UPDATE todos SET title = $1 WHERE id = $2 AND user_id = $3', [
      trimmedTitle,
      id,
      userId,
    ]);
  } catch (err) {
    console.error(err);
    return { error: 'Failed to update task.' };
  }

  revalidatePath('/todos');
}