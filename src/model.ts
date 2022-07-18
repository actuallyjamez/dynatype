import { z } from 'zod';

export class Model<T extends z.ZodTypeAny> {
  tableName: string;

  schema: T;

  constructor(t: string, s: T) {
    this.tableName = t;
    this.schema = s;
  }
}
