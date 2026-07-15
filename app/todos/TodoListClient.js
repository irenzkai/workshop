'use client';

import { useTransition, useRef, useState } from 'react';
import { addTodo, toggleTodo, deleteTodo, updateTodoTitle } from '../../actions/todos';

export default function TodoListClient({ todos }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef(null);

  // States to manage editing both title and description
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDesc, setEditDesc] = useState('');

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

  const handleEditStart = (id, currentTitle, currentDescription) => {
    setEditingId(id);
    setEditText(currentTitle);
    setEditDesc(currentDescription || '');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
    setEditDesc('');
  };

  const handleEditSave = (id) => {
    if (!editText.trim()) return;
    startTransition(async () => {
      await updateTodoTitle(id, editText, editDesc);
      setEditingId(null);
      setEditText('');
      setEditDesc('');
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Status Bar Layout */}
      <div className="bg-[#f0f2fe] border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[#4f46e5] font-semibold">
        <div className="flex gap-4">
          <span>Total: <strong className="text-indigo-800 text-base">{totalTasks}</strong></span>
          <span>Completed: <strong className="text-indigo-800 text-base">{completedTasks}</strong></span>
          <span>Pending: <strong className="text-indigo-800 text-base">{totalTasks - completedTasks}</strong></span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-indigo-700">{completionRate}% Done</span>
          <div className="flex-1 sm:w-44 bg-indigo-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-[#4f46e5] h-3 rounded-full transition-all duration-300" 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Form Inputs Stack & Add Task Button */}
      <form ref={formRef} action={handleAddAction} className="flex flex-col gap-3">
        <input
          name="title"
          type="text"
          placeholder="Task Title..."
          required
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm shadow-sm"
        />
        <input
          name="description"
          type="text"
          placeholder="Task Description..."
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm shadow-sm"
        />
        <button 
          type="submit" 
          className="bg-[#4f46e5] hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-150 text-sm shadow-sm"
        >
          Add Task
        </button>
      </form>

      {/* 3. Checklist Items Showing Titles & Descriptions */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-6 text-sm">No tasks yet. Add a task to get started!</p>
        ) : (
          todos.map((todo) => {
            const isEditing = editingId === todo.id;

            return (
              <div 
                key={todo.id} 
                className={`flex items-center justify-between p-5 bg-white rounded-xl border transition-all duration-150 ${
                  todo.completed ? 'border-gray-100 bg-gray-50/50 opacity-75' : 'border-gray-100 shadow-sm'
                }`}
              >
                <div className="flex-1 flex items-start gap-4">
                  {/* Custom Blue Checkbox */}
                  {!isEditing && (
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo.id, !todo.completed)}
                      className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer accent-[#4f46e5]"
                    />
                  )}
                  
                  {isEditing ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Edit Title..."
                        className="w-full px-3 py-1.5 border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(todo.id);
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Edit Description..."
                        className="w-full px-3 py-1.5 border border-indigo-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(todo.id);
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className={`text-base font-semibold ${
                        todo.completed ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </span>
                      {/* Show description underneath the title */}
                      {todo.description && (
                        <p className={`text-sm mt-1 leading-relaxed ${
                          todo.completed ? 'line-through text-gray-400' : 'text-gray-500'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Styled Edit and Delete Actions */}
                <div className="flex gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditSave(todo.id)}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition duration-150 border border-emerald-100"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition duration-150 border border-gray-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditStart(todo.id, todo.title, todo.description)}
                        className="text-sm font-semibold text-[#4f46e5] hover:text-indigo-700 bg-[#f0f2fe] hover:bg-indigo-100/80 px-4 py-2 rounded-lg transition duration-150 border border-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(todo.id)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-2 rounded-lg transition duration-150 border border-red-50"
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