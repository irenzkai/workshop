import { getTodos } from '../../actions/todos';
import { logout } from '../../actions/auth';
import TodoListClient from './TodoListClient';

export default async function TodosPage() {
  const todos = await getTodos();

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-md border border-gray-100 space-y-6">
        
        {/* Header with Styled Log Out Button */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Your To-Do List</h1>
          <form action={logout}>
            <button 
              type="submit" 
              className="bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-semibold px-4 py-2 rounded-lg text-sm border border-red-200 transition duration-150"
            >
              Log Out
            </button>
          </form>
        </div>

        {/* Client Side Interactive List */}
        <TodoListClient todos={todos} />

      </div>
    </main>
  );
}