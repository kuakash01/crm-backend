import { Pool, PoolClient } from "pg";
import { pool } from "../../config/db";

export interface ActivityInput {
  organizationId: number;
  entityType: string;
  entityId: number;
  activityType: string;
  description: string;
  createdBy: number;
}