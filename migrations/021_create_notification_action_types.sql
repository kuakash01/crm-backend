CREATE TYPE notification_action AS ENUM (
    'CREATED',
    'UPDATED',
    'ASSIGNED',
    'COMPLETED',
    'CONVERTED',
    'STAGE_CHANGED',
    'WON',
    'LOST',
    'DUE',
    'OVERDUE',
    'STATUS_CHANGED'
);