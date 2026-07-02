import { Pool, PoolClient } from "pg";
import { AppError } from "../../shared/errors/AppError";
import { pool } from "../../config/db";

type DealFilters = {
  stage?: string;
  customerId?: number;
  serviceId?: number;
  search?: string;
};

export const buildDealFilters = (
  filters?: DealFilters,
  startIndex = 1
) => {

  const conditions: string[] = [];

  const params: unknown[] = [];

  let index = startIndex;

  if (
    filters?.stage &&
    filters.stage !== "ALL"
  ) {

    conditions.push(
      `d.stage = $${index}`
    );

    params.push(
      filters.stage
    );

    index++;

  }

  if (filters?.customerId) {

    conditions.push(
      `d.customer_id = $${index}`
    );

    params.push(
      filters.customerId
    );

    index++;

  }

  if (filters?.serviceId) {

    conditions.push(
      `d.service_id = $${index}`
    );

    params.push(
      filters.serviceId
    );

    index++;

  }

  if (filters?.search) {

    conditions.push(`
      (
        d.title ILIKE $${index}
        OR c.company ILIKE $${index}
        OR CONCAT(c.fname,' ',COALESCE(c.lname,'')) ILIKE $${index}
        OR s.name ILIKE $${index}
      )
    `);

    params.push(
      `%${filters.search}%`
    );

    index++;

  }

  return {
    conditions,
    params,
  };

};


export const validateCustomerAndService = async (
  organizationId: number,
  customerId: number,
  serviceId: number,
  db: Pool | PoolClient = pool
) => {

  const validation = await db.query(
    `
    SELECT

      EXISTS (
        SELECT 1
        FROM customers
        WHERE
          id = $1
          AND organization_id = $2
      ) AS customer_exists,

      EXISTS (
        SELECT 1
        FROM services
        WHERE
          id = $3
          AND organization_id = $2
          AND is_active = TRUE
      ) AS service_exists
    `,
    [
      customerId,
      organizationId,
      serviceId
    ]
  );

  const {
    customer_exists,
    service_exists
  } = validation.rows[0];

  if (!customer_exists) {
    throw new AppError(
      "Customer not found",
      404
    );
  }

  if (!service_exists) {
    throw new AppError(
      "Service not found",
      404
    );
  }

};


export const buildDealCounts = (
  deals: { stage: string }[]
) => {

  const counts: Record<string, number> = {
    ALL: deals.length,
    OPEN: 0,
    QUOTATION_SENT: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0,
  };

  deals.forEach((deal) => {

    if (deal.stage in counts) {

      counts[deal.stage]++;

    }

  });

  return counts;

};