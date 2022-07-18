import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { Model } from "../model";

type FilterExpression<V> = {
  $eq?: V;
  $gt?: V;
  $gte?: V;
  $lt?: V;
  $lte?: V;
  $startsWith?: V;
  $endsWith?: V;
};

type FilterQuery<T> = {
  [key in Extract<keyof T, string>]?: FilterExpression<T[key]>;
};

export const scan = async <T extends Model<z.ZodTypeAny>>(
  m: T,
  f: FilterQuery<z.infer<T["schema"]>>,
  c: DynamoDBDocumentClient
) => {
  const queries = new Map<
    string,
    { expression: string; attributeValue: string; attributeName: string }
  >();

  // build dynamo query from filter query
  Object.entries(f).forEach(([key, value]) => {
    if (value?.$eq) {
      queries.set(key, {
        expression: `#_${key} = :_${key}`,
        attributeName: key,
        attributeValue: value.$eq,
      });
    }

    if (value?.$gt) {
      queries.set(key, {
        expression: `#_${key} > :_${key}`,
        attributeName: key,
        attributeValue: value.$gt,
      });
    }

    if (value?.$gte) {
      queries.set(key, {
        expression: `#_${key} >= :_${key}`,
        attributeName: key,
        attributeValue: value.$gte,
      });
    }

    if (value?.$lt) {
      queries.set(key, {
        expression: `#_${key} < :_${key}`,
        attributeName: key,
        attributeValue: value.$lt,
      });
    }

    if (value?.$lte) {
      queries.set(key, {
        expression: `#_${key} <= :_${key}`,
        attributeName: key,
        attributeValue: value.$lte,
      });
    }

    if (value?.$startsWith) {
      queries.set(key, {
        expression: `begins_with(#_${key}, :_${key})`,
        attributeName: key,
        attributeValue: value.$startsWith,
      });
    }

    if (value?.$endsWith) {
      queries.set(key, {
        expression: `ends_with(#_${key}, :_${key})`,
        attributeName: key,
        attributeValue: value.$endsWith,
      });
    }
  });

  const input: ScanCommandInput = {
    TableName: m.tableName,
    FilterExpression: Array.from(queries.values())
      .map(({ expression }) => {
        return `${expression}`;
      })
      .join(" AND "),
    ExpressionAttributeValues: Array.from(queries.entries()).reduce(
      (acc, [key, { attributeValue }]) => {
        acc[`:_${key}`] = attributeValue;
        return acc;
      },
      {} as any
    ),
    ExpressionAttributeNames: Array.from(queries.entries()).reduce(
      (acc, [key, { attributeName }]) => {
        acc[`#_${key}`] = attributeName;
        return acc;
      },
      {} as any
    ),
  };

  const raw = await c.send(new ScanCommand(input));

  const data: any = [];

  if (raw.Items) {
    raw.Items.forEach((item) => {
      data.push(m.schema.parse(item) as z.infer<T["schema"]>);
    });
  }

  return { raw, data, count: raw.Count };
};
