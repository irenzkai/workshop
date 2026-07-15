'use client';

import { useTransition, useRef } from 'react';
import { addTodo, toggleTodo, deleteTodo } from '../../actions/todos';

export default function TodoListClient({ todos }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null);

  // Status Bar Calculations
  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Handles dynamic state change when checking/unchecking
  const handleToggle = (id, completed) => {
    startTransition(async () => {
      await toggleTodo(id, completed);
    });
  };

  // Triggers client-side confirmation dialog before executing deletion
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      startTransition(async () => {
        await deleteTodo(id);
      });
    }
  };

  // Resets the input field smoothly upon task addition
  const handleAddAction = async (formData) => {
    await addTodo(formData);
    formRef.current?.reset();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Task Status Bar */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-indigo-950 font-medium">
        <div className="flex gap-4">
          <span>Total: <strong className="text-indigo-700 font-bold">{totalTasks}</strong></span>
          <span>Completed: <strong className="text-indigo-700 font-bold">{completedTasks}</strong></span>
          <span>Pending: <strong className="text-indigo-700 font-bold">{totalTasks - completedTasks}</strong></span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-indigo-700">{completionRate}% Done</span>
          <div className="flex-1 sm:w-36 bg-indigo-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Add Task Input Form */}
      <form ref={formRef} action={handleAddAction} className="flex gap-2">
        <input
          name="title"
          type="text"
          placeholder="Add a new task..."
          required
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm shadow-sm"
        />
        <button 
          type="submit" 
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2 px-6 rounded-lg transition duration-150 text-sm shadow-sm"
        >
          Add
        </button>
      </form>

      {/* 3. To-Do Items List */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-6 text-sm">No tasks yet. Add a task to get started!</p>
        ) : (
          todos.map((todo) => (
            <div 
              key={todo.id} 
              className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl border transition-all duration-150 ${
                todo.completed ? 'border-gray-200 opacity-75' : 'border-gray-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id, !todo.completed)}
                  className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <span className={`text-sm font-medium ${
                  todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
                }`}>
                  {todo.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                className="text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-lg transition duration-150 border border-red-100"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}