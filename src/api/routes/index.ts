import { Router } from 'express';
import { pool } from './pool';
import { validator } from './validator';

export const routes = Router();
routes.use(pool, validator)
