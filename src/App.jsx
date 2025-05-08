import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient' // Ensure this path is correct
import './App.css' // We'll add some styles here

function App() {
  const [todos, setTodos] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTodos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }
      setTodos(data || [])
    } catch (err) {
      console.error('Error fetching todos:', err)
      setError(err.message || 'Failed to fetch todos.')
      setTodos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    try {
      const { data, error: insertError } = await supabase
        .from('todos')
        .insert([{ task: newTask.trim() }])
        .select()

      if (insertError) {
        throw insertError
      }
      if (data && data.length > 0) {
        setTodos((prevTodos) => [data[0], ...prevTodos])
      } else {
        fetchTodos() // Fallback refetch
      }
      setNewTask('')
    } catch (err) {
      console.error('Error adding task:', err)
      setError(err.message || 'Failed to add task.')
    }
  }

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('todos')
        .update({ is_completed: !currentStatus })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === id ? { ...todo, is_completed: !currentStatus } : todo
        )
      )
    } catch (err) {
      console.error('Error updating task:', err)
      setError(err.message || 'Failed to update task.')
    }
  }

  const handleDeleteTask = async (id) => {
    const originalTodos = [...todos];
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id)); // Optimistic update

    try {
      const { error: deleteError } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (deleteError) {
        setTodos(originalTodos); // Revert on error
        throw deleteError
      }
      // UI already updated if successful
    } catch (err) {
      console.error('Error deleting task:', err)
      setError(err.message || 'Failed to delete task.')
      // Ensure UI is reverted if it wasn't already or if the item is still present
      if (!todos.find(t => t.id === id)) {
         setTodos(originalTodos);
      }
    }
  }

  return (
    <div className="app-container">
      <h1>Supabase To-Do List (Vite + React)</h1>

      <form onSubmit={handleAddTask} className="add-task-form">
        <input
          type="text"
          placeholder="Add a new task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="task-input"
        />
        <button type="submit" className="submit-button">Add Task</button>
      </form>

      {error && <div className="error-message">Error: {error}</div>}

      {loading ? (
        <div className="loading-message">Loading tasks...</div>
      ) : todos.length === 0 && !error ? (
        <div className="loading-message">No tasks yet. Add one!</div>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
              <span
                onClick={() => handleToggleComplete(todo.id, todo.is_completed)}
                className="task-text"
              >
                {todo.task}
              </span>
              <button onClick={() => handleDeleteTask(todo.id)} className="delete-button">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App