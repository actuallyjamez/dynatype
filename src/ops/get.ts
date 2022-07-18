import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { Model } from '../model';

export const get = async <T extends Model<z.ZodTypeAny>>(
  m: T,
  d: Partial<z.infer<T['schema']>>,
  c: DynamoDBDocumentClient,
  o?: { include?: Array<Extract<keyof z.infer<T['schema']>, string>> }
) => {
  const input: GetCommandInput = {
    TableName: m.tableName,
    Key: d,
    AttributesToGet: o?.include,
    ConsistentRead: true,
  };

  const raw = await c.send(new GetCommand(input));

  let data = undefined;

  if (raw.Item) {
    data = m.schema.parse(raw.Item) as z.infer<T['schema']>;
  }

  return { raw, data };
};
