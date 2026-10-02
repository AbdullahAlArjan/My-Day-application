import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCategories } from '@/hooks/useCategories';
import type { Task, PriorityLevel, Subtask } from '@/types/database';
import {
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  FileText,
  Check,
} from 'lucide-react';

interface TaskDetailsProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  onDelete: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleComplete,
}) => {
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setNotes(task.notes || '');
      setCategoryId(task.category_id || null);
      setPriority(task.priority || 'medium');
      setDueDate(task.due_date || '');
      setDueTime(task.due_time || '');
      setSubtasks(task.subtasks || []);
      setSaveStatus('idle');
    }
  }, [task]);

  if (!task) return null;

  const isCompleted = task.status === 'completed';

  const handleSaveField = async (fieldUpdates: Partial<Task>) => {
    setSaveStatus('saving');
    try {
      await onUpdate(task.id, fieldUpdates);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save field:', err);
      setSaveStatus('idle');
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    const updatedSubtasks = subtasks.map((s) =>
      s.id === subtask.id ? { ...s, is_completed: !s.is_completed } : s
    );
    setSubtasks(updatedSubtasks);
    await handleSaveField({ subtasks: updatedSubtasks });
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `subtask-${Date.now()}`,
      task_id: task.id,
      user_id: task.user_id,
      title: newSubtaskTitle.trim(),
      is_completed: false,
      sort_order: subtasks.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    await handleSaveField({ subtasks: updated });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const updated = subtasks.filter((s) => s.id !== subtaskId);
    setSubtasks(updated);
    await handleSaveField({ subtasks: updated });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleComplete(task)}
            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-[var(--border-strong)] hover:border-brand-500'
            }`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
          <span className="text-base font-semibold text-[var(--text-primary)]">
            Task Details
          </span>
        </div>
      }
      description={`Created on ${new Date(task.created_at).toLocaleDateString()} ${
        task.completed_at ? `• Completed on ${new Date(task.completed_at).toLocaleDateString()}` : ''
      }`}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5">
        {/* Autosave feedback badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-brand-600 animate-pulse font-medium">
                Saving changes...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 font-medium">
                Saved to Supabase ✓
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-xs text-[var(--text-muted)]">
                Changes save automatically
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDuplicate(task)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs flex items-center gap-1"
              title="Duplicate Task"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs flex items-center gap-1"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Editable Title */}
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== task.title) {
                handleSaveField({ title: title.trim() });
              }
            }}
            placeholder="Task title"
            className="w-full text-lg font-bold text-[var(--text-primary)] bg-transparent border-b border-transparent hover:border-[var(--border-subtle)] focus:border-brand-500 focus:outline-none py-1 transition-all"
          />
        </div>

        {/* Editable Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (task.description || '')) {
                handleSaveField({ description: description.trim() || null });
              }
            }}
            placeholder="Add description..."
            className="w-full bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:outline-none p-3 shadow-subtle resize-none"
          />
        </div>

        {/* Priority & Category Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                const val = e.target.value as PriorityLevel;
                setPriority(val);
                handleSaveField({ priority: val });
              }}
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] py-2 px-3 focus:outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Category
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setCategoryId(val);
                handleSaveField({ category_id: val });
              }}
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] py-2 px-3 focus:outline-none"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Due Date</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                const val = e.target.value;
                setDueDate(val);
                handleSaveField({ due_date: val || null });
              }}
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] py-2 px-3 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Due Time</span>
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => {
                const val = e.target.value;
                setDueTime(val);
                handleSaveField({ due_time: val || null });
              }}
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm rounded-xl border border-[var(--border-subtle)] py-2 px-3 focus:outline-none"
            />
          </div>
        </div>

        {/* Subtask checklist */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Subtasks ({subtasks.filter((s) => s.is_completed).length}/{subtasks.length})</span>
          </label>

          <div className="flex flex-col gap-1.5">
            {subtasks.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(st)}
                    className="text-[var(--text-muted)] hover:text-emerald-500"
                  >
                    {st.is_completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    className={`text-xs ${
                      st.is_completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(st.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              placeholder="Add step..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 bg-[var(--bg-surface)] text-xs rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-[var(--text-primary)] focus:outline-none"
            />
            <Button size="sm" variant="secondary" onClick={handleAddSubtask} type="button">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Detailed Notes */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Notes</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (task.notes || '')) {
                handleSaveField({ notes: notes.trim() || null });
              }
            }}
            placeholder="Add detailed markdown notes, references, thoughts..."
            className="w-full bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] focus:border-brand-500 focus:outline-none p-3 shadow-subtle resize-none"
          />
        </div>

        {/* Close action */}
        <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
