import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { Model } from "../model";

export const put = async <T extends Model<z.ZodTypeAny>>(
  m: T,
  d: z.infer<T["schema"]>,
  c: DynamoDBDocumentClient
) => {
  const data = m.schema.parse(d) as z.infer<T["schema"]>;

  const input: PutCommandInput = {
    TableName: m.tableName,
    Item: data,
  };

  const raw = await c.send(new PutCommand(input));

  return { raw, data };
};
