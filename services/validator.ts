import { AppError, AppModule, ValidationSchema } from '../types';

// Simulating AJV behavior for browser runtime without external heavy dependencies
export const validate = (data: any, schema: ValidationSchema, module: AppModule = AppModule.CORE): boolean => {
  if (schema.type === 'string') {
    if (typeof data !== 'string') throw new AppError('Invalid type: expected string', 'VAL_ERR_001', module);
    if (schema.minLength && data.length < schema.minLength) throw new AppError(`String too short (min ${schema.minLength})`, 'VAL_ERR_002', module);
    if (schema.maxLength && data.length > schema.maxLength) throw new AppError(`String too long (max ${schema.maxLength})`, 'VAL_ERR_003', module);
  }

  if (schema.type === 'number') {
    if (typeof data !== 'number') throw new AppError('Invalid type: expected number', 'VAL_ERR_004', module);
    if (schema.min !== undefined && data < schema.min) throw new AppError(`Number too small (min ${schema.min})`, 'VAL_ERR_005', module);
    if (schema.max !== undefined && data > schema.max) throw new AppError(`Number too large (max ${schema.max})`, 'VAL_ERR_006', module);
  }

  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null) throw new AppError('Invalid type: expected object', 'VAL_ERR_007', module);
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) throw new AppError(`Missing required field: ${field}`, 'VAL_ERR_008', module);
      }
    }
    if (schema.properties) {
      for (const key in schema.properties) {
        if (key in data) {
          validate(data[key], schema.properties[key], module);
        }
      }
    }
  }

  return true;
};