export const shiftSqlParams = (
  conditions: string[],
  shift: number
) => {

  return conditions
    .map(condition =>
      condition.replace(
        /\$(\d+)/g,
        (_, n) =>
          `$${Number(n) + shift}`
      )
    )
    .join(" AND ");

};



