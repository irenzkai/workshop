'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { jwtVerify } from 'jose';

const BASE_API_URL = 'https://htc.klaro.rodentskie.com/api/todos';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'secure_fallback_secret_key_32_characters_long'
);

/**
 * Decodes the JWT session cookie and retrieves the authenticated user's details.
 */
async function getSessionData() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, JWT_SECRET);
    return { token: session, userId: payload.userId, username: payload.username };
  } catch (err) {
    return null;
  }
}

/**
 * 1. GET - Fetch todos scoped to the current user's account
 */
export async function getTodos() {
  const sessionData = await getSessionData();
  if (!sessionData) return [];

  try {
    // Send user_id as a query param to the endpoint
    const url = `${BASE_API_URL}?user_id=${sessionData.userId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionData.token}`,
      },
      next: { revalidate: 0 } // No-cache to fetch fresh items on reload
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const allTodos = await response.json();
    
    // Fallback filter to guarantee only account-owned items display
    return allTodos.filter(
      (todo) => todo.user_id === sessionData.userId || todo.userId === sessionData.userId
    );
  } catch (err) {
    console.error('Error fetching scoped todos:', err);
    return [];
  }
}

/**
 * 2. POST - Add a new todo linked to the current user's account
 */
export async function addTodo(formData) {
  const sessionData = await getSessionData();
  if (!sessionData) return { error: 'Unauthorized' };

  const title = formData.get('title')?.trim();
  const description = formData.get('description')?.trim();

  if (!title) return { error: 'To-do name cannot be empty.' };

  try {
    const response = await fetch(BASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.token}`,
      },
      body: JSON.stringify({ 
        title, 
        description: description || "",
        user_id: sessionData.userId, // Links task to the account ID
        userId: sessionData.userId
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
  } catch (err) {
    console.error('Error adding external todo:', err);
    return { error: 'Failed to save task to the remote API.' };
  }

  revalidatePath('/todos');
}

/**
 * 3. PATCH - Toggle completion state
 */
export async function toggleTodo(id, completed) {
  const sessionData = await getSessionData();
  if (!sessionData) return { error: 'Unauthorized' };

  try {
    const response = await fetch(`${BASE_API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.token}`,
      },
      body: JSON.stringify({ 
        completed,
        user_id: sessionData.userId,
        userId: sessionData.userId
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
  } catch (err) {
    console.error('Error toggling external todo:', err);
    return { error: 'Failed to update completion state on the remote API.' };
  }

  revalidatePath('/todos');
}

/**
 * 4. PATCH - Edit task details
 */
export async function updateTodoTitle(id, title, description) {
  const sessionData = await getSessionData();
  if (!sessionData) return { error: 'Unauthorized' };

  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return { error: 'Title is required.' };

  try {
    const response = await fetch(`${BASE_API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.token}`,
      },
      body: JSON.stringify({ 
        title: trimmedTitle, 
        description: description || "",
        user_id: sessionData.userId,
        userId: sessionData.userId
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
  } catch (err) {
    console.error('Error updating external todo:', err);
    return { error: 'Failed to update on the remote API.' };
  }

  revalidatePath('/todos');
}

/**
 * 5. DELETE - Remove todo
 */
export async function deleteTodo(id) {
  const sessionData = await getSessionData();
  if (!sessionData) return { error: 'Unauthorized' };

  try {
    const response = await fetch(`${BASE_API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionData.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
  } catch (err) {
    console.error('Error deleting external todo:', err);
    return { error: 'Failed to delete task from the remote API.' };
  }

  revalidatePath('/todos');
}