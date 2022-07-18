import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';
import { Model } from '../model';

export const del = async <T extends Model<z.ZodTypeAny>>(
  m: T,
  d: Partial<z.infer<T['schema']>>,
  c: DynamoDBDocumentClient
) => {
  const input: DeleteCommandInput = {
    TableName: m.tableName,
    Key: d,
  };

  const raw = await c.send(new DeleteCommand(input));

  return { raw };
};
