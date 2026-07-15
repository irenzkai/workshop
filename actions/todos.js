'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BASE_API_URL = 'https://htc.klaro.rodentskie.com/api/todos';

/**
 * Helper function to retrieve the current user's session token 
 * and format it as an Authorization header.
 */
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (!session) return {};
  
  return {
    'Authorization': `Bearer ${session}`
  };
}

/**
 * 1. GET - Fetch todos from the external API
 */
export async function getTodos() {
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(BASE_API_URL, {
      method: 'GET',
      headers: {
        ...authHeaders,
      },
      next: { revalidate: 0 } // Disable fetch caching to ensure real-time data
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching external todos:', err);
    return [];
  }
}

/**
 * 2. POST - Add a new todo to the external API
 */
export async function addTodo(formData) {
  const title = formData.get('title')?.trim();
  const description = formData.get('description')?.trim(); // Get the description

  if (!title) return { error: 'To-do name cannot be empty.' };

  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(BASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ 
        title, 
        description: description || "" // Send the description
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
 * 3. PATCH - Toggle task completion state on the external API
 */
export async function toggleTodo(id, completed) {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${BASE_API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ completed }),
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
 * 4. PATCH - Edit task title on the external API
 */
export async function updateTodoTitle(id, title, description) {
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return { error: 'Title is required.' };

  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${BASE_API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ 
        title: trimmedTitle, 
        description: description || "" // Send updated description
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
 * 5. DELETE - Remove a todo from the external API
 */
export async function deleteTodo(id) {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${BASE_API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
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