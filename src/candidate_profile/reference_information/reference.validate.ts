import Joi from 'joi';
import { _id, fullName, phone, company, position, candidateId } from '@/config/joi.config';

export const schemaReference = Joi.object({
  _id,
  fullName,
  phone,
  company,
  position,
  candidateId,
});
