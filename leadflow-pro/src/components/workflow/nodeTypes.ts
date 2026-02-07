import { NodeTypes } from '@xyflow/react';
import TaskNode from './TaskNode';

// In the future, we can add specialized nodes like:
// import { ConditionNode } from './ConditionNode';
// import { EmailNode } from './EmailNode';

export const nodeTypes: NodeTypes = {
  task: TaskNode,
  // email: EmailNode,
  // condition: ConditionNode,
};

export const nodeIcons = {
  task: '📋',
  condition: '🔀',
  email: '📧',
  call: '📞',
  wait: '⏰',
  webhook: '🔗',
  notification: '🔔',
  database: '🗄️',
  api: '🌐',
};
