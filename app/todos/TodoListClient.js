'use client';

import { useTransition, useRef, useState } from 'react';
import { addTodo, toggleTodo, deleteTodo, updateTodoTitle } from '../../actions/todos';

export default function TodoListClient({ todos }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null);

  // States to manage the edit task feature
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Status Bar Calculations
  const totalTasks = todos.length;
  const completedTasks = todos.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleToggle = (id, completed) => {
    startTransition(async () => {
      await toggleTodo(id, completed);
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      startTransition(async () => {
        await deleteTodo(id);
      });
    }
  };

  const handleAddAction = async (formData) => {
    await addTodo(formData);
    formRef.current?.reset();
  };

  // Edit Handlers
  const handleEditStart = (id, currentTitle) => {
    setEditingId(id);
    setEditText(currentTitle);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleEditSave = (id) => {
    if (!editText.trim()) return;
    startTransition(async () => {
      await updateTodoTitle(id, editText);
      setEditingId(null);
      setEditText('');
    });
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
          todos.map((todo) => {
            const isEditing = editingId === todo.id;

            return (
              <div 
                key={todo.id} 
                className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl border transition-all duration-150 ${
                  todo.completed ? 'border-gray-200 opacity-75' : 'border-gray-100 shadow-sm'
                }`}
              >
                <div className="flex-1 flex items-center gap-3">
                  {/* Hide Checkbox during editing */}
                  {!isEditing && (
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo.id, !todo.completed)}
                      className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  )}
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(todo.id);
                        if (e.key === 'Escape') handleEditCancel();
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className={`text-sm font-medium ${
                      todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}>
                      {todo.title}
                    </span>
                  )}
                </div>

                {/* Control Action Buttons */}
                <div className="flex gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditSave(todo.id)}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition duration-150 border border-emerald-100"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition duration-150 border border-gray-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditStart(todo.id, todo.title)}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-lg transition duration-150 border border-indigo-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(todo.id)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-lg transition duration-150 border border-red-100"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}