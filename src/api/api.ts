import express, { Application } from 'express';
import cors from 'cors';
import { ValidatorRoutes, PoolRoutes } from './routes';
import { DB } from '../db';

export class API { 
  app: Application = express();
  port: number;
  db: DB;

  constructor(_db: DB, _port: number) {
    this.port = _port;
    this.db = _db;
    this.start();
  }

  start() {
    const port = this.port;
    this.app.use(express.json());
    this.app.use(cors());
    this.configureRoutes();
    this.app.listen(port, () => {
      console.log(`API started: running on port ${port}`);
    });
  }

  configureRoutes() {
    ValidatorRoutes(this.app, this.db); 
    PoolRoutes(this.app, this.db);
  }
}



