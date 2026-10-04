import Joi from 'joi';
import {
  _id,
  _boolean,
  _arrayString,
  candidateId,
  startDate,
  endDate,
  _stringDefault,
  descriptionOptional,
} from '@/config/joi.config';

export const schemaCertificate = Joi.object({
  _id,
  name: _stringDefault({ min: 0, max: 50, title: 'Chứng chỉ' }),
  organization: _stringDefault({ min: 0, max: 50, title: 'Tổ chức' }),
  description: descriptionOptional,
  startDate,
  endDate,
  isNoExpiration: _boolean,
  images: _arrayString,
  candidateId,
});
