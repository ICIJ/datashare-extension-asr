package org.icij.datashare;

import org.icij.datashare.asynctasks.Group;
import org.icij.datashare.asynctasks.Task;
import org.icij.datashare.asynctasks.TaskFilters;
import org.icij.datashare.asynctasks.TaskManager;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

public class MockTaskManager implements TaskManager {
    final List<Task<?>> startedTasks = new ArrayList<>();
    private boolean isUp = true;

    void setUp(boolean up) {
        this.isUp = up;
    }

    @Override
    public <V extends Serializable> String startTask(Task<V> taskView, Group group) {
        startedTasks.add(taskView);
        return taskView.id;
    }

    @Override
    public <V extends Serializable> Task<V> getTask(String taskId) {
        return null;
    }

    @Override
    public <V extends Serializable> Task<V> clearTask(String taskId) {
        return null;
    }

    @Override
    public boolean stopTask(String taskId) {
        return false;
    }

    @Override
    public Stream<Task<?>> getTasks(TaskFilters filters) {
        return Stream.empty();
    }

    @Override
    public Stream<String> getTaskIds(TaskFilters filters) {
        return Stream.empty();
    }

    @Override
    public List<Task<?>> clearDoneTasks(TaskFilters filter) {
        return List.of();
    }

    @Override
    public boolean shutdown() {
        return true;
    }

    @Override
    public void clear() {}

    @Override
    public boolean getHealth() {
        return isUp;
    }

    @Override
    public int getTerminationPollingInterval() {
        return 100;
    }

    @Override
    public void close() {}
}
