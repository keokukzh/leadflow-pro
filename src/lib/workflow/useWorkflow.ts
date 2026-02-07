// ============================================
// LeadFlow Pro - Workflow Hooks
// ============================================

import { useState, useCallback } from 'react';
import type { Workflow, WorkflowTemplate, WorkflowExecution } from './types';

interface UseWorkflowOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseWorkflowReturn {
  // Workflow state
  workflows: Workflow[];
  templates: WorkflowTemplate[];
  executions: WorkflowExecution[];
  
  // Loading states
  isLoading: boolean;
  isExecuting: boolean;
  
  // Actions
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Workflow>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  
  executeWorkflow: (id: string, input?: Record<string, unknown>) => Promise<WorkflowExecution>;
  cancelExecution: (executionId: string) => Promise<void>;
  
  duplicateTemplate: (templateId: string) => Promise<Workflow>;
  
  // Utilities
  refresh: () => Promise<void>;
  getExecution: (id: string) => WorkflowExecution | undefined;
}

export function useWorkflow(options: UseWorkflowOptions = {}): UseWorkflowReturn {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [workflowsRes, templatesRes, executionsRes] = await Promise.all([
        fetch('/api/workflow'),
        fetch('/api/workflow/templates'),
        fetch('/api/monitoring/executions'),
      ]);

      const workflowsData = await workflowsRes.json();
      const templatesData = await templatesRes.json();
      const executionsData = await executionsRes.json();

      setWorkflows(workflowsData.workflows || []);
      setTemplates(templatesData.templates || []);
      setExecutions(executionsData.executions || []);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto refresh
  useState(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval);
      return () => clearInterval(interval);
    }
  });

  // Create workflow
  const createWorkflow = useCallback(async (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await fetch('/api/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });

    if (!res.ok) {
      throw new Error('Failed to create workflow');
    }

    const created = await res.json();
    setWorkflows((prev) => [created, ...prev]);
    return created;
  }, []);

  // Update workflow
  const updateWorkflow = useCallback(async (id: string, updates: Partial<Workflow>) => {
    const res = await fetch(`/api/workflow/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error('Failed to update workflow');
    }

    const updated = await res.json();
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? updated : w))
    );
    return updated;
  }, []);

  // Delete workflow
  const deleteWorkflow = useCallback(async (id: string) => {
    const res = await fetch(`/api/workflow/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete workflow');
    }

    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // Execute workflow
  const executeWorkflow = useCallback(async (id: string, input?: Record<string, unknown>) => {
    setIsExecuting(true);
    try {
      const res = await fetch(`/api/workflow/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        throw new Error('Failed to execute workflow');
      }

      const execution = await res.json();
      setExecutions((prev) => [execution, ...prev]);
      return execution;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  // Cancel execution
  const cancelExecution = useCallback(async (executionId: string) => {
    const res = await fetch(`/api/monitoring/executions/${executionId}/cancel`, {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('Failed to cancel execution');
    }

    setExecutions((prev) =>
      prev.map((e) =>
        e.id === executionId ? { ...e, status: 'cancelled' } : e
      )
    );
  }, []);

  // Duplicate template
  const duplicateTemplate = useCallback(async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return createWorkflow({
      name: `${template.name} (Copy)`,
      description: template.description,
      steps: template.steps,
      trigger: 'manual',
      enabled: false,
      config: {},
    });
  }, [templates, createWorkflow]);

  // Get single execution
  const getExecution = useCallback(
    (id: string) => executions.find((e) => e.id === id),
    [executions]
  );

  return {
    workflows,
    templates,
    executions,
    isLoading,
    isExecuting,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    cancelExecution,
    duplicateTemplate,
    refresh: loadData,
    getExecution,
  };
}
