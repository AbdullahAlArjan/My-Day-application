import React from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/types/database';

interface CalendarPageProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTaskWithDate: (dateStr: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onSelectTask,
  onOpenCreateTaskWithDate,
}) => {
  const { tasks } = useTasks();

  return (
    <div className="flex flex-col gap-6">
      <CalendarView
        tasks={tasks}
        onSelectTask={onSelectTask}
        onDateClick={onOpenCreateTaskWithDate}
      />
    </div>
  );
};
